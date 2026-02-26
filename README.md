# Nutri-ID 🇨🇮
**Plateforme Nationale de Santé et d'Identité Médicale de Côte d'Ivoire**

Nutri-ID is the official HealthTech platform combining medical identity, universal health coverage (CMU) tracking, nutrition analytics, and blockchain-secured health records for the citizens of Côte d'Ivoire.

---

## 🌍 Langues Supportées (Multi-Language)
- 🇫🇷 Français
- 🇨🇮 Dioula (Dyula)
- 🇨🇮 Baoulé
- (Bété & Agni in progress)

## 🏗️ Architecture du Projet

1. **Frontend (SPA)**: `frontend/`
   - Pure HTML5, CSS3, JavaScript (Vanilla).
   - Glassmorphism UI, Responsive, Dark/Light Mode.
   - *Pas de build complexe, ouvrez simplement `index.html`.*

2. **Backend (API Rust)**: `backend/`
   - Framework: **Axum** (Rust)
   - Base de données: **PostgreSQL** (via SQLx)
   - Authentification: JWT

3. **Blockchain (Polygon)**: `blockchain/`
   - Contrats intelligents (Solidity) pour l'identité de santé immuable (SBT - Soulbound Token).

4. **Infrastructure**: `docker-compose.yml`
   - Déploiement simplifié de la base de données et de l'API.

---

## 🚀 Démarrage Rapide (Quick Start)

### 1. Lancer le Frontend
```bash
# Il suffit d'ouvrir le fichier index.html dans votre navigateur
# ou utiliser un serveur local basique :
cd frontend
python -m http.server 8000
```
Ouvrez ensuite `http://localhost:8000` dans votre navigateur.

### 2. Lancer le Backend Rust
Assurez-vous d'avoir [Rust installé](https://rustup.rs/).
```bash
cd backend
cargo run
```
Le serveur sera disponible sur `http://localhost:3000`.

### 3. Lancer l'Infrastructure (PostgreSQL)
```bash
docker-compose up -d postgres
```

---

## 📜 Contrats Intelligents (Smart Contracts)
Le contrat `HealthID.sol` est un Soulbound Token (non-transférable). Il représente l'identité médicale unique du citoyen sur le réseau Polygon. Il garantit la souveraineté des données de santé sans exposer le dossier médical sensible sur la chaîne publique.

> *Ministère de la Santé et de l'Hygiène Publique — République de Côte d'Ivoire*
