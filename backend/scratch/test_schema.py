from datetime import datetime
from pydantic import ValidationError
from app.schemas.auction import AuctionCreate

payload = {
    "title": "Test Auction",
    "description": "Lot for Test Auction",
    "category": "Fine Art",
    "images": [],
    "starting_price": 1000.0,
    "current_bid": 1000.0,
    "start_time": datetime.utcnow().isoformat(),
    "end_time": datetime.utcnow().isoformat(),
    "status": "SCHEDULED",
    "min_increment": 500.0
}

try:
    AuctionCreate(**payload)
    print("Validation successful")
except ValidationError as e:
    print(e.json())
