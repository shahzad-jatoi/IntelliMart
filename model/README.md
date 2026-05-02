# E-commerce Product Classification System (DS201)

This project turns a trained ML model into a web-usable AI service.  
It covers the end-to-end path expected in DS201: **model -> API -> web integration -> containerization -> testing -> handoff**.

---

## 1) Project Objective (Viva-Friendly)

The objective is to automatically classify e-commerce products into the correct category using product title and description.

Why this is a system (not just a model):

- Data comes with noise (HTML tags, emojis, inconsistent text).
- Inputs can be incomplete (missing descriptions).
- Predictions need reliability (validation + error handling).
- Different confidence levels need intelligent routing.
- The model must be exposed to external applications (web/API).
- The solution should be deployable and reproducible.

---

## 2) Problem Statement

E-commerce marketplaces receive many product uploads. Manual categorization is slow and inconsistent, and simple keyword matching fails on synonyms and ambiguous descriptions.

This system classifies products into one of the trained categories by:

1. Cleaning and preparing text.
2. Vectorizing with TF-IDF.
3. Running Logistic Regression first.
4. Falling back to Naive Bayes when LR confidence is low.

---

## 3) High-Level Architecture

1. **Client/Web UI** sends product text.
2. **FastAPI backend** validates input and routes request.
3. **Preprocessing layer** cleans text exactly like training stage.
4. **Inference layer** predicts using model artifacts.
5. **Response layer** returns category, confidence, and probabilities.

Main entrypoint for service:

- `app.main:app`

---

## 4) Project Structure and File Purpose

### Core Runtime Files (Most Important)

- `app/main.py`  
  Creates FastAPI app, registers routes, lifecycle startup loading, and global exception handler.

- `app/model_service.py`  
  Loads serialized artifacts and runs prediction logic (LR + NB fallback strategy).

- `app/preprocessing.py`  
  Implements text cleaning and missing-description handling.

- `app/schemas.py`  
  Pydantic schemas for strict request validation.

- `app/config.py`  
  Central configuration (paths, threshold, app metadata).

- `main.py`  
  Backward-compatible launcher script.

### Integration/UI Files

- `web/index.html`  
  Simple frontend to test and demonstrate model predictions.

### Deployment / Reproducibility Files

- `requirements.txt`  
  Python dependencies.

- `Dockerfile`  
  Container image definition.

- `docker-compose.yml`  
  One-command local deployment.

- `.github/workflows/ci.yml`  
  CI test workflow for automated checks.

### Testing / Evidence Files

- `tests/test_service_api.py`  
  Unit tests for health and prediction behavior.

- `evaluation_results.txt`  
  Consolidated runtime evaluation report (correctness, edge cases, latency, comparisons).

- `run_evaluations.py`  
  Script that generates `evaluation_results.txt`.

### Less Important for Day-to-Day Usage

- `.pytest_cache/`, `__pycache__/`  
  Local cache files, not part of business logic.

- `test_api.py`  
  Useful for stress/performance runs, but not required for base service operation.

---

## 5) Model and Inference Logic

### Models Used

- Primary model: **Logistic Regression**
- Fallback model: **Multinomial Naive Bayes**
- Feature extractor: **TF-IDF Vectorizer**
- Label mapping: **LabelEncoder**

### Confidence Routing

- Predict with Logistic Regression first.
- If LR confidence < threshold (`0.90`), route to Naive Bayes fallback.
- Return:
  - `predicted_category`
  - `confidence`
  - `model_used`
  - `low_confidence`
  - `all_probabilities`

This demonstrates system-level reasoning beyond single-model inference.

---

## 6) API Endpoints (for Viva + Integration)

- `GET /health`
  - Purpose: service health and startup state.

- `GET /categories`
  - Purpose: list all supported output categories.

- `POST /predict`
  - Input: `title`, optional `description`
  - Output: category, confidence, model used, probabilities.

- `POST /predict/batch`
  - Input: up to 50 products
  - Output: per-item predictions and graceful per-item errors.

- `POST /predict/title-only`
  - Input: query param `title`
  - Purpose: convenience path when no description exists.

Swagger docs: `http://localhost:8000/docs`

---

## 7) How to Run

## Local Run

```bash
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Open:

- Web UI: `http://localhost:8000/`
- Swagger: `http://localhost:8000/docs`

## Docker Run

```bash
docker compose up --build
```

---

## 8) Testing and Evaluation

### Unit Tests

```bash
pytest -q
```

### Full Evaluation Report

```bash
python run_evaluations.py
```

Generates:

- `evaluation_results.txt`

---

## 9) Model Accuracy and Current Performance

Important: report two levels of performance in viva.

1. **Training/assignment-reported model accuracy**  
   Earlier assignment summary in this project mentions Logistic Regression around **82.68%** (dataset-level evaluation from notebook pipeline).

2. **Current service runtime checks (from `evaluation_results.txt`)**
   - Quick correctness subset score: **3/4**
   - Edge-case validation behavior: **pass**
   - Service health: **ok**
   - Example measured latency (current environment): low-millisecond range for repeated local calls.

How to present this properly:

- "Our primary benchmark comes from Assignment-2 dataset evaluation (full test split).  
  Runtime checks in Assignment-3/production service validate behavior, robustness, and integration readiness."

---

## 10) Known Limitations (Honest Viva Section)

- Some ambiguous text cases are still misclassified.
- Confidence is not always high for title-only ambiguous products.
- No authentication/rate limiting yet for public internet exposure.
- Monitoring/observability is basic and can be improved.

This is acceptable for course scope if clearly acknowledged with improvement roadmap.

---

## 11) Why This Meets DS201 Project Direction

- Python-first modular codebase: yes (`app/` package).
- Reproducibility controls: dependency file + fixed artifacts + repeatable scripts.
- ML pipeline to API: yes (serialized models served via FastAPI).
- Containerization: yes (Dockerfile + compose).
- CI/CD concept: yes (GitHub workflow included).
- Engineering discipline: tests, validation, error handling, clear handoff.

---

## 12) Viva Preparation (Likely Questions + Strong Answers)

### Q1) Why two models instead of one?
Because we use a confidence-based strategy: primary model handles most cases, fallback handles uncertain cases, improving robustness for ambiguous inputs.

### Q2) How do you avoid data leakage?
In training notebooks, vectorizer/model are fit only on training split. Serialized artifacts are then reused in service.

### Q3) How do you handle malformed input?
Pydantic schemas enforce min/max constraints and type checks. Invalid payloads return proper 422 responses.

### Q4) What is your reproducibility strategy?
Fixed artifacts, dependency management, deterministic config strategy, automated tests, and containerized runtime.

### Q5) What would you improve next?
Monitoring, rate limiting, authentication, model version metadata, and periodic retraining pipeline.

---

## 13) Handoff Notes for Another Team

If another team needs to use this quickly:

1. Clone/copy `ass3`.
2. Install dependencies.
3. Run `uvicorn app.main:app`.
4. Integrate frontend with `POST /predict`.
5. Use `handoff.md` for quick operational steps.

---

## 14) One-Line Presentation Summary

"We transformed a classroom ML classifier into a modular, tested, API-driven, web-integrated, container-ready AI service with documented handoff and reproducible deployment steps."

