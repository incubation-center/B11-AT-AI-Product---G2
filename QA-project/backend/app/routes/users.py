from fastapi import APIRouter

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/")
async def get_users():
    """Get all users."""
    return {"message": "Users endpoint - to be implemented"}


@router.post("/")
async def create_user():
    """Create a new user."""
    return {"message": "Create user - to be implemented"}
