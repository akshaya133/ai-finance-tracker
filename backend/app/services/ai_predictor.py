from datetime import datetime, timedelta
from typing import Dict
from app.database import get_database


async def predict_next_month_spending(user_id: str) -> Dict:
    db = get_database()
    six_months_ago = datetime.utcnow() - timedelta(days=180)

    pipeline = [
        {
            "$match": {
                "user_id": str(user_id),  # ✅ fixed
                "transaction_type": "expense",
                "date": {"$gte": six_months_ago},
            }
        },
        {
            "$group": {
                "_id": {
                    "year":  {"$year": "$date"},
                    "month": {"$month": "$date"},
                },
                "total": {"$sum": "$amount"},
            }
        },
        {
            "$sort": {"_id.year": 1, "_id.month": 1}
        },
    ]

    totals = []
    async for doc in db.transactions.aggregate(pipeline):
        totals.append(doc["total"])

    if len(totals) < 2:
        return {
            "predicted_spending": 0,
            "confidence": "low",
            "message": "Add more transaction data to enable predictions",
        }

    avg = sum(totals) / len(totals)
    weights = list(range(1, len(totals) + 1))
    weighted = sum(t * w for t, w in zip(totals, weights)) / sum(weights)
    prediction = max(weighted, 0)
    confidence = "high" if len(totals) >= 6 else "medium" if len(totals) >= 4 else "low"

    return {
        "predicted_spending": round(prediction, 2),
        "simple_average":     round(avg, 2),
        "weighted_average":   round(weighted, 2),
        "confidence":         confidence,
        "monthly_history":    [round(t, 2) for t in totals],
    }


async def get_spending_insights(user_id: str) -> Dict:
    db = get_database()
    now = datetime.utcnow()
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    last_month_start = (month_start - timedelta(days=1)).replace(day=1)

    current = {}
    async for doc in db.transactions.aggregate([
        {
            "$match": {
                "user_id": str(user_id),  # ✅ fixed
                "transaction_type": "expense",
                "date": {"$gte": month_start},
            }
        },
        {
            "$group": {
                "_id":   "$category",
                "total": {"$sum": "$amount"},
            }
        },
    ]):
        current[doc["_id"]] = doc["total"]

    last = {}
    async for doc in db.transactions.aggregate([
        {
            "$match": {
                "user_id": str(user_id),  # ✅ fixed
                "transaction_type": "expense",
                "date": {"$gte": last_month_start, "$lt": month_start},
            }
        },
        {
            "$group": {
                "_id":   "$category",
                "total": {"$sum": "$amount"},
            }
        },
    ]):
        last[doc["_id"]] = doc["total"]

    insights = []
    for cat, total in current.items():
        prev = last.get(cat, 0)
        if prev > 0:
            change = ((total - prev) / prev) * 100
            if change > 30:
                insights.append({
                    "type":     "warning",
                    "category": cat,
                    "message":  f"{cat} spending up {change:.0f}% vs last month",
                })
            elif change < -20:
                insights.append({
                    "type":     "positive",
                    "category": cat,
                    "message":  f"{cat} spending down {abs(change):.0f}% vs last month",
                })

    return {
        "insights":            insights,
        "current_month_total": round(sum(current.values()), 2),
    }