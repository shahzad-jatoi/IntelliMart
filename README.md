# IntelliMart — AI-Powered E-Commerce Product Classification System

An intelligent e-commerce platform that uses Machine Learning to automatically classify products into categories. Built with a React frontend, Express.js backend, and a Python FastAPI ML microservice.

## Architecture

```
client/     → React 18 frontend (Vite)
server/     → Express.js REST API (MVC pattern)
model/      → Python ML microservice (FastAPI)
```

## Features

- **ML Product Classification** — Two-model ensemble (Logistic Regression + Naive Bayes) with TF-IDF vectorization
- **Role-Based Access** — Buyer, Seller, and Admin dashboards
- **Product Management** — Upload, classify, re-classify, edit, delete
- **Shopping Flow** — Browse, search, cart, checkout, order history
- **AI Recommendations** — Personalized product recommendations based on purchase history
- **Analytics Dashboard** — Category distribution, confidence metrics, model performance
- **Admin Override** — Manual category correction with audit trail

## Quick Start

### 1. ML Model Service
```bash
cd model
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### 2. Express Backend
```bash
cd server
npm install
cp .env.example .env   # Edit with your MongoDB Atlas URI
npm run dev
```

### 3. React Frontend
```bash
cd client
npm install
npm run dev
```

### Access Points
| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:5000 |
| ML API Docs | http://localhost:8000/docs |

## ML Pipeline

Two-stage ensemble classification system:

1. **Stage 1:** Logistic Regression with TF-IDF vectorization (5,000 features, bigrams)
2. **Stage 2:** If LR confidence < 90%, blend with Naive Bayes (60% LR + 40% NB)

**Dataset:** Amazon Product Dataset — 50,247+ products across 19 categories  
**Preprocessing:** HTML tag removal, stopword handling, missing description imputation  
**Data Leakage Prevention:** Vectorizer fitted only on training data

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router, Axios, Chart.js |
| Backend | Express.js, Mongoose, JWT, bcryptjs, Nodemailer |
| ML Service | FastAPI, scikit-learn, joblib |
| Database | MongoDB Atlas |
| Styling | Custom CSS (Binance-inspired dark theme) |

## Project Structure

```
client/
├── src/
│   ├── components/    # Reusable UI components
│   ├── context/       # Auth & Cart providers
│   ├── pages/         # Route pages (Home, Products, Admin, etc.)
│   └── utils/         # API client, helpers

server/
├── controllers/       # Route handlers
├── middleware/         # Auth middleware
├── models/            # Mongoose schemas
├── routes/            # API routes
└── utils/             # Email service

model/
├── app/
│   ├── main.py        # FastAPI endpoints
│   ├── model_service.py  # Ensemble classification logic
│   └── config.py      # Threshold configuration
├── model_lr.joblib    # Trained Logistic Regression (not in repo)
├── model_nb.joblib    # Trained Naive Bayes (not in repo)
└── vectorizer.joblib  # TF-IDF vectorizer (not in repo)
```

## Environment Variables

Create `server/.env`:
```
MONGODB_URI=your_mongodb_atlas_uri
JWT_SECRET=your_jwt_secret
EMAIL_USER=your_email
EMAIL_PASS=your_app_password
MODEL_SERVICE_URL=http://localhost:8000
```

## License

MIT
