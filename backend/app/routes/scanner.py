from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from app.utils.security import get_current_user
from app.services.receipt_scanner import receipt_scanner
from app.services.ai_categorizer import predict_category
from app.database import get_database
from datetime import datetime
import re
import io

router = APIRouter(prefix="/scanner", tags=["Scanner"])


@router.post("/receipt")
async def scan(file: UploadFile = File(...), user: dict = Depends(get_current_user)):
    allowed = ["image/jpeg", "image/png", "image/jpg", "image/webp"]
    if file.content_type not in allowed:
        raise HTTPException(status_code=400, detail="Invalid file type")
    contents = await file.read()
    result = await receipt_scanner.scan_receipt(contents)
    if "error" in result:
        raise HTTPException(status_code=500, detail=result["error"])
    return {"success": True, "data": result}


@router.post("/text-scan")
async def text_scan(text: str, user: dict = Depends(get_current_user)):
    match = re.search(r'\$([\d,]+\.?\d{0,2})', text)
    amount = float(match.group(1).replace(',', '')) if match else None
    ai = predict_category(text, amount or 0)
    return {
        "text": text,
        "extracted_amount": amount,
        "ai_category": ai["category"],
        "confidence": ai["confidence"],
        "matched_keywords": ai.get("matched_keywords", []),
        "all_scores": ai.get("all_scores", {}),
    }


@router.post("/excel-preview")
async def excel_preview(
    file: UploadFile = File(...),
    user: dict = Depends(get_current_user)
):
    allowed = [
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-excel",
        "text/csv",
        "application/csv",
        "application/octet-stream",
    ]
    if file.content_type not in allowed:
        raise HTTPException(status_code=400, detail="Please upload an Excel (.xlsx, .xls) or CSV file")

    contents = await file.read()
    rows = []

    # Try Excel first, then CSV
    try:
        import openpyxl
        wb = openpyxl.load_workbook(io.BytesIO(contents), data_only=True)
        ws = wb.active
        rows = list(ws.iter_rows(values_only=True))
    except Exception:
        try:
            import csv
            decoded = contents.decode("utf-8", errors="ignore")
            reader = csv.reader(io.StringIO(decoded))
            rows = list(reader)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Could not parse file: {str(e)}")

    if not rows or len(rows) < 2:
        raise HTTPException(status_code=400, detail="File is empty or has no data rows")

    header = [str(h).lower().strip() if h else "" for h in rows[0]]

    def find_col(keywords):
        for kw in keywords:
            for i, h in enumerate(header):
                if kw in h:
                    return i
        return None

    desc_col   = find_col(["description", "narration", "details", "particular", "remarks", "note", "name", "merchant"])
    amount_col = find_col(["amount", "debit", "credit", "value", "sum", "price"])
    date_col   = find_col(["date", "time", "on"])
    type_col   = find_col(["type", "transaction type", "dr/cr", "debit/credit"])

    transactions = []
    for i, row in enumerate(rows[1:], start=2):
        if not any(row):
            continue

        description = str(row[desc_col]).strip() if desc_col is not None and row[desc_col] else f"Row {i}"

        raw_amount = row[amount_col] if amount_col is not None else None
        try:
            amount = float(str(raw_amount).replace(',', '').replace('$', '').strip()) if raw_amount else 0.0
        except ValueError:
            amount = 0.0

        raw_date = row[date_col] if date_col is not None else None
        try:
            if isinstance(raw_date, datetime):
                date = raw_date.isoformat()
            elif raw_date:
                date = str(raw_date)
            else:
                date = datetime.utcnow().isoformat()
        except Exception:
            date = datetime.utcnow().isoformat()

        raw_type = str(row[type_col]).lower().strip() if type_col is not None and row[type_col] else ""
        if any(w in raw_type for w in ["credit", "cr", "income", "deposit", "salary"]):
            tx_type = "income"
        else:
            tx_type = "expense"

        ai = predict_category(description, amount)

        transactions.append({
            "row": i,
            "description": description,
            "amount": round(amount, 2),
            "date": date,
            "transaction_type": tx_type,
            "category": ai["category"],
            "confidence": ai["confidence"],
            "matched_keywords": ai.get("matched_keywords", []),
        })

    return {
        "total_rows": len(transactions),
        "headers_detected": {
            "description": header[desc_col] if desc_col is not None else "not found",
            "amount":      header[amount_col] if amount_col is not None else "not found",
            "date":        header[date_col] if date_col is not None else "not found",
            "type":        header[type_col] if type_col is not None else "not found",
        },
        "transactions": transactions,
    }


@router.post("/excel-save")
async def excel_save(
    data: dict,
    user: dict = Depends(get_current_user)
):
    db = get_database()
    transactions = data.get("transactions", [])
    if not transactions:
        raise HTTPException(status_code=400, detail="No transactions to save")

    docs = []
    for tx in transactions:
        try:
            date = datetime.fromisoformat(str(tx["date"]))
        except Exception:
            date = datetime.utcnow()

        docs.append({
            "user_id":       str(user["id"]),
            "amount":        float(tx["amount"]),
            "description":   tx["description"],
            "transaction_type": tx["transaction_type"],
            "category":      tx["category"],
            "ai_category":   tx["category"],
            "ai_confidence": tx["confidence"],
            "date":          date,
            "tags":          [],
            "notes":         "Imported from Excel",
            "created_at":    datetime.utcnow(),
        })

    result = await db.transactions.insert_many(docs)
    return {
        "saved":   len(result.inserted_ids),
        "message": f"Successfully imported {len(result.inserted_ids)} transactions",
    }