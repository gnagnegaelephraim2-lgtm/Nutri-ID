# Nutri-ID — Documentation Générale

> Plateforme Nationale de Santé et d'Identité Médicale — République de Côte d'Ivoire

---

## Table des matières

1. [Vue d'ensemble](#1-vue-densemble)
2. [Architecture technique](#2-architecture-technique)
3. [Fonctionnalités principales](#3-fonctionnalités-principales)
4. [Pages et modules (Frontend)](#4-pages-et-modules-frontend)
5. [API Backend](#5-api-backend)
6. [Base de données](#6-base-de-données)
7. [Blockchain & Identité Numérique](#7-blockchain--identité-numérique)
8. [Intelligence Artificielle](#8-intelligence-artificielle)
9. [Sécurité](#9-sécurité)
10. [Internationalisation](#10-internationalisation)
11. [Infrastructure & Déploiement](#11-infrastructure--déploiement)
12. [Variables d'environnement](#12-variables-denvironnement)

---

## 1. Vue d'ensemble

**Nutri-ID** est une plateforme nationale de santé numérique conçue pour la Côte d'Ivoire. Elle centralise l'identité médicale, le suivi nutritionnel, le carnet de vaccination, les consultations médicales à distance, et la couverture maladie universelle (CMU) dans une seule application sécurisée.

### Objectifs

- Fournir à chaque citoyen ivoirien un **identifiant de santé unique et infalsifiable** (HealthID) ancré sur la blockchain Polygon.
- Permettre un **suivi nutritionnel intelligent** grâce à l'analyse par IA (Claude Opus 4.6).
- Digitaliser le **carnet de santé** : vaccinations, ordonnances, résultats d'examens, consultations.
- Faciliter l'accès aux **téléconsultations médicales** avec des médecins référencés.
- Respecter les pratiques **culturelles et religieuses** (suivi du jeûne Ramadan, Carême, Daniel, etc.).
- Supporter **14 langues** dont 9 langues locales ivoiriennes.

### Chiffres clés

| Indicateur | Valeur |
|---|---|
| Centres de santé référencés | 1 063+ |
| Langues supportées | 14 (5 internationales + 9 locales) |
| Réseau blockchain | Polygon (Amoy testnet / Mainnet) |
| Modèle IA | Claude Opus 4.6 (Anthropic) |

---

## 2. Architecture technique

```
┌─────────────────────────────────────────────────────────┐
│                     UTILISATEUR                         │
└──────────────────────────┬──────────────────────────────┘
                           │ HTTPS
┌──────────────────────────▼──────────────────────────────┐
│              FRONTEND (React + Vite + TypeScript)        │
│         Hébergé sur Railway · Servi par Nginx            │
│                                                          │
│  Pages : Login · Dashboard · Nutrition · Vaccins        │
│          HealthID · Téléconsult · Jeûne · CMU · ...      │
└──────────────────────────┬──────────────────────────────┘
                           │ /api/* (reverse proxy Nginx)
┌──────────────────────────▼──────────────────────────────┐
│           BACKEND (Rust · Axum · SQLite)                 │
│                  Hébergé sur Railway                     │
│                                                          │
│  Auth · Dashboard · Nutrition · Vaccins · Records       │
│  Téléconsult · Jeûne · Blockchain · IA · Médecin        │
└───────────────┬──────────────────┬──────────────────────┘
                │                  │
┌───────────────▼──────┐  ┌────────▼──────────────────────┐
│  SQLite (Volume)      │  │  APIs Externes                │
│  /app/data/           │  │  · Anthropic (Claude)         │
│  nutriid.db           │  │  · Polygon RPC (blockchain)   │
└──────────────────────┘  │  · Pinata (IPFS)              │
                          │  · Resend (email)              │
                          └───────────────────────────────┘
```

### Stack technologique

| Couche | Technologie |
|---|---|
| Frontend | React 18, TypeScript, Vite, TailwindCSS |
| UI Components | shadcn/ui, Framer Motion, Recharts |
| Backend | Rust, Axum, sqlx |
| Base de données | SQLite (persistée via volume Railway) |
| Authentification | JWT (JSON Web Token) + bcrypt |
| Blockchain | Polygon, Solidity, ethers.js, Hardhat |
| IA | Anthropic Claude Opus 4.6 |
| Stockage décentralisé | IPFS via Pinata |
| Email | Resend API |
| Reverse proxy | Nginx |
| CI/CD | Railway (backend + frontend), GitHub |

---

## 3. Fonctionnalités principales

### 3.1 Authentification & Profil
- Inscription (patient ou médecin) avec validation des données
- Connexion sécurisée par email et mot de passe (JWT)
- Modification du profil médical (nom, groupe sanguin, NIP, allergies, contact d'urgence, religion…)
- Changement de mot de passe avec vérification
- Réinitialisation par email (lien valable 15 minutes via Resend)

### 3.2 Identité de Santé Numérique (HealthID)
- Génération d'un **Soulbound Token (SBT)** non-transférable sur la blockchain Polygon
- Le SBT encode : NIP haché, groupe sanguin, statut CMU, date d'émission
- QR code contenant les données du patient
- Connexion MetaMask depuis le navigateur
- Vérification de l'existence d'un SBT pour un portefeuille donné

### 3.3 Suivi Nutritionnel
- Enregistrement des repas avec macronutriments (protéines, glucides, lipides)
- Analyse photographique d'un plat par IA (supporte la cuisine ivoirienne : Garba, Attiéké, Foutou, Aloko…)
- Graphique hebdomadaire en radar (7 axes : protéines, glucides, lipides, énergie, repas/semaine, variété)
- Bilan calorique journalier (Protéines×4 + Glucides×4 + Lipides×9 kcal)
- NutriBot : assistant IA personnalisé avec contexte médical du patient

### 3.4 Dossier Médical
- Création de documents de santé (ordonnance, résultats d'examen, consultation, vaccination, autre)
- Chiffrement AES-256 avant stockage sur IPFS (Pinata)
- Empreinte SHA-256 pour garantir l'intégrité du document
- Optionnel : ancrage de la référence sur la blockchain via HealthRecord.sol
- Historique des 100 derniers documents

### 3.5 Carnet de Vaccination
- Enregistrement des vaccins (nom, dose, date, établissement, prochaine dose)
- Alertes visuelles pour les vaccins en retard ou à venir dans les 30 jours
- Notifications desktop pour les rappels de vaccination
- Historique complet ordonné par date

### 3.6 Téléconsultation
- Annuaire des médecins référencés
- Prise de rendez-vous avec sélection du médecin et de la plénière horaire
- Suivi du statut : En attente → Confirmé → Terminé (ou Annulé)
- Affichage du lien de réunion lorsque la consultation est confirmée
- Compte à rebours avant la consultation (ex : "Dans 2j 3h")
- Système de notation (étoiles, sauvegardé localement)

### 3.7 Couverture Maladie Universelle (CMU)
- Affichage du statut CMU (actif/inactif)
- Date d'expiration avec compte à rebours
- Mise à jour du statut
- Accès à l'annuaire des établissements de santé conventionnés

### 3.8 Jeûne Spirituel & Santé
- 5 types de jeûne : Ramadan, Carême, Daniel (fruits/légumes), Intermittent, Personnalisé
- Plans de jeûne avec dates de début et de fin
- **Protocole Ramadan en 4 phases** avec guidance scientifique :
  - Phase 1 : Transition glycogène
  - Phase 2 : Adaptation aux lipides
  - Phase 3 : Cétose profonde
  - Phase 4 : Réalimentation
- Recommandations de repas Suhoor/Iftar adaptées à la culture ivoirienne
- Journal quotidien (succès / raté / partiel) avec notes
- Alertes sur les symptômes (vertiges, maux de tête)

### 3.9 Recherche de Soins
- Carte interactive de 1 063+ centres de santé en Côte d'Ivoire
- Filtres par région et spécialité
- Coordonnées et directions

### 3.10 Portail Médecin
- Vue dédiée aux médecins inscrits
- Liste de toutes les téléconsultations assignées
- Gestion des statuts (confirmer, terminer, annuler)
- Ajout du lien de réunion
- Affichage des données démographiques des patients

---

## 4. Pages et modules (Frontend)

### Pages publiques (sans connexion)

| Page | Route | Description |
|---|---|---|
| Accueil | `/` | Page d'accueil avec vidéo de fond, statistiques nationales, CTAs |
| Connexion | `/login` | Formulaire email + mot de passe, sélecteur de langue |
| Inscription | `/register` | Création de compte patient avec données médicales de base |
| Mot de passe oublié | `/forgot-password` | Saisie email → envoi de lien de réinitialisation |
| Réinitialisation | `/reset-password` | Formulaire de nouveau mot de passe (token URL) |

### Pages protégées (connexion requise)

| Page | Route | Rôle |
|---|---|---|
| Tableau de bord | `/dashboard` | Patient |
| Identité de santé | `/health-id` | Patient |
| Nutrition | `/nutrition` | Patient |
| Dossier médical | `/records` | Patient |
| Vaccinations | `/vaccines` | Patient |
| Téléconsultation | `/teleconsult` | Patient |
| CMU | `/cmu` | Patient |
| Jeûne | `/fasting` | Patient |
| Recherche de soins | `/find-care` | Patient |
| Paramètres | `/settings` | Patient + Médecin |
| Portail médecin | `/doctor` | Médecin |
| Crypto / Blockchain | `/crypto` | Patient |

### Composants globaux

| Composant | Description |
|---|---|
| `Sidebar` | Barre de navigation latérale avec liens vers toutes les pages, sensible au rôle |
| `Topbar` | En-tête avec recherche, sélecteur de langue (14 langues), bascule thème |
| `LangPicker` | Sélecteur de langue flottant (pages auth) ou intégré (topbar) |
| `NutriBot` | Widget de chat IA (Claude) flottant sur la page Nutrition |
| `EmergencySOS` | Bouton d'urgence toujours visible |
| `SpiritualWidget` | Widget de suivi du jeûne actif affiché sur le tableau de bord |
| `ProtectedRoute` | HOC de protection des routes, redirige vers `/login` si non authentifié |

---

## 5. API Backend

Base URL : `https://<backend>.up.railway.app`

### Authentification — `/api/auth`

| Méthode | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/login` | Connexion, retourne JWT + rôle | Non |
| POST | `/register` | Inscription PATIENT ou MÉDECIN | Non |
| GET | `/me` | Profil complet de l'utilisateur connecté | JWT |
| PUT | `/me/update` | Mise à jour du profil | JWT |
| PUT | `/me/password` | Changement de mot de passe | JWT |
| POST | `/forgot-password` | Envoi email de réinitialisation | Non |
| POST | `/reset-password` | Réinitialisation avec token | Non |

> **Limite :** 10 tentatives de connexion par IP par 60 secondes.

### Tableau de bord — `/api/dashboard`

| Méthode | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/` | Stats agrégées (repas du jour, vaccins, CMU, prochaine consultation) | JWT |

### Dossiers médicaux — `/api/records`

| Méthode | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/` | 100 derniers dossiers du patient | JWT |
| POST | `/` | Créer un dossier (CID IPFS + hash SHA-256) | JWT |

### Nutrition — `/api/nutrition`

| Méthode | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/` | 100 derniers repas du patient | JWT |
| POST | `/` | Enregistrer un repas | JWT |

### Vaccinations — `/api/vaccines`

| Méthode | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/` | Carnet de vaccination du patient | JWT |
| POST | `/` | Enregistrer un vaccin | JWT |

### Téléconsultations — `/api/teleconsults`

| Méthode | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/` | Consultations du patient | JWT |
| POST | `/` | Demander une consultation | JWT |
| GET | `/:id` | Détail d'une consultation | JWT |
| PUT | `/:id/status` | Mettre à jour le statut | JWT |

### Jeûne — `/api/fasting`

| Méthode | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/plans` | Plans de jeûne de l'utilisateur | JWT |
| POST | `/plans` | Créer un plan de jeûne | JWT |
| GET | `/plans/:id/logs` | Journal d'un plan | JWT |
| POST | `/plans/:id/logs` | Ajouter/modifier une entrée du journal | JWT |

### Médecin — `/api/doctor`

| Méthode | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/list` | Annuaire des médecins | Non |
| GET | `/teleconsults` | Consultations du médecin | JWT (DOCTOR) |
| PUT | `/teleconsults/:id/status` | Gérer une consultation | JWT (DOCTOR) |

### Blockchain — `/api/blockchain`

| Méthode | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/mint` | Minter un SBT HealthID sur Polygon | JWT |
| POST | `/check` | Vérifier si un portefeuille possède un SBT | JWT |

### Intelligence Artificielle — `/api/ai`

| Méthode | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/chat` | Conversation avec NutriBot (Claude) | JWT |
| POST | `/analyze-food` | Analyse photo d'un plat (Claude Vision) | JWT |

### Santé du serveur

| Méthode | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Statut opérationnel du backend |

---

## 6. Base de données

Base de données : **SQLite** (fichier persisté sur volume Railway à `/app/data/nutriid.db`)

### Tables

#### `users`
| Colonne | Type | Description |
|---|---|---|
| id | TEXT (UUID) | Identifiant unique |
| email | TEXT | Adresse email (unique) |
| password_hash | TEXT | Hash bcrypt (coût 12) |
| role | TEXT | `PATIENT` ou `DOCTOR` |
| created_at | DATETIME | Date de création |

#### `patients`
| Colonne | Type | Description |
|---|---|---|
| user_id | TEXT | Référence vers `users.id` |
| full_name | TEXT | Nom complet |
| national_id | TEXT | NIP national (unique) |
| blood_type | TEXT | Groupe sanguin (A+, O-, …) |
| date_of_birth | TEXT | Date de naissance |
| sex | TEXT | Sexe |
| height | REAL | Taille (cm) |
| weight | REAL | Poids (kg) |
| allergies | TEXT | Allergies connues |
| emergency_contact | TEXT | Contact d'urgence |
| cmu_active | BOOLEAN | Statut CMU |
| cmu_expiry_date | TEXT | Date d'expiration CMU |
| religion | TEXT | Religion (optionnel) |

#### `doctors`
| Colonne | Type | Description |
|---|---|---|
| user_id | TEXT | Référence vers `users.id` |
| full_name | TEXT | Nom complet |
| license_number | TEXT | Numéro de licence (unique) |
| specialty | TEXT | Spécialité médicale |
| facility_name | TEXT | Établissement d'exercice |

#### `health_records`
| Colonne | Type | Description |
|---|---|---|
| id | TEXT | UUID |
| user_id | TEXT | Patient propriétaire |
| record_type | TEXT | Type (ORDONNANCE, RÉSULTATS_EXAMEN…) |
| content | TEXT | Contenu textuel |
| ipfs_cid | TEXT | CID IPFS (stockage chiffré) |
| document_hash | TEXT | Empreinte SHA-256 |
| blockchain_tx | TEXT | Hash de transaction Polygon (optionnel) |
| created_at | DATETIME | Date de création |

#### `nutrition_logs`
| Colonne | Type | Description |
|---|---|---|
| id | TEXT | UUID |
| user_id | TEXT | Patient |
| meal_name | TEXT | Nom du repas |
| proteins | REAL | Protéines (g) |
| carbs | REAL | Glucides (g) |
| fats | REAL | Lipides (g) |
| logged_at | DATETIME | Horodatage |

#### `vaccines`
| Colonne | Type | Description |
|---|---|---|
| id | TEXT | UUID |
| user_id | TEXT | Patient |
| vaccine_name | TEXT | Nom du vaccin |
| dose | TEXT | Numéro de dose |
| administered_at | DATE | Date d'administration |
| facility_name | TEXT | Centre de vaccination |
| next_dose_at | DATE | Date prochaine dose (optionnel) |

#### `teleconsultations`
| Colonne | Type | Description |
|---|---|---|
| id | TEXT | UUID |
| patient_id | TEXT | Patient |
| doctor_id | TEXT | Médecin (optionnel) |
| scheduled_at | DATETIME | Date/heure prévue |
| status | TEXT | `pending`, `confirmed`, `completed`, `canceled` |
| meeting_link | TEXT | Lien de réunion (optionnel) |
| notes | TEXT | Notes du médecin |

#### `fasting_plans`
| Colonne | Type | Description |
|---|---|---|
| id | TEXT | UUID |
| user_id | TEXT | Utilisateur |
| fast_type | TEXT | `ramadan`, `lent`, `daniel`, `intermittent`, `custom` |
| start_date | DATE | Début du jeûne |
| end_date | DATE | Fin du jeûne |
| created_at | DATETIME | Date de création |

#### `fasting_logs`
| Colonne | Type | Description |
|---|---|---|
| id | TEXT | UUID |
| plan_id | TEXT | Plan de jeûne |
| date | DATE | Date du jour |
| status | TEXT | `success`, `skipped`, `partial` |
| notes | TEXT | Notes personnelles |

#### `password_reset_tokens`
| Colonne | Type | Description |
|---|---|---|
| token | TEXT | Token de 512 bits (hex) |
| user_id | TEXT | Utilisateur concerné |
| expires_at | TEXT | Expiration (15 minutes) |
| used | INTEGER | 0 = valide, 1 = utilisé |

---

## 7. Blockchain & Identité Numérique

### Contrats intelligents (Solidity — Polygon)

#### `HealthID.sol` — Soulbound Token (SBT)
- Standard ERC-721 modifié (ERC-5484) — **non transférable**
- Chaque citoyen ne peut posséder qu'un seul SBT
- Données stockées sur la chaîne : hash du NIP, groupe sanguin, statut CMU, date d'émission
- Fonctions principales :
  - `mintID(wallet, nipHash, bloodType, cmuActive)` — Réservé à l'admin
  - `getMyInfo()` — Consultation par le patient
  - Les transferts (`transferFrom`, `safeTransferFrom`) sont bloqués

#### `HealthRecord.sol` — Registre de dossiers médicaux
- Lie des enregistrements IPFS à l'identifiant SBT du patient
- Seuls les médecins autorisés peuvent ajouter des enregistrements
- Fonctions :
  - `setDoctorAuthorization(doctor, authorized)` — Admin
  - `addRecord(tokenId, ipfsCid, documentHash)` — Médecin autorisé
  - `getRecord(tokenId, index)` — Consultation
  - `getRecordCount(tokenId)` — Nombre de dossiers

### Flux de création d'un HealthID

```
Patient → MetaMask (connexion portefeuille)
        → Vérification : portefeuille déjà enregistré ?
        → Non → Appel POST /api/blockchain/mint
                → Backend appelle HealthID.sol::mintID()
                → Transaction Polygon (tx hash retourné)
                → SBT créé, non-transférable
        → Oui → Affichage du SBT existant
```

### Réseau

- **Développement / Test** : Polygon Amoy Testnet (Chain ID : 80002)
- **Production** : Polygon Mainnet (Chain ID : 137)

---

## 8. Intelligence Artificielle

### Modèle utilisé
**Claude Opus 4.6** (Anthropic) — via l'API `https://api.anthropic.com/v1/messages`

### NutriBot — Assistant nutritionnel
- Contexte patient injecté dans le prompt système :
  - Nom complet, NIP, groupe sanguin, statut CMU
  - 5 derniers repas avec calories calculées
  - 3 derniers vaccins
- Répond en **français** avec mise en forme Markdown
- Historique de conversation conservé dans le frontend
- Limite : 800 tokens de réponse

### Analyse photographique de repas
- L'utilisateur prend ou importe une photo d'un plat
- L'image est encodée en base64 et envoyée à Claude Vision
- Claude identifie :
  - Le nom du plat (français + nom ivoirien local si applicable)
  - Les macronutriments estimés (protéines, glucides, lipides en grammes)
  - Une description courte
- Réponse en JSON pur, parsée et injectée automatiquement dans le formulaire de repas
- **Plats ivoiriens reconnus** : Garba, Attiéké, Foutou, Alloco, Kedjenou, Bangui, etc.

---

## 9. Sécurité

| Mécanisme | Détail |
|---|---|
| Authentification | JWT Bearer Token, signé avec `JWT_SECRET` (≥64 caractères) |
| Hachage des mots de passe | bcrypt, facteur de coût 12 |
| Limitation du débit | 10 tentatives auth / IP / 60 secondes |
| CORS | Origines autorisées configurables via `ALLOWED_ORIGIN` |
| Chiffrement des documents | AES-256 avant upload IPFS |
| Intégrité des documents | Empreinte SHA-256 sur chaque document |
| Blockchain | SBT non-transférable = identité médicale infalsifiable |
| Réinitialisation de mot de passe | Token 512 bits, expiration 15 minutes, usage unique |
| Protection des routes | JWT vérifié côté serveur sur tous les endpoints protégés |
| Requêtes SQL | Paramètres préparés (sqlx), immunisé contre les injections SQL |
| En-têtes de sécurité | X-Frame-Options, X-Content-Type-Options, Referrer-Policy (Nginx) |
| Clés API | Jamais exposées au navigateur (backend uniquement) |

---

## 10. Internationalisation

L'application supporte **14 langues**, accessibles avant et après la connexion via le sélecteur de langue.

### Langues internationales 🌍
| Code | Langue |
|---|---|
| `fr` | Français (par défaut) |
| `en` | English |
| `es` | Español |
| `ar` | العربية (Arabe) |
| `zh` | 中文 (Mandarin) |

### Langues locales ivoiriennes 🇨🇮
| Code | Langue | Nom natif |
|---|---|---|
| `dioula` | Dioula | Dioula |
| `baoule` | Baoulé | Baoulé |
| `bete` | Bété | Bété |
| `agni` | Agni | Agni |
| `senufo` | Sénoufo | Sénoufo |
| `guere` | Guéré | Wè |
| `attie` | Attié | Attié |
| `kroumen` | Kroumen | Kroumen |
| `adioukrou` | Adioukrou | Odjukru |

### Implémentation
- Contexte React global (`I18nContext`) avec hook `useI18n()`
- Persistance dans `localStorage` (clé : `nutriid_lang`)
- Repli automatique vers le français si une clé de traduction est manquante
- Composant `LangPicker` disponible partout :
  - **Mode flottant** (`variant="floating"`) : fixé en haut à droite sur les pages publiques
  - **Mode intégré** (`variant="inline"`) : dans la barre de navigation en haut de l'app

---

## 11. Infrastructure & Déploiement

### Déploiement actuel (Railway)

```
GitHub (main)
    │
    ├── Push → Railway Backend Service
    │           Root: backend/
    │           Builder: Dockerfile
    │           Volume: /app/data (SQLite persistant)
    │
    └── Push → Railway Frontend Service
                Root: frontend/
                Builder: Dockerfile
                Variable: BACKEND_URL = https://<backend>.up.railway.app
                Nginx proxy: /api/* → BACKEND_URL
```

### Variables Railway — Service Backend

| Variable | Valeur |
|---|---|
| `DATABASE_URL` | `sqlite:/app/data/nutriid.db?mode=rwc` |
| `JWT_SECRET` | Chaîne aléatoire ≥64 caractères |
| `RUST_ENV` | `production` |
| `RUST_LOG` | `info` |
| `ALLOWED_ORIGIN` | URL publique du frontend Railway |
| `ANTHROPIC_API_KEY` | Clé API Anthropic |
| `POLYGON_RPC_URL` | URL RPC Polygon |
| `POLYGON_CHAIN_ID` | `80002` (testnet) ou `137` (mainnet) |
| `RELAYER_PRIVATE_KEY` | Clé privée du portefeuille relayeur |
| `HEALTH_ID_CONTRACT_ADDRESS` | Adresse du contrat HealthID déployé |
| `RESEND_API_KEY` | Clé API Resend (emails) |
| `APP_URL` | URL publique du frontend |

### Variables Railway — Service Frontend

| Variable | Valeur |
|---|---|
| `BACKEND_URL` | URL publique du service backend Railway |

### Déploiement en production (self-hosted)

Pour un déploiement sur un serveur dédié avec domaine propre (`nutriid.ci`) :

```bash
# Cloner le dépôt
git clone https://github.com/gnagnegaelephraim2-lgtm/Nutri-ID.git
cd Nutri-ID

# Configurer les variables d'environnement
cp .env.example .env
# Éditer .env avec les valeurs réelles

# Lancer avec Docker Compose (Nginx + Backend + Certbot SSL)
docker compose up -d
```

La configuration Docker Compose inclut :
- **Backend Rust** sur le port 3000 (interne)
- **Nginx** sur les ports 80 (HTTP→HTTPS) et 443 (HTTPS)
- **Certbot** pour les certificats SSL Let's Encrypt (renouvellement toutes les 12h)
- Volume SQLite persistant (`sqlite-data`)

### Santé de l'application

- Health check backend : `GET /api/health` → `{"status": "operational", "version": "0.1.0"}`
- Health check frontend : `GET /healthz` → `ok`

---

## 12. Variables d'environnement

Voir le fichier `.env.example` à la racine du projet pour la liste complète et commentée.

```bash
# Base de données
DATABASE_URL=sqlite:./data/nutriid.db?mode=rwc

# Sécurité
JWT_SECRET=<chaîne_aléatoire_64+_caractères>
RUST_ENV=production

# CORS
ALLOWED_ORIGIN=https://votre-frontend.up.railway.app

# IA
ANTHROPIC_API_KEY=<votre_clé_anthropic>

# Blockchain
POLYGON_RPC_URL=https://rpc-amoy.polygon.technology
POLYGON_CHAIN_ID=80002
RELAYER_PRIVATE_KEY=<clé_privée_hex_sans_0x>
HEALTH_ID_CONTRACT_ADDRESS=<adresse_contrat>

# IPFS
PINATA_API_KEY=<votre_clé_pinata>
PINATA_SECRET_KEY=<votre_secret_pinata>

# Email
RESEND_API_KEY=<votre_clé_resend>
APP_URL=https://votre-frontend.up.railway.app
```

---

*Document généré le 24 mars 2026 — Nutri-ID v0.1.0*
