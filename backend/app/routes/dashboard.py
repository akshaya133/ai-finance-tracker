from fastapi import APIRouter, Depends
from app.database import get_database
from app.utils.security import get_current_user
from datetime import datetime, timedelta
from typing import Optional

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


def get_start_date(period: str, month: Optional[str] = None):
    now = datetime.utcnow()
    if period == "month" and month:
        year, m = map(int, month.split("-"))
        start = datetime(year, m, 1, 0, 0, 0)
        end = datetime(year + 1, 1, 1) if m == 12 else datetime(year, m + 1, 1)
        return start, end
    elif period == "year" and month:
        # month here is just the year e.g. "2025"
        year = int(month)
        start = datetime(year, 1, 1, 0, 0, 0)
        end = datetime(year + 1, 1, 1, 0, 0, 0)
        return start, end
    elif period == "week":
        start = (now - timedelta(days=7)).replace(hour=0, minute=0, second=0, microsecond=0)
        return start, None
    elif period == "month":
        start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        return start, None
    elif period == "year":
        start = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
        return start, None
    else:
        return datetime(2000, 1, 1), None


def build_date_filter(start, end):
    if end:
        return {"$gte": start, "$lt": end}
    return {"$gte": start}


# ================= SUMMARY =================
@router.get("/summary")
async def summary(
    period: Optional[str] = "month",
    month: Optional[str] = None,
    user: dict = Depends(get_current_user)
):
    db = get_database()
    start, end = get_start_date(period, month)

    pipeline = [
        {
            "$match": {
                "user_id": str(user["id"]),
                "date": build_date_filter(start, end)
            }
        },
        {
            "$group": {
                "_id": "$transaction_type",
                "total": {"$sum": "$amount"},
                "count": {"$sum": 1}
            }
        }
    ]

    results = {}
    async for doc in db.transactions.aggregate(pipeline):
        results[doc["_id"]] = {
            "total": round(doc["total"], 2),
            "count": doc["count"]
        }

    ti = results.get("income", {}).get("total", 0)
    te = results.get("expense", {}).get("total", 0)
    budget = user.get("monthly_budget", 0)

    return {
        "period": period,
        "month": month,
        "total_income": ti,
        "total_expense": te,
        "balance": round(ti - te, 2),
        "income_count": results.get("income", {}).get("count", 0),
        "expense_count": results.get("expense", {}).get("count", 0),
        "monthly_budget": budget,
        "budget_remaining": round(budget - te, 2) if budget > 0 else 0,
        "budget_percentage": round((te / budget * 100), 2) if budget > 0 else 0,
        "savings_rate": round(((ti - te) / ti * 100), 2) if ti > 0 else 0
    }


# ================= CATEGORY BREAKDOWN =================
@router.get("/category-breakdown")
async def categories(
    period: Optional[str] = "month",
    month: Optional[str] = None,
    transaction_type: Optional[str] = "expense",
    user: dict = Depends(get_current_user)
):
    db = get_database()
    start, end = get_start_date(period, month)

    pipeline = [
        {
            "$match": {
                "user_id": str(user["id"]),
                "transaction_type": transaction_type,
                "date": build_date_filter(start, end)
            }
        },
        {
            "$group": {
                "_id": "$category",
                "total": {"$sum": "$amount"},
                "count": {"$sum": 1}
            }
        },
        {
            "$sort": {"total": -1}
        }
    ]

    cats = []
    total = 0

    async for doc in db.transactions.aggregate(pipeline):
        total += doc["total"]
        cats.append({
            "category": doc["_id"],
            "total": round(doc["total"], 2),
            "count": doc["count"]
        })

    for c in cats:
        c["percentage"] = round((c["total"] / total * 100), 2) if total > 0 else 0

    return {
        "period": period,
        "month": month,
        "transaction_type": transaction_type,
        "total": round(total, 2),
        "categories": cats
    }


# ================= MONTHLY TREND =================
@router.get("/monthly-trend")
async def trend(months: int = 6, user: dict = Depends(get_current_user)):
    db = get_database()
    sd = (datetime.utcnow() - timedelta(days=months * 30)).replace(hour=0, minute=0, second=0, microsecond=0)

    pipeline = [
        {
            "$match": {
                "user_id": str(user["id"]),
                "date": {"$gte": sd}
            }
        },
        {
            "$group": {
                "_id": {
                    "y": {"$year": "$date"},
                    "m": {"$month": "$date"},
                    "t": "$transaction_type"
                },
                "total": {"$sum": "$amount"}
            }
        },
        {
            "$sort": {"_id.y": 1, "_id.m": 1}
        }
    ]

    data = {}
    async for doc in db.transactions.aggregate(pipeline):
        key = f"{doc['_id']['y']}-{doc['_id']['m']:02d}"
        if key not in data:
            data[key] = {"month": key, "income": 0, "expense": 0}
        data[key][doc["_id"]["t"]] = round(doc["total"], 2)

    result = []
    for k in sorted(data.keys()):
        d = data[k]
        d["balance"] = round(d["income"] - d["expense"], 2)
        result.append(d)

    return {"months": months, "trend": result}


# ================= DAILY TREND (specific month) =================
@router.get("/daily-trend")
async def daily_trend(
    month: str,
    user: dict = Depends(get_current_user)
):
    db = get_database()
    year, m = map(int, month.split("-"))
    start = datetime(year, m, 1, 0, 0, 0)
    end = datetime(year + 1, 1, 1) if m == 12 else datetime(year, m + 1, 1)

    pipeline = [
        {
            "$match": {
                "user_id": str(user["id"]),
                "date": {"$gte": start, "$lt": end}
            }
        },
        {
            "$group": {
                "_id": {
                    "day":  {"$dayOfMonth": "$date"},
                    "type": "$transaction_type"
                },
                "total": {"$sum": "$amount"}
            }
        },
        {
            "$sort": {"_id.day": 1}
        }
    ]

    data = {}
    async for doc in db.transactions.aggregate(pipeline):
        day = f"{month}-{doc['_id']['day']:02d}"
        if day not in data:
            data[day] = {"day": day, "income": 0, "expense": 0}
        data[day][doc["_id"]["type"]] = round(doc["total"], 2)

    result = []
    for k in sorted(data.keys()):
        d = data[k]
        d["balance"] = round(d["income"] - d["expense"], 2)
        result.append(d)

    return {"month": month, "daily": result}


# ================= YEARLY TREND (specific year) =================
@router.get("/yearly-trend")
async def yearly_trend(
    year: int,
    user: dict = Depends(get_current_user)
):
    db = get_database()
    start = datetime(year, 1, 1, 0, 0, 0)
    end = datetime(year + 1, 1, 1, 0, 0, 0)

    pipeline = [
        {
            "$match": {
                "user_id": str(user["id"]),
                "date": {"$gte": start, "$lt": end}
            }
        },
        {
            "$group": {
                "_id": {
                    "m":    {"$month": "$date"},
                    "type": "$transaction_type"
                },
                "total": {"$sum": "$amount"}
            }
        },
        {
            "$sort": {"_id.m": 1}
        }
    ]

    MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
              "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

    data = {}
    async for doc in db.transactions.aggregate(pipeline):
        m = doc["_id"]["m"]
        key = MONTHS[m - 1]
        if key not in data:
            data[key] = {"month": key, "income": 0, "expense": 0, "order": m}
        data[key][doc["_id"]["type"]] = round(doc["total"], 2)

    result = []
    for k in sorted(data.keys(), key=lambda x: data[x]["order"]):
        d = data[k]
        d["balance"] = round(d["income"] - d["expense"], 2)
        del d["order"]
        result.append(d)

    return {"year": year, "monthly": result}