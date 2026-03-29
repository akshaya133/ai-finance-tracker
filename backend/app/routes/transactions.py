from fastapi import APIRouter, Depends, HTTPException, Query
from app.database import get_database
from app.schemas.transaction import TransactionCreate, TransactionUpdate, TransactionResponse
from app.utils.security import get_current_user
from app.services.ai_categorizer import predict_category
from bson import ObjectId
from datetime import datetime
from typing import Optional, List

router = APIRouter(prefix="/transactions", tags=["Transactions"])

def fmt(tx):
    return {"id": str(tx["_id"]), "amount": tx["amount"], "description": tx["description"],
            "transaction_type": tx["transaction_type"], "category": tx["category"],
            "ai_category": tx.get("ai_category"), "ai_confidence": tx.get("ai_confidence"),
            "date": tx["date"], "tags": tx.get("tags", []), "notes": tx.get("notes", ""), "created_at": tx["created_at"]}

@router.post("/", response_model=TransactionResponse)
async def create(tx: TransactionCreate, user: dict = Depends(get_current_user)):
    db = get_database()
    ai = predict_category(tx.description, tx.amount)
    doc = {"user_id": user["id"], "amount": tx.amount, "description": tx.description,
           "transaction_type": tx.transaction_type,
           "category": ai["category"] if not tx.category or tx.category == "other" else tx.category,
           "ai_category": ai["category"], "ai_confidence": ai["confidence"],
           "date": tx.date or datetime.utcnow(), "tags": tx.tags or [], "notes": tx.notes or "",
           "created_at": datetime.utcnow()}
    r = await db.transactions.insert_one(doc)
    doc["_id"] = r.inserted_id
    return fmt(doc)

@router.get("/", response_model=List[TransactionResponse])
async def get_all(skip: int = 0, limit: int = 50, transaction_type: Optional[str] = None,
                  category: Optional[str] = None, search: Optional[str] = None,
                  start_date: Optional[str] = None, end_date: Optional[str] = None,
                  user: dict = Depends(get_current_user)):
    db = get_database()
    q = {"user_id": user["id"]}
    if transaction_type: q["transaction_type"] = transaction_type
    if category: q["category"] = category
    if search: q["description"] = {"$regex": search, "$options": "i"}
    if start_date or end_date:
        df = {}
        if start_date: df["$gte"] = datetime.fromisoformat(start_date)
        if end_date: df["$lte"] = datetime.fromisoformat(end_date)
        q["date"] = df
    cursor = db.transactions.find(q).sort("date", -1).skip(skip).limit(limit)
    result = []
    async for tx in cursor: result.append(fmt(tx))
    return result

@router.get("/{tid}", response_model=TransactionResponse)
async def get_one(tid: str, user: dict = Depends(get_current_user)):
    db = get_database()
    tx = await db.transactions.find_one({"_id": ObjectId(tid), "user_id": user["id"]})
    if not tx: raise HTTPException(status_code=404, detail="Not found")
    return fmt(tx)

@router.put("/{tid}", response_model=TransactionResponse)
async def update(tid: str, data: TransactionUpdate, user: dict = Depends(get_current_user)):
    db = get_database()
    upd = {k: v for k, v in data.dict().items() if v is not None}
    if not upd: raise HTTPException(status_code=400, detail="Nothing to update")
    r = await db.transactions.update_one({"_id": ObjectId(tid), "user_id": user["id"]}, {"$set": upd})
    if r.matched_count == 0: raise HTTPException(status_code=404, detail="Not found")
    tx = await db.transactions.find_one({"_id": ObjectId(tid)})
    return fmt(tx)

@router.delete("/{tid}")
async def delete(tid: str, user: dict = Depends(get_current_user)):
    db = get_database()
    r = await db.transactions.delete_one({"_id": ObjectId(tid), "user_id": user["id"]})
    if r.deleted_count == 0: raise HTTPException(status_code=404, detail="Not found")
    return {"message": "Deleted"}