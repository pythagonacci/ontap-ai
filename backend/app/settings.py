from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    PORT: int = 8787
    CORS_ORIGINS: str = "http://localhost:5173,chrome-extension://*"

    OPENAI_API_KEY: str
    OPENAI_MODEL: str = "gpt-4o-mini"

    @property
    def origins(self) -> List[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

settings = Settings()
