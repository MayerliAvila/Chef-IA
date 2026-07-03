# pyrefly: ignore [missing-import]
from dotenv import load_dotenv
import os

load_dotenv()

class Settings:
    def __init__(self):
        self.app_name = os.getenv("APP_NAME")
        self.app_version = os.getenv("APP_VERSION")
        self.gemini_model = os.getenv("GEMINI_MODEL")
        self.gemini_api_key = os.getenv("GEMINI_API_KEY")
    
settings = Settings()