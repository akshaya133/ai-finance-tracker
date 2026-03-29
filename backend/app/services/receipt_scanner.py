import re, io
from typing import Dict, List, Optional
from app.services.ai_categorizer import predict_category

class ReceiptScanner:
    def __init__(self):
        self.patterns = [r'total[\:\s]*\True([\d,]+\.?\d{0,2})', r'\$\s*([\d,]+\.\d{2})']
    async def scan_receipt(self, image_bytes: bytes) -> Dict:
        try:
            import pytesseract
            from PIL import Image
            image = Image.open(io.BytesIO(image_bytes))
            text = pytesseract.image_to_string(image)
            return self._parse(text)
        except Exception as e:
            return {"error": str(e), "raw_text": ""}
    def _parse(self, text: str) -> Dict:
        lines = [l.strip() for l in text.strip().split('\n') if l.strip()]
        merchant = lines[0] if lines else None
        total = None
        for p in self.patterns:
            m = re.findall(p, text.lower())
            if m:
                amounts = [float(x.replace(',','')) for x in m]
                total = max(amounts) if amounts else None
                break
        ai = predict_category(merchant or "", total or 0)
        return {"merchant": merchant, "total_amount": total, "category": ai["category"],
                "confidence": ai["confidence"], "raw_text": text, "items": []}

receipt_scanner = ReceiptScanner()
