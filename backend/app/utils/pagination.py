from math import ceil


def get_pagination_params(page: int = 1, limit: int = 10) -> tuple[int, int]:
    safe_page = page if page > 0 else 1
    safe_limit = min(max(limit, 1), 100)
    skip = (safe_page - 1) * safe_limit
    return skip, safe_limit


def get_pagination_meta(total: int, page: int, limit: int) -> dict:
    pages = ceil(total / limit) if total > 0 else 1
    return {"total": total, "page": page, "limit": limit, "pages": pages}

