# SAANS — Hyperlocal Air Intelligence for Bengaluru

## 1. Project Overview
SAANS is a web platform that combines air-quality observations, forecasts, weather, satellite observations, fire hotspots, and citizen reports to provide hyperlocal air-quality intelligence for Bengaluru.

## 2. Repository Structure
```
saans/
├── frontend/             # React + Vite + TypeScript frontend
├── backend/              # FastAPI backend
├── ml/                   # Machine learning models (empty for now)
├── data/                 # Local data storage
│   ├── raw/
│   ├── processed/
│   └── external/
├── docs/                 # Documentation
├── scripts/              # Utility scripts
├── docker/               # Docker configuration files
├── .env.example          # Example environment variables
├── .gitignore            # Git ignore file
├── docker-compose.yml    # Docker Compose for PostgreSQL + PostGIS
└── README.md
```

## 3. Technology Stack
- **Frontend**: React, Vite, TypeScript, Leaflet, Chart.js
- **Backend**: Python, FastAPI
- **Database**: PostgreSQL, PostGIS
- **ML**: scikit-learn, XGBoost, PyKrige, MobileNet/CNN
- **Alerts**: Telegram Bot API
- **Development**: Docker, Docker Compose

## 4. Prerequisites
- Docker & Docker Compose
- Node.js (v18+)
- Python (3.10+)

## 5. Local Setup
1. Clone the repository.
2. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

## 6. How to start PostgreSQL/PostGIS
Run the following command from the project root:
```bash
docker compose up -d
```
The database will be available on `localhost:5432`.

## 7. How to start the backend
```bash
cd backend
python -m venv venv
# Windows: venv\Scripts\activate
# Linux/Mac: source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

## 8. How to start the frontend
```bash
cd frontend
npm install
npm run dev
```

## 9. Backend health endpoint
Once the backend is running, you can access the health endpoint at:
http://localhost:8000/health

FastAPI documentation is available at:
http://localhost:8000/docs

## 10. Development workflow
We use a standard monorepo workflow. Work in the respective `frontend/` or `backend/` directories. Use `.env` files for configuration.

## 11. Current milestone
**Milestone 1 — Foundation**
- The repository structure is defined.
- The PostgreSQL/PostGIS database is containerized.
- The FastAPI backend foundation is set up.
- The React/Vite frontend foundation is set up.

## 12. Upcoming milestones
- Milestone 2: Data Ingestion & DB Schema setup
- Milestone 3: Ordinary Kriging & Grid Setup
- Milestone 4: Forecast Correction & Rule-based Engines
- Milestone 5: Citizen Image Tagger & Alerts
