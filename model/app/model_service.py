from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional

import joblib
import numpy as np

from app.config import ARTIFACTS_DIR, CONFIDENCE_THRESHOLD
from app.preprocessing import prepare_input


# Blending weight for LR when ensembling — LR is the stronger model
LR_ENSEMBLE_WEIGHT = 0.6
NB_ENSEMBLE_WEIGHT = 0.4


@dataclass
class ModelRegistry:
    lr: object = None
    nb: object = None
    vec: object = None
    le: object = None
    ready: bool = False
    startup_error: Optional[str] = None
    artifacts_dir: Path = field(default_factory=lambda: ARTIFACTS_DIR)

    def load(self) -> None:
        required = ["model_lr.joblib", "vectorizer.joblib", "label_encoder.joblib"]
        for fname in required:
            path = self.artifacts_dir / fname
            if not path.exists():
                raise FileNotFoundError(f"Required artifact not found: {path}")

        self.lr = joblib.load(self.artifacts_dir / "model_lr.joblib")
        self.nb = joblib.load(self.artifacts_dir / "model_nb.joblib") if (self.artifacts_dir / "model_nb.joblib").exists() else None
        self.vec = joblib.load(self.artifacts_dir / "vectorizer.joblib")
        self.le = joblib.load(self.artifacts_dir / "label_encoder.joblib")
        self.ready = True
        self.startup_error = None

    def category_list(self) -> list[str]:
        if self.le is None:
            return []
        return list(self.le.classes_)

    def predict(self, title: str, description: Optional[str]) -> dict:
        if not self.ready:
            raise RuntimeError("Model registry is not ready.")

        text = prepare_input(title, description)
        if len(text) < 3:
            raise ValueError("Input text is too short after cleaning. Please provide a more descriptive title.")

        vectorized = self.vec.transform([text])
        lr_proba = self.lr.predict_proba(vectorized)[0]
        lr_pred_idx = int(np.argmax(lr_proba))
        lr_confidence = float(lr_proba[lr_pred_idx])

        if lr_confidence >= CONFIDENCE_THRESHOLD or self.nb is None:
            # HIGH confidence — LR alone is reliable
            final_proba = lr_proba
            model_used = "logistic_regression"
        else:
            # LOW confidence — blend both models' probabilities
            nb_proba = self.nb.predict_proba(vectorized)[0]
            final_proba = (LR_ENSEMBLE_WEIGHT * lr_proba) + (NB_ENSEMBLE_WEIGHT * nb_proba)
            model_used = "ensemble_blend"

        final_pred_idx = int(np.argmax(final_proba))
        final_confidence = float(final_proba[final_pred_idx])
        predicted_category = self.le.classes_[final_pred_idx]

        all_probs = {cat: round(float(p), 4) for cat, p in zip(self.le.classes_, final_proba)}
        return {
            "predicted_category": predicted_category,
            "confidence": round(final_confidence, 4),
            "low_confidence": lr_confidence < CONFIDENCE_THRESHOLD,
            "model_used": model_used,
            "all_probabilities": all_probs,
            "input_preview": text[:200] + ("..." if len(text) > 200 else ""),
        }
