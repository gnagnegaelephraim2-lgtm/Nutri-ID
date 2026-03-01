use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Serialize, Deserialize, FromRow, Clone)]
pub struct Teleconsultation {
    pub id: String,
    pub patient_id: String,
    pub doctor_id: Option<String>,
    pub scheduled_at: String, // Stored as ISO8601 string or timestamp in SQLite
    pub status: String,       // 'pending', 'confirmed', 'completed', 'canceled'
    pub meeting_link: Option<String>,
    pub notes: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

/// Like Teleconsultation but includes the patient's display name via JOIN.
/// Used exclusively by doctor-facing endpoints.
#[derive(Debug, Serialize, Deserialize, FromRow, Clone)]
pub struct TeleconsultationWithPatient {
    pub id: String,
    pub patient_id: String,
    pub patient_name: Option<String>,
    pub doctor_id: Option<String>,
    pub scheduled_at: String,
    pub status: String,
    pub meeting_link: Option<String>,
    pub notes: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
pub struct CreateTeleconsultPayload {
    pub doctor_id: Option<String>,
    pub scheduled_at: String, // Expecting ISO8601 string e.g., "2026-03-05T10:00:00Z"
    pub notes: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateTeleconsultStatusPayload {
    pub status: String,
    pub meeting_link: Option<String>,
    pub notes: Option<String>,
}
