from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Database
    database_url: str = "postgresql://user:password@localhost:5432/notifications_db"
    
    # Kafka
    kafka_bootstrap_servers: str = "localhost:9092"
    kafka_topic: str = "notifications"
    kafka_group_id: str = "notification-service-group"
    
    # API
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    
    # CORS
    cors_origins: list = ["*"]
    
    class Config:
        env_file = ".env"

settings = Settings()