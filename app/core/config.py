from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "Enterprise PathLab API"
    API_V1_STR: str = "/api/v1"
    
    # Database Settings
    SQL_USER: str = "CloudSA7ab7cca5"
    SQL_PASSWORD: str = "password"
    SQL_HOST: str = "pathlab-db.database.windows.net"
    SQL_PORT: str = "1433"
    SQL_DB: str = "free-sql-db-5225883"
    
    @property
    def DATABASE_URL(self) -> str:
        import urllib.parse
        encoded_password = urllib.parse.quote_plus(self.SQL_PASSWORD)
        return f"mssql+aioodbc://{self.SQL_USER}:{encoded_password}@{self.SQL_HOST}:{self.SQL_PORT}/{self.SQL_DB}?driver=ODBC+Driver+18+for+SQL+Server"
    
    # JWT Settings
    SECRET_KEY: str = "YOUR_SUPER_SECRET_KEY_HERE_CHANGE_ME"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8 # 8 days
    
    # AI/RAG Settings
    GEMINI_API_KEY: Optional[str] = None
    CHROMA_DB_DIR: str = "./chroma_db"
    
    # Azure Storage Settings
    AZURE_STORAGE_CONNECTION_STRING: Optional[str] = None
    AZURE_STORAGE_SHARE_NAME: str = "reports"
    
    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True)

settings = Settings()
