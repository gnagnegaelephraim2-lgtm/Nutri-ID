use crate::auth::Claims;
use axum::{extract::State, http::StatusCode, routing::post, Json, Router};
use serde::{Deserialize, Serialize};
use sqlx::{Row, SqlitePool};
use std::env;

pub fn router() -> Router<SqlitePool> {
    Router::new().route("/chat", post(chat_handler))
}

#[derive(Deserialize, Debug)]
pub struct ChatMessage {
    role: String,
    parts: Vec<ChatPart>,
}

#[derive(Deserialize, Serialize, Debug, Clone)]
pub struct ChatPart {
    text: String,
}

#[derive(Deserialize, Debug)]
pub struct ChatRequest {
    message: String,
    history: Option<Vec<ChatMessage>>, // previous messages
}

#[derive(Serialize)]
pub struct ChatResponse {
    reply: String,
}

async fn chat_handler(
    claims: Claims,
    State(pool): State<SqlitePool>,
    Json(payload): Json<ChatRequest>,
) -> Result<Json<ChatResponse>, (StatusCode, String)> {
    // 1. Fetch user data for personalized system prompt
    let id_str = claims.sub.to_string();
    let user_row = sqlx::query(
        r#"
        SELECT u.email, p.full_name, p.national_id, p.blood_type, p.cmu_active 
        FROM users u
        LEFT JOIN patients p ON u.id = p.user_id
        WHERE u.id = ?
        "#,
    )
    .bind(&id_str)
    .fetch_optional(&pool)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let mut user_context = String::new();
    if let Some(row) = user_row {
        let name: String = row
            .try_get("full_name")
            .unwrap_or_else(|_| "Utilisateur".into());
        let nip: String = row.try_get("national_id").unwrap_or_default();
        let blood: String = row
            .try_get("blood_type")
            .unwrap_or_else(|_| "Inconnu".into());
        let cmu: bool = row.try_get("cmu_active").unwrap_or(false);

        user_context = format!(
            "Patient: {}. NIP: {}. Groupe sanguin: {}. CMU: {}.",
            name,
            nip,
            blood,
            if cmu { "Actif" } else { "Inactif" }
        );
    }

    // Fetch last 5 nutrition logs for context
    let meal_rows = sqlx::query(
        "SELECT meal_name, calories, logged_at FROM nutrition_logs \
         WHERE patient_id = ? ORDER BY logged_at DESC LIMIT 5",
    )
    .bind(&id_str)
    .fetch_all(&pool)
    .await
    .unwrap_or_default();

    let meal_context = if meal_rows.is_empty() {
        "Aucun repas enregistré récemment.".to_string()
    } else {
        let entries: Vec<String> = meal_rows
            .iter()
            .map(|r| {
                let meal: String = r.try_get("meal_name").unwrap_or_default();
                let kcal: f64 = r.try_get("calories").unwrap_or(0.0);
                let date: String = r.try_get("logged_at").unwrap_or_default();
                format!(
                    "- {} ({:.0} kcal, {})",
                    meal,
                    kcal,
                    &date[..10.min(date.len())]
                )
            })
            .collect();
        format!("Derniers repas:\n{}", entries.join("\n"))
    };

    // Fetch last 3 vaccines for context
    let vaccine_rows = sqlx::query(
        "SELECT vaccine_name, dose, administered_at FROM vaccines \
         WHERE patient_id = ? ORDER BY administered_at DESC LIMIT 3",
    )
    .bind(&id_str)
    .fetch_all(&pool)
    .await
    .unwrap_or_default();

    let vaccine_context = if vaccine_rows.is_empty() {
        "Aucun vaccin enregistré.".to_string()
    } else {
        let entries: Vec<String> = vaccine_rows
            .iter()
            .map(|r| {
                let name: String = r.try_get("vaccine_name").unwrap_or_default();
                let dose: String = r.try_get("dose").unwrap_or_default();
                let date: String = r.try_get("administered_at").unwrap_or_default();
                format!("- {} (dose {}, {})", name, dose, date)
            })
            .collect();
        format!("Vaccins récents:\n{}", entries.join("\n"))
    };

    let system_prompt = format!(
        "Tu es NutriBot, l'assistant médical et nutritionnel de Nutri-ID en Côte d'Ivoire. \
         {user_context} \
         \n\n{meal_context}\n\n{vaccine_context}\n\n\
         Utilise ces données pour personnaliser tes conseils. \
         Maintiens un ton professionnel, encourageant et chaleureux. \
         Tu connais parfaitement la gastronomie ivoirienne (Garba, Alloco, Foutou, Attiéké, etc.) \
         et tu sais conseiller sur la nutrition par rapport aux habitudes locales. \
         Réponds en français. Fais des réponses concises, utilise du markdown pour formater (gras, listes).",
    );

    let api_key = env::var("GEMINI_API_KEY").map_err(|_| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            "GEMINI_API_KEY non configurée".into(),
        )
    })?;

    let client = reqwest::Client::new();
    let url = format!(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={}",
        api_key
    );

    // Build Gemini request body
    // Map history to Gemini format
    let mut contents = serde_json::json!([]);
    if let Some(history) = payload.history {
        for msg in history {
            // "model" is Gemini's role name for itself
            let role = if msg.role == "bot" || msg.role == "model" {
                "model"
            } else {
                "user"
            };
            let texts: Vec<String> = msg.parts.into_iter().map(|p| p.text).collect();
            contents.as_array_mut().unwrap().push(serde_json::json!({
                "role": role,
                "parts": [{"text": texts.join("\n")}]
            }));
        }
    }

    // Add current user message
    contents.as_array_mut().unwrap().push(serde_json::json!({
        "role": "user",
        "parts": [{"text": payload.message}]
    }));

    let gemini_req = serde_json::json!({
        "systemInstruction": {
            "parts": [{"text": system_prompt}]
        },
        "contents": contents,
        "generationConfig": {
            "temperature": 0.7,
            "maxOutputTokens": 800
        }
    });

    let res = client
        .post(&url)
        .json(&gemini_req)
        .send()
        .await
        .map_err(|e| {
            (
                StatusCode::BAD_GATEWAY,
                format!("Erreur réseau Gemini: {}", e),
            )
        })?;

    if !res.status().is_success() {
        let err_text = res.text().await.unwrap_or_default();
        tracing::error!("Gemini API Error: {}", err_text);
        return Err((
            StatusCode::BAD_GATEWAY,
            format!("Erreur API Gemini: {}", err_text),
        ));
    }

    let raw_json: serde_json::Value = res.json().await.map_err(|e| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Erreur parsing réponse Gemini: {}", e),
        )
    })?;

    // Extract text from: { "candidates": [ { "content": { "parts": [ { "text": "..." } ] } } ] }
    let reply = raw_json["candidates"][0]["content"]["parts"][0]["text"]
        .as_str()
        .unwrap_or("Désolé, je n'ai pas pu générer de réponse.")
        .to_string();

    Ok(Json(ChatResponse { reply }))
}
