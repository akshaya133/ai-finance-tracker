from datetime import datetime, timedelta
from typing import Dict
from app.database import get_database
import statistics


async def detect_anomalies(user_id: str) -> Dict:
    db    = get_database()
    start = datetime.utcnow() - timedelta(days=90)

    cursor = db.transactions.find({
        "user_id":          user_id,
        "transaction_type": "expense",
        "date":             {"$gte": start}   # ✅ fixed: $gte was stripped
    }).sort("date", -1)

    txs     = []
    amounts = []

    async for tx in cursor:
        txs.append({
            "id":          str(tx["_id"]),
            "description": tx["description"],
            "amount":      tx["amount"],
            "category":    tx["category"],
            "date":        tx["date"],
        })
        amounts.append(tx["amount"])

    if len(amounts) < 5:
        return {
            "anomalies": [],
            "message":   "Not enough data (need at least 5 expense transactions in last 90 days)",
            "stats":     {},
        }

    mean_v   = statistics.mean(amounts)
    std_v    = statistics.stdev(amounts) if len(amounts) > 1 else 0
    median_v = statistics.median(amounts)

    sa  = sorted(amounts)
    n   = len(sa)
    q1  = sa[n // 4]
    q3  = sa[3 * n // 4]
    iqr = q3 - q1
    upper = q3 + 1.5 * iqr

    anomalies = []
    for tx in txs:
        reasons = []

        if std_v > 0:
            z = (tx["amount"] - mean_v) / std_v
            if abs(z) > 2:
                reasons.append(f"Unusually high amount (Z-score: {z:.2f})")

        if tx["amount"] > upper:
            reasons.append(f"Exceeds upper bound (${upper:.2f})")  # ✅ fixed: value was stripped

        if reasons:
            anomalies.append({
                "transaction": tx,
                "reasons":     reasons,
                "severity":    "high" if tx["amount"] > mean_v * 3 else "medium",
            })

    return {
        "anomalies":       anomalies[:10],
        "total_anomalies": len(anomalies),
        "message":         f"Found {len(anomalies)} anomalies in last 90 days",
        "stats": {
            "mean":        round(mean_v, 2),
            "median":      round(median_v, 2),
            "std_deviation": round(std_v, 2),
            "upper_bound": round(upper, 2),
            "total_transactions": len(amounts),
        },
    }