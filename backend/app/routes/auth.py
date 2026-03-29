from fastapi import APIRouter, HTTPException, status, Depends
from app.database import get_database
from app.schemas.user import UserCreate, UserLogin, UserResponse, Token
from app.utils.security import hash_password, verify_password, create_access_token, get_current_user
from datetime import datetime

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/register", response_model=Token)
async def register(user: UserCreate):
    db = get_database()
    existing = await db.users.find_one({"": [{"username": user.username}, {"email": user.email}]})
    if existing:
        raise HTTPException(status_code=400, detail="Username or email already exists")
    doc = {"username": user.username, "email": user.email, "hashed_password": hash_password(user.password),
           "full_name": user.full_name, "monthly_budget": user.monthly_budget, "currency": user.currency,
           "is_active": True, "created_at": datetime.utcnow(), "updated_at": datetime.utcnow()}
    result = await db.users.insert_one(doc)
    uid = str(result.inserted_id)
    token = create_access_token(data={"sub": uid})
    return {"access_token": token, "token_type": "bearer",
            "user": {"id": uid, "username": doc["username"], "email": doc["email"],
                     "full_name": doc["full_name"], "monthly_budget": doc["monthly_budget"],
                     "currency": doc["currency"], "created_at": doc["created_at"]}}

@router.post("/login", response_model=Token)
async def login(creds: UserLogin):
    db = get_database()
    user = await db.users.find_one({"username": creds.username})
    if not user or not verify_password(creds.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token(data={"sub": str(user["_id"])})
    return {"access_token": token, "token_type": "bearer",
            "user": {"id": str(user["_id"]), "username": user["username"], "email": user["email"],
                     "full_name": user.get("full_name"), "monthly_budget": user.get("monthly_budget", 0),
                     "currency": user.get("currency", "USD"), "created_at": user["created_at"]}}

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return {"id": current_user["id"], "username": current_user["username"], "email": current_user["email"],
            "full_name": current_user.get("full_name"), "monthly_budget": current_user.get("monthly_budget", 0),
            "currency": current_user.get("currency", "USD"), "created_at": current_user["created_at"]}
