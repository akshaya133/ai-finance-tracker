from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from app.utils.security import get_current_user
from app.database import get_database
from datetime import datetime
from typing import Optional
import csv, io, json

router = APIRouter(prefix="/export", tags=["Export"])

@router.get("/csv/transactions")
async def csv_export(transaction_type: Optional[str] = None, user: dict = Depends(get_current_user)):
    db = get_database()
    q = {"user_id": user["id"]}
    if transaction_type: q["transaction_type"] = transaction_type
    cursor = db.transactions.find(q).sort("date", -1)
    output = io.StringIO()
    w = csv.writer(output)
    w.writerow(['Date','Description','Type','Category','Amount','Tags','Notes'])
    ti, te = 0, 0
    async for tx in cursor:
        a = tx['amount']
        if tx['transaction_type'] == 'income': ti += a
        else: te += a
        w.writerow([tx['date'].strftime('%Y-%m-%d'), tx['description'], tx['transaction_type'],
                    tx['category'], f"{a:.2f}", ', '.join(tx.get('tags',[])), tx.get('notes','')])
    w.writerow([])
    w.writerow(['Total Income','','','',f'{ti:.2f}'])
    w.writerow(['Total Expenses','','','',f'{te:.2f}'])
    w.writerow(['Balance','','','',f'{ti-te:.2f}'])
    output.seek(0)
    fn = f"transactions_{datetime.utcnow().strftime('%Y%m%d')}.csv"
    return StreamingResponse(iter([output.getvalue()]), media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={fn}", "Access-Control-Expose-Headers": "Content-Disposition"})

@router.get("/json/transactions")
async def json_export(user: dict = Depends(get_current_user)):
    db = get_database()
    cursor = db.transactions.find({"user_id": user["id"]}).sort("date", -1)
    txs = []
    async for tx in cursor:
        txs.append({"id": str(tx["_id"]), "date": tx["date"].isoformat(), "description": tx["description"],
                     "type": tx["transaction_type"], "category": tx["category"], "amount": tx["amount"]})
    data = json.dumps({"exported": datetime.utcnow().isoformat(), "total": len(txs), "transactions": txs}, indent=2)
    fn = f"transactions_{datetime.utcnow().strftime('%Y%m%d')}.json"
    return StreamingResponse(iter([data]), media_type="application/json",
        headers={"Content-Disposition": f"attachment; filename={fn}", "Access-Control-Expose-Headers": "Content-Disposition"})

@router.get("/formats")
async def formats(user: dict = Depends(get_current_user)):
    return {"formats": [{"format": "CSV", "url": "/export/csv/transactions"}, {"format": "JSON", "url": "/export/json/transactions"}]}
