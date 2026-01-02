from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_url: str = "postgresql://admin_report:password_report@report-db:5432/report_db"
    kafka_bootstrap_servers: str = "kafka:29092"
    kafka_topic: str = "New_Reports"
    kafka_group_id: str = "report-service-group"
    
    class Config:
        env_file = ".env"

settings = Settings()