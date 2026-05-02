from typing import Optional

from pydantic import BaseModel, Field, field_validator


class PredictRequest(BaseModel):
    title: str = Field(..., min_length=2, max_length=500, description="Product title.")
    description: Optional[str] = Field(default=None, max_length=5000, description="Optional product description.")

    @field_validator("title")
    @classmethod
    def title_not_blank(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("title must not be blank or whitespace only")
        return value

    @field_validator("description")
    @classmethod
    def empty_description_to_none(cls, value: Optional[str]) -> Optional[str]:
        if value is not None and not value.strip():
            return None
        return value


class BatchItem(BaseModel):
    title: str = Field(..., min_length=2, max_length=500)
    description: Optional[str] = Field(default=None, max_length=5000)


class BatchPredictRequest(BaseModel):
    products: list[BatchItem] = Field(..., min_length=1, max_length=50, description="Max 50 products per request.")

