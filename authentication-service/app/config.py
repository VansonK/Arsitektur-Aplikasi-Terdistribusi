from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # Gunakan huruf besar agar sama dengan yang dipanggil di main.py
    DATABASE_URL: str 
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # Versi Pydantic V2 menggunakan model_config
    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=False
    )

settings = Settings()