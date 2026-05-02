import datetime
import json
import statistics
import time
from pathlib import Path

import requests


BASE_URL = "http://127.0.0.1:8000"
OUTPUT_FILE = Path("evaluation_results.txt")


def run_custom_comparisons() -> tuple[dict, list[dict]]:
    samples = [
        {
            "name": "Clear smartphone",
            "title": "Apple iPhone 15 Pro Max 512GB",
            "description": "A17 Pro chip, 6.7 inch display, titanium body",
        },
        {
            "name": "Ambiguous audio",
            "title": "Wireless earbuds bluetooth tws",
            "description": "noise cancelling audio device for gym and travel",
        },
        {"name": "Book title only", "title": "Atomic Habits by James Clear", "description": None},
        {
            "name": "Tool product",
            "title": "DeWalt 20V cordless drill kit",
            "description": "variable speed driver with battery and charger",
        },
        {
            "name": "Beauty product",
            "title": "Vitamin C face serum with hyaluronic acid",
            "description": "brightening anti aging skin care serum",
        },
    ]

    rows = []
    latencies = []

    for sample in samples:
        start = time.perf_counter()
        response = requests.post(
            f"{BASE_URL}/predict",
            json={"title": sample["title"], "description": sample["description"]},
            timeout=20,
        )
        latency_ms = (time.perf_counter() - start) * 1000
        latencies.append(latency_ms)
        payload = response.json()

        rows.append(
            {
                "sample": sample["name"],
                "endpoint": "/predict",
                "status": response.status_code,
                "predicted_category": payload.get("predicted_category"),
                "confidence": payload.get("confidence"),
                "model_used": payload.get("model_used"),
                "low_confidence": payload.get("low_confidence"),
                "latency_ms": round(latency_ms, 1),
            }
        )

        if sample["description"] is None:
            start = time.perf_counter()
            title_only_response = requests.post(
                f"{BASE_URL}/predict/title-only",
                params={"title": sample["title"]},
                timeout=20,
            )
            title_only_latency_ms = (time.perf_counter() - start) * 1000
            title_only_payload = title_only_response.json()
            rows.append(
                {
                    "sample": sample["name"],
                    "endpoint": "/predict/title-only",
                    "status": title_only_response.status_code,
                    "predicted_category": title_only_payload.get("predicted_category"),
                    "confidence": title_only_payload.get("confidence"),
                    "model_used": title_only_payload.get("model_used"),
                    "low_confidence": title_only_payload.get("low_confidence"),
                    "latency_ms": round(title_only_latency_ms, 1),
                }
            )

    summary = {
        "generated_at": datetime.datetime.now().isoformat(),
        "samples_tested": len(samples),
        "avg_latency_ms": round(statistics.mean(latencies), 1),
        "min_latency_ms": round(min(latencies), 1),
        "max_latency_ms": round(max(latencies), 1),
    }
    return summary, rows


def evaluate_core_metrics() -> dict:
    health = requests.get(f"{BASE_URL}/health", timeout=20).json()
    categories = requests.get(f"{BASE_URL}/categories", timeout=20).json()

    correctness_tests = [
        ("Smartphone", "Samsung Galaxy S23 Smartphone 256GB", "6.1 inch AMOLED display with 50MP camera and 3900mAh battery", ["Cell_Phones_and_Accessories", "Electronics"]),
        ("Book", "Harry Potter and the Sorcerers Stone", "A young boy discovers he is a wizard", ["Books"]),
        ("Shoes", "Nike Air Max Running Shoes Men Size 10", "Lightweight breathable upper with cushioning", ["Sports_and_Outdoors", "Clothing_Shoes_and_Jewelry"]),
        ("Kitchen", "Instant Pot Duo 7 in 1 Electric Pressure Cooker", "Pressure cooker, slow cooker and steamer", ["Home_and_Kitchen"]),
    ]

    correct = 0
    correctness_rows = []
    for label, title, description, expected in correctness_tests:
        response = requests.post(f"{BASE_URL}/predict", json={"title": title, "description": description}, timeout=20)
        payload = response.json()
        predicted = payload.get("predicted_category")
        ok = predicted in expected
        if ok:
            correct += 1
        correctness_rows.append(
            {
                "case": label,
                "predicted": predicted,
                "expected_any_of": expected,
                "confidence": payload.get("confidence"),
                "pass": ok,
            }
        )

    edge_cases = [
        {"name": "Empty description", "payload": {"title": "Wireless Bluetooth Earbuds"}, "expected_status": 200},
        {"name": "Title too short", "payload": {"title": "A"}, "expected_status": 422},
        {"name": "Missing title", "payload": {"description": "Some description"}, "expected_status": 422},
    ]
    edge_rows = []
    for item in edge_cases:
        response = requests.post(f"{BASE_URL}/predict", json=item["payload"], timeout=20)
        edge_rows.append(
            {
                "case": item["name"],
                "status": response.status_code,
                "expected_status": item["expected_status"],
                "pass": response.status_code == item["expected_status"],
            }
        )

    latency_samples = []
    latency_payload = {"title": "Apple iPhone 15 Pro Max 512GB", "description": "6.7 inch display with A17 Pro chip"}
    for _ in range(20):
        start = time.perf_counter()
        response = requests.post(f"{BASE_URL}/predict", json=latency_payload, timeout=20)
        if response.status_code == 200:
            latency_samples.append((time.perf_counter() - start) * 1000)

    latency_summary = {
        "runs": len(latency_samples),
        "min_ms": round(min(latency_samples), 1),
        "max_ms": round(max(latency_samples), 1),
        "avg_ms": round(statistics.mean(latency_samples), 1),
        "p95_ms": round(sorted(latency_samples)[int(len(latency_samples) * 0.95) - 1], 1),
        "throughput_req_per_sec_est": round(1000 / statistics.mean(latency_samples), 2),
    }

    return {
        "health": health,
        "categories_total": categories.get("total"),
        "correctness_score": f"{correct}/{len(correctness_tests)}",
        "correctness_details": correctness_rows,
        "edge_case_details": edge_rows,
        "latency_summary": latency_summary,
    }


def important_files_section() -> str:
    lines = [
        "IMPORTANT FILES (HIGH PRIORITY)",
        "- app/main.py: Main FastAPI app and routing.",
        "- app/model_service.py: Model loading + prediction logic.",
        "- app/preprocessing.py: Input cleaning/preprocessing pipeline.",
        "- app/schemas.py: Input validation contracts (Pydantic).",
        "- web/index.html: Browser UI integration.",
        "- requirements.txt: Runtime dependencies for reproducibility.",
        "- Dockerfile + docker-compose.yml: Containerized deployment.",
        "- tests/test_service_api.py: Core API unit tests.",
        "- handoff.md: Runbook + receiving-team handoff instructions.",
        "",
        "LESS IMPORTANT FILES (LOW PRIORITY FOR DAILY WORK)",
        "- .pytest_cache/*: Local test cache only.",
        "- __pycache__/*: Python bytecode cache.",
        "- test_api.py: Useful for stress testing, but not required for basic app operation.",
    ]
    return "\n".join(lines)


def main() -> None:
    core = evaluate_core_metrics()
    summary, comparison_rows = run_custom_comparisons()

    report_parts = ["PROJECT EVALUATION REPORT", "=" * 70, f"Generated at: {datetime.datetime.now().isoformat()}"]
    report_parts.append("\nCORE METRICS")
    report_parts.append(json.dumps(core, indent=2))
    report_parts.append("\n" + "=" * 70 + "\nCUSTOM COMPARISON RESULTS\n" + "=" * 70)
    report_parts.append(json.dumps(summary, indent=2))
    report_parts.append("\nPer-sample comparisons:")
    report_parts.extend(json.dumps(row, ensure_ascii=False) for row in comparison_rows)
    report_parts.append("\n" + "=" * 70 + "\n" + important_files_section())

    OUTPUT_FILE.write_text("\n".join(report_parts) + "\n", encoding="utf-8")
    print(f"Evaluation report generated: {OUTPUT_FILE.resolve()}")


if __name__ == "__main__":
    main()

