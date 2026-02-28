use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
pub struct NutritionLog {
    pub id: String,
    pub patient_id: String,
    pub meal_name: String,
    pub proteins: f64,
    pub carbs: f64,
    pub fats: f64,
    pub calories: f64,
    pub logged_at: Option<String>,
}

#[derive(Deserialize)]
pub struct CreateNutritionLogRequest {
    pub meal_name: String,
    pub proteins: f64,
    pub carbs: f64,
    pub fats: f64,
}
