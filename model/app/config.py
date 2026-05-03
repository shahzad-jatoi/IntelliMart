import os
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent.parent
ARTIFACTS_DIR = BASE_DIR
CONFIDENCE_THRESHOLD = 0.90
APP_NAME = "E-commerce Product Classifier API"
APP_VERSION = "2.0.0"
PORT = int(os.environ.get("PORT", 8000))

