from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from app.config import APP_NAME, APP_VERSION
from app.model_service import ModelRegistry
from app.schemas import BatchPredictRequest, PredictRequest

registry = ModelRegistry()


@asynccontextmanager
async def lifespan(_: FastAPI):
    try:
        registry.load()
    except Exception as exc:
        registry.ready = False
        registry.startup_error = str(exc)
    yield


def create_app() -> FastAPI:
    app = FastAPI(
        title=APP_NAME,
        version=APP_VERSION,
        description=(
            "Production-ready inference service for e-commerce product classification. "
            "Includes confidence routing, API validation, batch prediction, and web UI integration."
        ),
        lifespan=lifespan,
    )

    # Allow Express backend to call this service
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.mount("/static", StaticFiles(directory="web"), name="static")

    @app.exception_handler(Exception)
    async def global_exception_handler(_: Request, exc: Exception):
        return JSONResponse(status_code=500, content={"error": "Internal server error", "detail": str(exc)})

    @app.get("/", include_in_schema=False)
    def home():
        return FileResponse("web/index.html")

    @app.get("/health", tags=["System"])
    def health():
        categories = registry.category_list()
        return {
            "status": "ok" if registry.ready else "degraded",
            "models_loaded": registry.ready,
            "categories_count": len(categories),
            "version": APP_VERSION,
            "startup_error": registry.startup_error,
        }

    @app.get("/categories", tags=["System"])
    def categories():
        if not registry.ready:
            raise HTTPException(status_code=503, detail=registry.startup_error or "Model not loaded")
        category_list = registry.category_list()
        return {"total": len(category_list), "categories": category_list}

    @app.post("/predict", tags=["Prediction"])
    def predict_single(payload: PredictRequest):
        if not registry.ready:
            raise HTTPException(status_code=503, detail=registry.startup_error or "Model not loaded")
        try:
            return registry.predict(payload.title, payload.description)
        except ValueError as exc:
            raise HTTPException(status_code=422, detail=str(exc)) from exc

    @app.post("/predict/batch", tags=["Prediction"])
    def predict_batch(payload: BatchPredictRequest):
        if not registry.ready:
            raise HTTPException(status_code=503, detail=registry.startup_error or "Model not loaded")
        results = []
        for item in payload.products:
            try:
                result = registry.predict(item.title, item.description)
                result["input_title"] = item.title
                results.append(result)
            except Exception as exc:
                results.append({"input_title": item.title, "predicted_category": None, "error": str(exc)})
        return {"total": len(results), "results": results}

    @app.post("/predict/title-only", tags=["Prediction"])
    def predict_title_only(title: str = Query(..., min_length=2, max_length=500)):
        if not registry.ready:
            raise HTTPException(status_code=503, detail=registry.startup_error or "Model not loaded")
        try:
            return registry.predict(title, None)
        except ValueError as exc:
            raise HTTPException(status_code=422, detail=str(exc)) from exc

    @app.post("/recommend", tags=["Recommendation"])
    def recommend(payload: dict):
        """Stub endpoint for future recommendation system.
        Will be implemented when the recommendation model is ready."""
        # TODO: load recommendation model when ready
        return {
            "recommendations": [],
            "status": "model_not_ready",
            "message": "Recommendation system is under development."
        }

    return app


app = create_app()

