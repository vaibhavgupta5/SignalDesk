from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    GEMINI_KEY: str = ""
    MODEL: str = "gemini-2.5-flash"

    class Config:
        env_file = ".env"


settings = Settings()
