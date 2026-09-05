# OIL-SIF Guardian — Deployment & Infrastructure Guide

## 1. Deployment Topologies

### 1.1 Local Development (Zero-Docker Mode)
- **Database**: SQLite (automatic creation at `oil_sif_guardian.db`).
- **Backend**: FastAPI via Uvicorn (`http://localhost:8000`).
- **Frontend**: Vite Dev Server (`http://localhost:5173`).

### 1.2 Production / On-Premise Docker Deployment
- **Database**: PostgreSQL 16 with `pgvector` extension for semantic search.
- **Backend Service**: Containerized FastAPI running behind Gunicorn/Uvicorn workers.
- **Frontend Service**: Nginx reverse proxy serving optimized React single-page build.
- **Network**: Private bridge network isolated from direct internet access where required by OIL on-premise IT policy.

```bash
# Build and run complete multi-container stack
docker compose up -d --build

# Inspect logs
docker compose logs -f backend
```
