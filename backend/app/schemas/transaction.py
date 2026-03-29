from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class TransactionCreate(BaseModel):
    amount: float
    description: str
    transaction_type: str
    category: Optional[str] = "other"
    date: Optional[datetime] = None
    tags: Optional[List[str]] = []
    notes: Optional[str] = ""

class TransactionUpdate(BaseModel):
    amount: Optional[float] = None
    description: Optional[str] = None
    transaction_type: Optional[str] = None
    category: Optional[str] = None
    date: Optional[datetime] = None
    tags: Optional[List[str]] = None
    notes: Optional[str] = None

class TransactionResponse(BaseModel):
    id: str
    amount: float
    description: str
    transaction_type: str
    category: str
    ai_category: Optional[str] = None
    ai_confidence: Optional[float] = None
    date: datetime
    tags: List[str] = []
    notes: str = ""
    created_at: datetime
