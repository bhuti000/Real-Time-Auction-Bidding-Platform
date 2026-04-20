import asyncio
from datetime import datetime, timedelta

from beanie import PydanticObjectId

from app.database import init_db
from app.models import Auction, AuctionStatus, Bid, Collection, CollectionStatus, User
from app.services.auth_service import hash_password


async def seed() -> None:
    await init_db()

    await User.find_all().delete()
    await Auction.find_all().delete()
    await Bid.find_all().delete()
    await Collection.find_all().delete()

    users = [
        User(
            email="admin.one@example.com",
            hashed_password=hash_password("password123"),
            full_name="Admin One",
            is_admin=True,
        ),
        User(
            email="admin.two@example.com",
            hashed_password=hash_password("password123"),
            full_name="Admin Two",
            is_admin=True,
        ),
        User(
            email="user.one@example.com",
            hashed_password=hash_password("password123"),
            full_name="User One",
        ),
        User(
            email="user.two@example.com",
            hashed_password=hash_password("password123"),
            full_name="User Two",
        ),
        User(
            email="user.three@example.com",
            hashed_password=hash_password("password123"),
            full_name="User Three",
        ),
    ]
    for user in users:
        await user.insert()

    now = datetime.utcnow()
    statuses = [
        AuctionStatus.LIVE,
        AuctionStatus.LIVE,
        AuctionStatus.SCHEDULED,
        AuctionStatus.SCHEDULED,
        AuctionStatus.COMPLETED,
    ]

    category_details = {
        "Photography": {
            "title": "1954 Leica M3 Double Stroke",
            "desc": "Pristine condition, original leather case included. Verified authentic museum quality.",
            "img": "https://lh3.googleusercontent.com/aida-public/AB6AXuB4q3UDqgidD4bbxO-_65IqUDVN0Mq2URnt9UICcgZHW13XP-GniPEkzoYenZFLNwhLPh_AfMf4XxsVGC4sndPUgxPOjyWhlS3aX4hvyYax7-W3SnmV3ojnXqBUlSIm2T8mhZUCwUCq7jcAV6dMavABwMrQDU0UL0XTEB0kuujIycjP0yhuf68YUKyojkGET9XvknLzmJgYbX0zNqZnvi-dFzr2XnXJzC4t9C8pJsdfoJoprCwbIUn55UqqbaIfaTozq8zPT8PMqgc",
        },
        "Horology": {
            "title": "Vintage Heuer Chronograph",
            "desc": "Classic 1960s manual wind. Pristine dial and original crown. Recently serviced.",
            "img": "https://lh3.googleusercontent.com/aida-public/AB6AXuAn0PxICONvMQNceCfE7I-35OUvPClpq7uvxLvGAP6zfNohZqiIWZkFxFn6RbEmuByhdwAo9vVZDj4oqxgbaTh7pQTHAAwE8y856w5R5v4AgkhYnvqqLjf8lo1LMfAxk1DNDA1kaRNIfARAHDBxdpB2qVeJiTpoLsJIZe-3WbeN2G2oai7d6pYyc203LFNmuIP2wzLI25xBnKGoz720mgR-0stA5nVUrTJKNXSel2xV8bhan8itUwD5WX3q0qSUr-BiYXjxt4y2EXA",
        },
        "Contemporary Art": {
            "title": "First Edition Novel Collection",
            "desc": "Rare first editions from the late 20th century. Exceptional condition with dust jackets.",
            "img": "https://lh3.googleusercontent.com/aida-public/AB6AXuAf7ZOa9vj2ChJJQfIVO91JQs8U_MociWSUhwLWq4Fi6PhQE615Zo2c0028JZk2idptz8ldZ4x9NBP9fm3xtbXDoVLQZDw1IBKh9lCcSe_YW5FYS36Xy-5OmNhQrctdS6DF8XiccLLnLQKitUh84Cx26f_cUrMgUcRFNrQc2-XBEYpOZ-KEiaCea6X7sP1tb7e7ZsPK_C1BisKjDPOIQ3qjsUNbHduQQanWW59yhEHZyCnmH2wlWcQa3B2cEgKB8ZKye36KNXkYyEc",
        },
        "Vehicles": {
            "title": "1967 Porsche 911 S",
            "desc": "Fully restored in Irish Green. Matching numbers and original interior.",
            "img": "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=1000",
        },
        "Fine Art": {
            "title": "The Golden Hour",
            "desc": "Oil on canvas, 19th century. Exquisite detail and provenance.",
            "img": "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&q=80&w=1000",
        },
    }

    auctions: list[Auction] = []
    for idx, (cat, details) in enumerate(category_details.items()):
        start_offset = -2 if statuses[idx] != AuctionStatus.SCHEDULED else 2
        end_offset = 12 if statuses[idx] != AuctionStatus.COMPLETED else -1
        
        auction = Auction(
            title=details["title"],
            description=details["desc"],
            category=cat,
            images=[details["img"]],
            starting_price=4500 + idx * 2500,
            current_bid=5000 + idx * 2500,
            seller_id=PydanticObjectId(str(users[0].id)),
            start_time=now + timedelta(hours=start_offset),
            end_time=now + timedelta(hours=end_offset),
            status=statuses[idx],
            is_featured=idx < 3, # Feature more items
            min_increment=50,
            bid_count=0,
        )
        await auction.insert()
        auctions.append(auction)

    live_auctions = auctions[:2]
    bidder_pool = users[2:]
    # Seed bids with descending timestamps
    for index in range(10):
        auction = live_auctions[index % len(live_auctions)]
        bidder = bidder_pool[index % len(bidder_pool)]
        amount = auction.current_bid + 500 + index * 100
        
        # Staggered timestamps: each bid is 10 minutes older than the previous one in the loop
        bid_time = datetime.utcnow() - timedelta(minutes=10 * (10 - index))
        
        bid = Bid(
            auction_id=auction.id, 
            user_id=bidder.id, 
            amount=amount,
            placed_at=bid_time
        )
        await bid.insert()
        
        auction.current_bid = amount
        auction.highest_bidder_id = bidder.id
        auction.bid_count += 1
        await auction.save()

    collection_one = Collection(
        title="The Private Evening Sale",
        subtitle="POST-WAR & CONTEMPORARY",
        description="A private collection accepting applications.",
        cover_image="https://example.com/collection-private.jpg",
        total_lots=2,
        est_value_low=150000,
        est_value_high=250000,
        status=CollectionStatus.ACCEPTING,
        auction_ids=[auctions[0].id, auctions[1].id],
        is_private=True,
    )
    collection_two = Collection(
        title="Weekend Preview",
        subtitle="HIGHLIGHTS",
        description="A preview open collection for curated bidders.",
        cover_image="https://example.com/collection-preview.jpg",
        total_lots=3,
        est_value_low=300000,
        est_value_high=500000,
        status=CollectionStatus.PREVIEW_OPEN,
        auction_ids=[auctions[2].id, auctions[3].id, auctions[4].id],
        is_private=False,
    )
    await collection_one.insert()
    await collection_two.insert()

    print("Seed completed successfully.")


if __name__ == "__main__":
    asyncio.run(seed())
