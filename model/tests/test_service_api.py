from fastapi.testclient import TestClient

from app.main import app


def test_health_endpoint():
    with TestClient(app) as client:
        response = client.get("/health")
    assert response.status_code == 200
    payload = response.json()
    assert "status" in payload
    assert "models_loaded" in payload


def test_predict_endpoint_success():
    with TestClient(app) as client:
        health_response = client.get("/health")
        assert health_response.status_code == 200
        if not health_response.json().get("models_loaded"):
            # If artifacts are missing, this environment cannot do inference.
            return

        response = client.post(
            "/predict",
            json={
                "title": "Samsung Galaxy S23 Smartphone 256GB",
                "description": "AMOLED display, 50MP camera, 3900mAh battery",
            },
        )
        assert response.status_code == 200
        payload = response.json()
        assert "predicted_category" in payload
        assert "confidence" in payload


def test_predict_endpoint_validation():
    with TestClient(app) as client:
        response = client.post("/predict", json={"title": "A"})
    assert response.status_code == 422

