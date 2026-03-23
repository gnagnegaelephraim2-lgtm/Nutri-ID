use crate::auth::Claims;
use axum::{
    extract::{DefaultBodyLimit, State},
    http::StatusCode,
    routing::post,
    Json, Router,
};
use serde::{Deserialize, Serialize};
use sqlx::{Row, SqlitePool};
use std::env;

pub fn router() -> Router<SqlitePool> {
    Router::new().route("/chat", post(chat_handler)).route(
        "/analyze-food",
        post(analyze_food_handler).layer(DefaultBodyLimit::max(10 * 1024 * 1024)), // 10 MB for base64 images
    )
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
    response: String,
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

    let api_key = env::var("ANTHROPIC_API_KEY").map_err(|_| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            "ANTHROPIC_API_KEY non configurée".into(),
        )
    })?;

    let client = reqwest::Client::new();

    // Build Anthropic messages array from history
    // Gemini used role "model"; Anthropic uses "assistant"
    let mut messages: Vec<serde_json::Value> = Vec::new();
    if let Some(history) = payload.history {
        for msg in history {
            let role = if msg.role == "model" || msg.role == "assistant" {
                "assistant"
            } else {
                "user"
            };
            let text = msg.parts.into_iter().map(|p| p.text).collect::<Vec<_>>().join("\n");
            messages.push(serde_json::json!({
                "role": role,
                "content": text
            }));
        }
    }

    // Add current user message
    messages.push(serde_json::json!({
        "role": "user",
        "content": payload.message
    }));

    let claude_req = serde_json::json!({
        "model": "claude-opus-4-6",
        "max_tokens": 800,
        "system": system_prompt,
        "messages": messages
    });

    let res = client
        .post("https://api.anthropic.com/v1/messages")
        .header("x-api-key", &api_key)
        .header("anthropic-version", "2023-06-01")
        .header("content-type", "application/json")
        .json(&claude_req)
        .send()
        .await
        .map_err(|e| {
            (
                StatusCode::BAD_GATEWAY,
                format!("Erreur réseau Claude: {}", e),
            )
        })?;

    if !res.status().is_success() {
        let err_text = res.text().await.unwrap_or_default();
        tracing::error!("Claude API Error: {}", err_text);
        return Err((
            StatusCode::BAD_GATEWAY,
            format!("Erreur API Claude: {}", err_text),
        ));
    }

    let raw_json: serde_json::Value = res.json().await.map_err(|e| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Erreur parsing réponse Claude: {}", e),
        )
    })?;

    // Extract text from: { "content": [ { "type": "text", "text": "..." } ] }
    let response = raw_json["content"][0]["text"]
        .as_str()
        .unwrap_or("Désolé, je n'ai pas pu générer de réponse.")
        .to_string();

    Ok(Json(ChatResponse { response }))
}

// ─── Food Photo Analysis ──────────────────────────────────────────────────────

#[derive(Deserialize)]
struct FoodImageRequest {
    image_base64: String,
    mime_type: String,
}

#[derive(Deserialize, Serialize)]
struct FoodAnalysis {
    meal_name: String,
    proteins: f64,
    carbs: f64,
    fats: f64,
    description: String,
}

async fn analyze_food_handler(
    _claims: Claims,
    Json(payload): Json<FoodImageRequest>,
) -> Result<Json<FoodAnalysis>, (StatusCode, String)> {
    let api_key = env::var("ANTHROPIC_API_KEY").map_err(|_| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            "ANTHROPIC_API_KEY non configurée".into(),
        )
    })?;

    let client = reqwest::Client::new();

    let prompt_text = "Analyse cette image de nourriture. Identifie le plat (nom en français, \
        nom ivoirien local si applicable: Garba, Attiéké, Foutou, Alloco, etc.). \
        Estime les valeurs nutritionnelles pour une portion standard. \
        Réponds UNIQUEMENT en JSON valide, sans markdown, sans explication: \
        {\"meal_name\": \"...\", \"proteins\": <number>, \"carbs\": <number>, \"fats\": <number>, \"description\": \"...\"}";

    let claude_req = serde_json::json!({
        "model": "claude-opus-4-6",
        "max_tokens": 800,
        "messages": [{
            "role": "user",
            "content": [
                {
                    "type": "image",
                    "source": {
                        "type": "base64",
                        "media_type": payload.mime_type,
                        "data": payload.image_base64
                    }
                },
                {
                    "type": "text",
                    "text": prompt_text
                }
            ]
        }]
    });

    let res = client
        .post("https://api.anthropic.com/v1/messages")
        .header("x-api-key", &api_key)
        .header("anthropic-version", "2023-06-01")
        .header("content-type", "application/json")
        .json(&claude_req)
        .send()
        .await
        .map_err(|e| {
            (
                StatusCode::BAD_GATEWAY,
                format!("Erreur réseau Claude: {}", e),
            )
        })?;

    if !res.status().is_success() {
        let err_text = res.text().await.unwrap_or_default();
        tracing::error!("Claude analyze-food Error: {}", err_text);
        return Err((
            StatusCode::BAD_GATEWAY,
            format!("Erreur API Claude: {}", err_text),
        ));
    }

    let raw_json: serde_json::Value = res.json().await.map_err(|e| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Erreur parsing réponse Claude: {}", e),
        )
    })?;

    let text = raw_json["content"][0]["text"]
        .as_str()
        .unwrap_or("")
        .to_string();

    tracing::info!("📸 Raw Claude analyze-food response: {}", text);

    // Strip possible markdown fences
    let cleaned = text
        .trim()
        .trim_start_matches("```json")
        .trim_start_matches("```")
        .trim_end_matches("```")
        .trim()
        .to_string();

    // Robustly extract the JSON object: find first '{' and last '}'
    let json_start = cleaned.find('{').ok_or_else(|| {
        (
            StatusCode::UNPROCESSABLE_ENTITY,
            format!(
                "Aucun JSON trouvé dans la réponse IA. Réponse brute: {}",
                text
            ),
        )
    })?;
    let json_end = cleaned.rfind('}').ok_or_else(|| {
        (
            StatusCode::UNPROCESSABLE_ENTITY,
            format!("JSON incomplet dans la réponse IA. Réponse brute: {}", text),
        )
    })?;
    let json_str = &cleaned[json_start..=json_end];

    let analysis: FoodAnalysis = serde_json::from_str(json_str).map_err(|e| {
        (
            StatusCode::UNPROCESSABLE_ENTITY,
            format!(
                "Impossible de parser la réponse IA: {}. JSON extrait: {}",
                e, json_str
            ),
        )
    })?;

    Ok(Json(analysis))
}
