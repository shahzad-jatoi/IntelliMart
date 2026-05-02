"""
Assignment 3 — Member 3: Stress Testing
E-commerce Product Classifier API — Stress Test Script

Tests:
    1. Health check verification
    2. Single prediction correctness tests
    3. Edge case tests (empty description, special chars, very long text)
    4. Latency test — 50 sequential requests, measures response time
    5. Throughput test — measures requests per second
    6. Batch prediction test
    7. Invalid input / error handling test

Usage:
    Make sure the API is running first:
        uvicorn main:app --host 0.0.0.0 --port 8000

    Then run:
        python test_api.py

Output:
    Prints a full report of all test results with pass/fail status
    and a performance summary table.
"""

import time
import json
import statistics
import requests

# ── CONFIG ────────────────────────────────────────────────────────────────────

BASE_URL        = "http://localhost:8000"
LATENCY_RUNS    = 50     # number of requests for latency test
TIMEOUT         = 10     # seconds per request before timeout

# ── TEST PRODUCTS ─────────────────────────────────────────────────────────────

# Products with known expected categories — used for correctness tests
CORRECTNESS_TESTS = [
    {
        "title":       "Samsung Galaxy S23 Smartphone 256GB",
        "description": "6.1 inch AMOLED display with 50MP camera and 3900mAh battery",
        "expected":    ["Cell_Phones_and_Accessories", "Electronics"],
        "label":       "Smartphone"
    },
    {
        "title":       "Harry Potter and the Sorcerers Stone",
        "description": "A young boy discovers he is a wizard and attends Hogwarts School of Witchcraft and Wizardry",
        "expected":    ["Books"],
        "label":       "Book"
    },
    {
        "title":       "Nike Air Max Running Shoes Men Size 10",
        "description": "Lightweight breathable mesh upper with Air Max cushioning for long distance running",
        "expected":    ["Sports_and_Outdoors", "Clothing_Shoes_and_Jewelry"],
        "label":       "Shoes"
    },
    {
        "title":       "Instant Pot Duo 7-in-1 Electric Pressure Cooker 6 Quart",
        "description": "Pressure cooker slow cooker rice cooker steamer saute yogurt maker and warmer",
        "expected":    ["Home_and_Kitchen"],
        "label":       "Kitchen Appliance"
    },
    {
        "title":       "CeraVe Moisturizing Cream 19oz",
        "description": "Daily face and body moisturizer for dry skin with hyaluronic acid and ceramides",
        "expected":    ["Beauty", "Health_and_Personal_Care"],
        "label":       "Skincare"
    },
    {
        "title":       "LEGO Star Wars Millennium Falcon Building Kit",
        "description": "Build the iconic Millennium Falcon from Star Wars with 1351 pieces for ages 9 and up",
        "expected":    ["Toys_and_Games"],
        "label":       "Toy"
    },
    {
        "title":       "Purina Pro Plan High Protein Dog Food",
        "description": "Chicken and rice formula with 30 percent protein for adult dogs supports strong muscles",
        "expected":    ["Pet_Supplies"],
        "label":       "Pet Food"
    },
    {
        "title":       "Bosch 18V Cordless Drill Driver Kit",
        "description": "Variable speed drill with lithium ion battery charger and carrying case included",
        "expected":    ["Tools_and_Home_Improvement"],
        "label":       "Power Tool"
    },
]

# Products for latency test — varied to avoid caching effects
LATENCY_PRODUCTS = [
    {"title": "Apple iPhone 15 Pro Max 512GB",
     "description": "6.7 inch Super Retina XDR display with A17 Pro chip"},
    {"title": "The Great Gatsby by F Scott Fitzgerald",
     "description": "Classic American novel set in the Jazz Age"},
    {"title": "Yoga Mat Non Slip 6mm Thick",
     "description": "Exercise mat for yoga pilates and floor workouts"},
    {"title": "KitchenAid Stand Mixer 5 Quart",
     "description": "Professional grade mixer with 10 speeds and tilt head design"},
    {"title": "Neutrogena Hydrating Facial Cleanser",
     "description": "Gentle daily face wash with hyaluronic acid for all skin types"},
    {"title": "Monopoly Classic Board Game",
     "description": "The classic property trading game for 2 to 6 players ages 8 and up"},
    {"title": "Sony WH-1000XM5 Wireless Headphones",
     "description": "Industry leading noise cancelling with 30 hour battery life"},
    {"title": "Amazon Echo Dot 5th Generation",
     "description": "Smart speaker with Alexa improved audio and temperature sensor"},
    {"title": "Organic Green Tea Bags 100 Count",
     "description": "USDA certified organic green tea from Japan individually wrapped"},
    {"title": "DeWalt 20V Circular Saw",
     "description": "6.5 inch blade with electric brake and dust blower for clean cuts"},
]


# ── HELPERS ───────────────────────────────────────────────────────────────────

def separator(title: str):
    print(f"\n{'=' * 60}")
    print(f"  {title}")
    print('=' * 60)


def result_line(label: str, passed: bool, detail: str = ""):
    status = "PASS" if passed else "FAIL"
    icon   = "[+]" if passed else "[x]"
    print(f"  {icon} {status}  |  {label}")
    if detail:
        print(f"         {detail}")


def post(endpoint: str, payload: dict) -> tuple:
    """Send a POST request. Returns (response_json, latency_ms, status_code)."""
    start = time.perf_counter()
    try:
        r = requests.post(
            f"{BASE_URL}{endpoint}",
            json=payload,
            timeout=TIMEOUT
        )
        latency_ms = (time.perf_counter() - start) * 1000
        return r.json(), latency_ms, r.status_code
    except requests.exceptions.ConnectionError:
        print("\n  [ERROR] Cannot connect to API. Is the server running?")
        print(f"  Expected: uvicorn main:app --host 0.0.0.0 --port 8000")
        exit(1)
    except Exception as e:
        latency_ms = (time.perf_counter() - start) * 1000
        return {"error": str(e)}, latency_ms, 0


def get(endpoint: str) -> tuple:
    """Send a GET request. Returns (response_json, latency_ms, status_code)."""
    start = time.perf_counter()
    try:
        r = requests.get(f"{BASE_URL}{endpoint}", timeout=TIMEOUT)
        latency_ms = (time.perf_counter() - start) * 1000
        return r.json(), latency_ms, r.status_code
    except requests.exceptions.ConnectionError:
        print("\n  [ERROR] Cannot connect to API. Is the server running?")
        exit(1)
    except Exception as e:
        latency_ms = (time.perf_counter() - start) * 1000
        return {"error": str(e)}, latency_ms, 0


# ── TEST SUITES ───────────────────────────────────────────────────────────────

def test_health():
    separator("TEST 1 — Health Check")
    data, ms, code = get("/health")

    result_line("Status code is 200",       code == 200)
    result_line("status field is 'ok'",     data.get("status") == "ok")
    result_line("models_loaded is True",    data.get("models_loaded") is True)
    result_line("lr_model is True",         data.get("lr_model") is True)
    result_line("nb_model is True",         data.get("nb_model") is True)
    result_line("categories_count > 0",     data.get("categories_count", 0) > 0)

    print(f"\n  Categories loaded : {data.get('categories_count')}")
    print(f"  Response time     : {ms:.1f} ms")
    return code == 200


def test_categories():
    separator("TEST 2 — Categories Endpoint")
    data, ms, code = get("/categories")

    has_total      = "total" in data
    has_categories = "categories" in data and isinstance(data["categories"], list)
    count          = data.get("total", 0)

    result_line("Status code is 200",         code == 200)
    result_line("Response has 'total' field", has_total)
    result_line("Response has 'categories'",  has_categories)
    result_line("At least 1 category exists", count > 0)

    if has_categories:
        print(f"\n  Total categories  : {count}")
        print(f"  Categories        : {', '.join(data['categories'][:5])} ...")
    print(f"  Response time     : {ms:.1f} ms")


def test_correctness():
    separator("TEST 3 — Prediction Correctness")
    passed = 0

    for test in CORRECTNESS_TESTS:
        data, ms, code = post("/predict", {
            "title":       test["title"],
            "description": test["description"]
        })
        predicted  = data.get("predicted_category", "")
        confidence = data.get("confidence", 0)
        correct    = predicted in test["expected"]

        result_line(
            f"{test['label']} → {predicted}  ({confidence:.0%} conf)",
            correct,
            f"Expected one of: {test['expected']}"
        )
        if correct:
            passed += 1

    print(f"\n  Correctness score : {passed}/{len(CORRECTNESS_TESTS)}")
    return passed


def test_edge_cases():
    separator("TEST 4 — Edge Cases & Robustness")

    # Edge case 1: No description (title only)
    data, ms, code = post("/predict", {
        "title": "Wireless Bluetooth Earbuds"
    })
    has_pred = "predicted_category" in data
    result_line(
        "No description → still predicts",
        has_pred and code == 200,
        f"Predicted: {data.get('predicted_category')} | Preview: {data.get('input_preview','')[:60]}"
    )

    # Edge case 2: HTML tags in title
    data, ms, code = post("/predict", {
        "title":       "<b>Organic Coffee Beans</b> Dark Roast",
        "description": "<p>100% arabica beans from Colombia</p>"
    })
    preview = data.get("input_preview", "")
    result_line(
        "HTML tags in input → cleaned correctly",
        "<b>" not in preview and "<p>" not in preview and code == 200,
        f"Preview after cleaning: {preview[:60]}"
    )

    # Edge case 3: Very short title
    data, ms, code = post("/predict", {
        "title":       "Pen",
        "description": "A writing instrument"
    })
    result_line(
        "Very short title → handled",
        code in [200, 422],
        f"Status: {code} | Predicted: {data.get('predicted_category', data.get('detail', ''))}"
    )

    # Edge case 4: Special characters and emojis
    data, ms, code = post("/predict", {
        "title":       "Running Shoes 👟 Best Quality!!!",
        "description": "Perfect for marathon & 5K runs #sports @nike"
    })
    result_line(
        "Special chars and emojis → cleaned",
        code == 200,
        f"Predicted: {data.get('predicted_category')} | Preview: {data.get('input_preview','')[:60]}"
    )

    # Edge case 5: Very long description
    long_desc = "This is a very detailed product description. " * 100
    data, ms, code = post("/predict", {
        "title":       "Generic Product",
        "description": long_desc
    })
    result_line(
        "Very long description → handled",
        code in [200, 422],
        f"Status: {code} | Predicted: {data.get('predicted_category', 'N/A')}"
    )

    # Edge case 6: Numbers only in title
    data, ms, code = post("/predict", {
        "title":       "12345 67890",
        "description": "Product with numeric title"
    })
    result_line(
        "Numeric title → handled",
        code in [200, 422],
        f"Status: {code} | Predicted: {data.get('predicted_category', 'N/A')}"
    )

    # Edge case 7: Invalid input — title too short
    data, ms, code = post("/predict", {"title": "A"})
    result_line(
        "Title too short (1 char) → 422 validation error",
        code == 422,
        f"Status: {code} — correct rejection"
    )

    # Edge case 8: Missing title entirely
    data, ms, code = post("/predict", {"description": "Some description"})
    result_line(
        "Missing title → 422 validation error",
        code == 422,
        f"Status: {code} — correct rejection"
    )


def test_latency():
    separator(f"TEST 5 — Latency ({LATENCY_RUNS} sequential requests)")
    latencies = []
    errors    = 0

    print(f"  Sending {LATENCY_RUNS} requests...", end=" ", flush=True)

    for i in range(LATENCY_RUNS):
        product = LATENCY_PRODUCTS[i % len(LATENCY_PRODUCTS)]
        data, ms, code = post("/predict", product)
        if code == 200:
            latencies.append(ms)
        else:
            errors += 1

    print("done")

    if latencies:
        avg     = statistics.mean(latencies)
        median  = statistics.median(latencies)
        min_lat = min(latencies)
        max_lat = max(latencies)
        p95     = sorted(latencies)[int(len(latencies) * 0.95)]
        stdev   = statistics.stdev(latencies) if len(latencies) > 1 else 0

        print(f"\n  {'Metric':<20} {'Value':>10}")
        print(f"  {'-'*32}")
        print(f"  {'Requests sent':<20} {LATENCY_RUNS:>10}")
        print(f"  {'Successful':<20} {len(latencies):>10}")
        print(f"  {'Errors':<20} {errors:>10}")
        print(f"  {'Min latency':<20} {min_lat:>9.1f} ms")
        print(f"  {'Max latency':<20} {max_lat:>9.1f} ms")
        print(f"  {'Avg latency':<20} {avg:>9.1f} ms")
        print(f"  {'Median latency':<20} {median:>9.1f} ms")
        print(f"  {'P95 latency':<20} {p95:>9.1f} ms")
        print(f"  {'Std deviation':<20} {stdev:>9.1f} ms")

        result_line("Avg latency < 500ms",  avg < 500,  f"Avg: {avg:.1f}ms")
        result_line("P95 latency < 1000ms", p95 < 1000, f"P95: {p95:.1f}ms")
        result_line("Error rate is 0%",     errors == 0, f"Errors: {errors}/{LATENCY_RUNS}")

        return latencies
    else:
        print("  [ERROR] All requests failed.")
        return []


def test_throughput(latencies: list):
    separator("TEST 6 — Throughput")

    if not latencies:
        print("  [SKIP] No latency data available.")
        return

    avg_latency_s  = statistics.mean(latencies) / 1000
    rps_estimated  = 1 / avg_latency_s if avg_latency_s > 0 else 0

    print(f"  Estimated throughput  : {rps_estimated:.1f} requests/second")
    print(f"  Based on avg latency  : {avg_latency_s*1000:.1f} ms per request")
    print(f"  (Sequential — single threaded. Real throughput higher with concurrent requests.)")

    result_line(
        "Throughput > 1 req/sec",
        rps_estimated > 1,
        f"{rps_estimated:.1f} req/s"
    )


def test_batch():
    separator("TEST 7 — Batch Prediction")

    batch_payload = {
        "products": [
            {"title": "Apple MacBook Pro 16 inch M3",
             "description": "Professional laptop with M3 chip 16GB RAM 512GB SSD"},
            {"title": "The Alchemist by Paulo Coelho",
             "description": "A philosophical novel about following your dreams"},
            {"title": "Adidas Ultraboost Running Shoes",
             "description": "Responsive running shoes with Boost midsole technology"},
            {"title": "Dyson V15 Detect Cordless Vacuum",
             "description": "Laser detects invisible dust with up to 60 min battery"},
            {"title": "Vitamin C Serum with Hyaluronic Acid",
             "description": "Anti-aging brightening serum for face 1 oz bottle"},
        ]
    }

    data, ms, code = post("/predict/batch", batch_payload)

    total   = data.get("total", 0)
    results = data.get("results", [])

    result_line("Status code is 200",           code == 200)
    result_line("Returns correct count (5)",     total == 5)
    result_line("All results have predictions",  all("predicted_category" in r for r in results))

    if results:
        print(f"\n  {'Product':<35} {'Predicted Category':<30} {'Conf':>6}")
        print(f"  {'-'*73}")
        titles = [p["title"] for p in batch_payload["products"]]
        for title, result in zip(titles, results):
            cat  = result.get("predicted_category", "ERROR")
            conf = result.get("confidence", 0)
            print(f"  {title[:33]:<35} {cat:<30} {conf:>5.0%}")

    print(f"\n  Batch response time : {ms:.1f} ms for 5 products")
    print(f"  Avg per product     : {ms/5:.1f} ms")


def test_title_only():
    separator("TEST 8 — Title-Only Endpoint")

    import urllib.parse
    title   = "Canon EOS R50 Mirrorless Camera"
    encoded = urllib.parse.quote(title)

    start  = time.perf_counter()
    try:
        r      = requests.post(
            f"{BASE_URL}/predict/title-only?title={encoded}",
            timeout=TIMEOUT
        )
        ms     = (time.perf_counter() - start) * 1000
        data   = r.json()
        code   = r.status_code
    except Exception as e:
        data, ms, code = {"error": str(e)}, 0, 0

    predicted = data.get("predicted_category", "")
    preview   = data.get("input_preview", "")

    result_line("Status code is 200",                    code == 200)
    result_line("Returns a predicted category",          bool(predicted))
    result_line("description_not_present flag in text",  "description_not_present" in preview,
                f"Preview: {preview[:70]}")

    print(f"  Predicted : {predicted}")
    print(f"  Confidence: {data.get('confidence', 0):.0%}")


# ── MAIN ──────────────────────────────────────────────────────────────────────

def main():
    print("\n" + "=" * 60)
    print("  E-COMMERCE CLASSIFIER API — STRESS TEST REPORT")
    print(f"  Target: {BASE_URL}")
    print("=" * 60)

    # Verify server is reachable before running tests
    try:
        requests.get(f"{BASE_URL}/health", timeout=3)
    except requests.exceptions.ConnectionError:
        print(f"\n[ERROR] Cannot connect to {BASE_URL}")
        print("Make sure the server is running:")
        print("    uvicorn main:app --host 0.0.0.0 --port 8000 --reload")
        return

    # Run all tests
    server_ok = test_health()
    if not server_ok:
        print("\n[ABORT] Health check failed — skipping remaining tests.")
        return

    test_categories()
    correct = test_correctness()
    test_edge_cases()
    latencies = test_latency()
    test_throughput(latencies)
    test_batch()
    test_title_only()

    # ── Final Summary
    separator("FINAL SUMMARY")
    if latencies:
        avg = statistics.mean(latencies)
        p95 = sorted(latencies)[int(len(latencies) * 0.95)]
        print(f"  Correctness       : {correct}/{len(CORRECTNESS_TESTS)} known products classified correctly")
        print(f"  Avg latency       : {avg:.1f} ms")
        print(f"  P95 latency       : {p95:.1f} ms")
        print(f"  Throughput (est.) : {1000/avg:.1f} req/s")
        print(f"  All tests         : completed")
    print(f"\n  API is {'READY' if server_ok else 'NOT READY'} for submission.")
    print("=" * 60 + "\n")


if __name__ == "__main__":
    main()