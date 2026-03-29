import asyncio
from app.database import connect_to_mongo, get_database
from app.utils.security import hash_password
from datetime import datetime, timedelta
import random

async def seed():
    await connect_to_mongo()
    db = get_database()
    await db.users.delete_many({"username": "demo"})
    user = await db.users.insert_one({"username": "demo", "email": "demo@finance.ai",
        "hashed_password": hash_password("Demo123!"), "full_name": "Demo User",
        "monthly_budget": 5000, "currency": "USD", "is_active": True,
        "created_at": datetime.utcnow(), "updated_at": datetime.utcnow()})
    uid = str(user.inserted_id)
    cats = {"expense": [("food", ["Starbucks Coffee", "McDonalds", "Walmart Grocery", "Pizza Hut"]),
                        ("transport", ["Uber ride", "Gas station", "Bus pass"]),
                        ("entertainment", ["Netflix", "Spotify", "Movie tickets"]),
                        ("bills", ["Electric bill", "Internet bill", "Phone bill"]),
                        ("rent", ["Monthly rent"]),
                        ("shopping", ["Amazon order", "Target purchase"]),
                        ("health", ["Gym membership", "Pharmacy"])],
            "income": [("salary", ["Monthly Salary"]), ("freelance", ["Freelance project"])]}
    txs = []
    for i in range(90):
        d = datetime.utcnow() - timedelta(days=random.randint(0, 180))
        t = random.choice(["expense"] * 8 + ["income"] * 2)
        c, descs = random.choice(cats[t])
        desc = random.choice(descs)
        amt = round(random.uniform(2000, 6000), 2) if t == "income" else round(random.uniform(1000, 2000), 2) if c == "rent" else round(random.uniform(5, 200), 2)
        txs.append({"user_id": uid, "amount": amt, "description": desc, "transaction_type": t,
                     "category": c, "ai_category": c, "ai_confidence": round(random.uniform(0.7, 0.99), 2),
                     "date": d, "tags": [c], "notes": "", "created_at": d})
    await db.transactions.delete_many({"user_id": uid})
    await db.transactions.insert_many(txs)
    print(f"Seeded {len(txs)} transactions for demo user")
    print("Login: demo / Demo123!")

asyncio.run(seed())
