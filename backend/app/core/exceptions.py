from fastapi import HTTPException, status


class APIException(HTTPException):
    def __init__(
        self,
        status_code: int = status.HTTP_400_BAD_REQUEST,
        error: str = "Request failed",
        detail: str | None = None,
    ) -> None:
        payload = {"success": False, "error": error}
        if detail:
            payload["detail"] = detail
        super().__init__(status_code=status_code, detail=payload)

