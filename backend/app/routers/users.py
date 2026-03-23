from fastapi import APIRouter

router = APIRouter(prefix="/users", tags=["users"])

@router.get("/")
async def get_users():
    return [{"id": 1, "name": "Alice"}, {"id": 2, "name": "Bob"}]