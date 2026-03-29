# AI Finance Tracker
# 💰 AI Finance Tracker

An intelligent personal finance tracking web application built using the **FARM Stack** (FastAPI, React.js, MongoDB) with Machine Learning for automatic transaction categorization.

---

## 🚀 Features

- 🔐 **Secure Authentication** — JWT-based login and registration with bcrypt password hashing
- 🤖 **AI Categorization** — Automatically categorizes transactions using a trained SVM + TF-IDF ML model (84.31% accuracy)
- 📊 **Interactive Dashboard** — Monthly and yearly spending charts and summaries
- 🔍 **NLP Scanner** — Extract transaction amount and category from natural language input
- ⚠️ **Anomaly Detection** — Flags unusual spending using Z-score and IQR statistical methods
- 📈 **Spending Predictions** — Forecasts future expenses using weighted moving averages
- 📁 **Excel Import** — Bulk import transactions from Excel files with AI auto-categorization

---

## 🛠️ Tech Stack

### Frontend
- React.js
- Axios
- Chart.js
- React Router

### Backend
- FastAPI
- Uvicorn
- Python 3.10
- JWT (Jose)
- Bcrypt

### Database
- MongoDB (Motor async driver)

### Machine Learning
- Scikit-learn (SVM Classifier)
- TF-IDF Vectorizer
- NumPy / Pandas
- Joblib
- Matplotlib

---

## 📁 Project Structure

```
ai-finance-tracker/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── database.py
│   │   ├── routes/
│   │   │   ├── auth.py
│   │   │   ├── transactions.py
│   │   │   ├── dashboard.py
│   │   │   ├── ai_insights.py
│   │   │   └── scanner.py
│   │   ├── services/
│   │   │   ├── ai_categorizer.py
│   │   │   ├── ml_trainer.py
│   │   │   ├── anomaly_detector.py
│   │   │   └── ml_model.joblib
│   │   ├── schemas/
│   │   └── utils/
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── TransactionsPage.jsx
│   │   │   ├── ScannerPage.jsx
│   │   │   ├── InsightsPage.jsx
│   │   │   └── LoginPage.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   └── App.js
│   └── package.json
└── README.md
```

---

## ⚙️ Installation and Setup

### Prerequisites
- Python 3.10+
- Node.js 18+
- MongoDB (running locally)

### 1. Clone the repository
```bash
git clone https://github.com/akshaya133/ai-finance-tracker.git
cd ai-finance-tracker
```

### 2. Run the Backend
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --port 8000
```
Backend runs on → http://localhost:8000

### 3. Run the Frontend
Open a new terminal:
```bash
cd frontend
npm install
npm start
```
Frontend runs on → http://localhost:3000

### 4. Make sure MongoDB is running
```bash
mongod
```
MongoDB runs on → mongodb://localhost:27017

---

## 🔑 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register new user |
| POST | `/auth/login` | Login and get JWT token |
| GET | `/transactions` | Get all transactions |
| POST | `/transactions` | Add new transaction |
| DELETE | `/transactions/{id}` | Delete a transaction |
| GET | `/dashboard/summary` | Get monthly summary |
| GET | `/dashboard/trends` | Get spending trends |
| GET | `/ai/insights` | Get AI spending insights |
| GET | `/ai/anomalies` | Get anomaly alerts |
| GET | `/ai/predictions` | Get future predictions |
| POST | `/scanner/scan-text` | Extract transaction from text |
| POST | `/scanner/import-excel` | Import Excel file |

---

## 🤖 ML Model Details

- **Algorithm:** Support Vector Machine (SVM) with RBF kernel
- **Vectorizer:** TF-IDF (8000 features)
- **Accuracy:** 84.31%
- **Cross Validation:** 75.88% ± 3.80%
- **Training Samples:** 410
- **Categories:** 11 (food, transport, health, entertainment, utilities, shopping, education, investment, income, rent, others)

---

## 🔮 Future Enhancements

- LSTM deep learning model for better accuracy
- Mobile app using React Native
- Bank API integration using Plaid
- Cloud deployment (Vercel + Railway)
- Email alerts for anomalies
- Multi-currency support
