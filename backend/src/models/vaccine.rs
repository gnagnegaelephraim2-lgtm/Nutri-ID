use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
pub struct Vaccine {
    pub id: String,
    pub patient_id: String,
    pub vaccine_name: String,
    pub dose: String,
    pub administered_at: String,
    pub facility_name: Option<String>,
    pub next_dose_at: Option<String>,
    pub created_at: Option<String>,
}

#[derive(Deserialize)]
pub struct CreateVaccineRequest {
    pub vaccine_name: String,
    pub dose: String,
    pub administered_at: String,
    pub facility_name: Option<String>,
    pub next_dose_at: Option<String>,
}
