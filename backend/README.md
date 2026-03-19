## Career Connect AI — Backend (FastAPI)

### Run locally

Create a virtualenv, install deps:

```bash
pip install -r backend/requirements.txt
```

Set environment variables (PowerShell example):

```powershell
$env:DATABASE_URL="postgresql+psycopg://USER:PASSWORD@HOST:5432/DBNAME"
$env:JWT_SECRET="change-me"
$env:CORS_ORIGINS="http://localhost:5173"
```

Run the API:

```bash
uvicorn backend.app.main:app --reload --port 8000
```

Open docs:
- Swagger UI: `http://localhost:8000/docs`
- OpenAPI JSON: `http://localhost:8000/openapi.json`

