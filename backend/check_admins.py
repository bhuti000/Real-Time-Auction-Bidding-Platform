import asyncio
from app.database import init_db
from app.models import User

async def check():
    await init_db()
    admins = await User.find(User.is_admin == True).to_list()
    print("Current Admins:", [a.email for a in admins])

if __name__ == "__main__":
    asyncio.run(check())
