from typing import Any


def success_response(data: Any, message: str | None = None) -> dict[str, Any]:
    payload: dict[str, Any] = {"success": True, "data": data}
    if message:
        payload["message"] = message
    return payload


def paginated_response(
    data: list[Any], total: int, page: int, limit: int, message: str | None = None
) -> dict[str, Any]:
    pages = (total + limit - 1) // limit if total > 0 else 1
    payload: dict[str, Any] = {
        "success": True,
        "data": data,
        "pagination": {"total": total, "page": page, "limit": limit, "pages": pages},
    }
    if message:
        payload["message"] = message
    return payload


def error_response(error: str, detail: Any = None) -> dict[str, Any]:
    payload: dict[str, Any] = {"success": False, "error": error}
    if detail is not None:
        payload["detail"] = detail
    return payload

