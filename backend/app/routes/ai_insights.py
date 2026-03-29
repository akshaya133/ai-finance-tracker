from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from app.utils.security import get_current_user
from app.services.ai_predictor import predict_next_month_spending, get_spending_insights
from app.services.anomaly_detector import detect_anomalies
from app.services.ai_categorizer import predict_category, get_model_metrics
from app.database import get_database
from datetime import datetime
import os

router = APIRouter(prefix="/ai", tags=["AI"])


@router.get("/predict")
async def predictions(user: dict = Depends(get_current_user)):
    try:
        return await predict_next_month_spending(str(user["id"]))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")


@router.get("/insights")
async def insights(user: dict = Depends(get_current_user)):
    try:
        return await get_spending_insights(str(user["id"]))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Insights failed: {str(e)}")


@router.get("/anomalies")
async def anomalies(user: dict = Depends(get_current_user)):
    try:
        return await detect_anomalies(str(user["id"]))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Anomaly detection failed: {str(e)}")


@router.get("/model-metrics")
async def model_metrics(user: dict = Depends(get_current_user)):
    return get_model_metrics()


@router.get("/confusion-matrix")
async def confusion_matrix_image(user: dict = Depends(get_current_user)):
    path = os.path.abspath(
        os.path.join(os.path.dirname(__file__), "../services/confusion_matrix.png")
    )
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Train the model first: python -m app.services.ml_trainer")
    return FileResponse(path, media_type="image/png")


@router.get("/budget-advice")
async def advice(user: dict = Depends(get_current_user)):
    try:
        db          = get_database()
        budget      = user.get("monthly_budget", 0)
        now         = datetime.utcnow()
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

        pipeline = [
            {
                "$match": {
                    "user_id": str(user["id"]),
                    "transaction_type": "expense",
                    "date": {"$gte": month_start},
                }
            },
            {"$group": {"_id": "$category", "total": {"$sum": "$amount"}}},
            {"$sort": {"total": -1}},
        ]

        categories = {}
        total      = 0
        async for doc in db.transactions.aggregate(pipeline):
            categories[doc["_id"]] = doc["total"]
            total += doc["total"]

        advice_list  = []
        days_left    = 30 - now.day
        daily_budget = round((budget - total) / days_left, 2) if days_left > 0 else 0

        if budget > 0:
            remaining = budget - total
            if remaining > 0:
                advice_list.append({
                    "type": "info", "title": "Budget Status",
                    "message": f"${remaining:.2f} remaining for {days_left} days",
                    "action":  f"${daily_budget:.2f} per day",
                })
            else:
                advice_list.append({
                    "type": "danger", "title": "Over Budget",
                    "message": f"Exceeded by ${abs(remaining):.2f}",
                    "action":  "Cut expenses immediately",
                })
        else:
            advice_list.append({
                "type": "warning", "title": "No Budget Set",
                "message": "Set a monthly budget to get personalised advice.",
                "action":  "Go to Settings → Budget",
            })

        return {
            "advice":       advice_list,
            "budget":       budget,
            "total_spent":  round(total, 2),
            "days_remaining": days_left,
            "spending_by_category": {k: round(v, 2) for k, v in categories.items()},
            "recommended_allocation": {
                "needs":   {"percentage": 50, "amount": round(budget * 0.5, 2)},
                "wants":   {"percentage": 30, "amount": round(budget * 0.3, 2)},
                "savings": {"percentage": 20, "amount": round(budget * 0.2, 2)},
            },
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Budget advice failed: {str(e)}")