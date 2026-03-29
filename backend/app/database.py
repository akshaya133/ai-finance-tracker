from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings

class Database:
    client: AsyncIOMotorClient = None
    db = None

database = Database()

async def connect_to_mongo():
    database.client = AsyncIOMotorClient(settings.MONGODB_URL)
    database.db = database.client[settings.DATABASE_NAME]
    await database.db.users.create_index("username", unique=True)
    await database.db.users.create_index("email", unique=True)
    await database.db.transactions.create_index("user_id")
    await database.db.transactions.create_index("date")
    print("Connected to MongoDB")

async def close_mongo_connection():
    database.client.close()
    print("Disconnected from MongoDB")

def get_database():
    return database.db
