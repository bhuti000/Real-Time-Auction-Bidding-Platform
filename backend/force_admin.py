import asyncio
from app.database import init_db
from app.models import User
from app.services.auth_service import hash_password

async def fix_admin_issue():
    await init_db()
    
    # Ensure admin.one exists and is admin
    email = "admin.one@example.com"
    user = await User.find_one(User.email == email)
    
    if user:
        user.is_admin = True
        await user.save()
        print(f"Updated existing user {email} to Admin.")
    else:
        # Create it if it doesn't exist
        new_user = User(
            email=email,
            hashed_password=hash_password("password123"),
            full_name="System Admin",
            is_admin=True
        )
        await new_user.insert()
        print(f"Created new Admin user: {email}")

    # Double check
    admins = await User.find(User.is_admin == True).to_list()
    print("Final Admin List:", [a.email for a in admins])

if __name__ == "__main__":
    asyncio.run(fix_admin_issue())
