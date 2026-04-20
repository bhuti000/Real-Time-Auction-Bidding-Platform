from datetime import datetime
from beanie import Document, Indexed
from pydantic import Field

class Reminder(Document):
    user_id: str
    auction_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "reminders"
        indexes = [
            [("user_id", 1), ("auction_id", 1)],  # Unique-ish constraint
        ]
