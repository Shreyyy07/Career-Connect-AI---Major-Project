from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "sqlite+pysqlite:///./career_connect_ai.db"
    jwt_secret: str = "dev-only-change-me"
    jwt_algorithm: str = "HS256"
    access_token_exp_minutes: int = 60
    cors_origins: str = "http://localhost:5173"

    # --- Legacy Gemini (kept for fallback reference) ---
    gemini_api_key: str = ""
    gemini_model: str = "gemini-1.5-flash"

    # --- GitHub AI inference (OpenAI-compatible) ---
    github_token: str = ""
    github_ai_endpoint: str = "https://models.github.ai/inference"
    github_ai_model: str = "openai/gpt-4.1"

    # --- SMTP Config ---
    smtp_email: str = ""
    smtp_password: str = ""

    # --- n8n Voice Agent Integration ---
    n8n_webhook_url: str = ""       # e.g. http://localhost:5678/webhook/care-connect-remind
    vapi_api_key: str = ""          # Vapi.ai API key (optional — for direct calls)

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()

