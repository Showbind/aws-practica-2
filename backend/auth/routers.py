from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from common.database import get_db
from .service import verify_password, create_access_token
from common.schemas import UserLoginResponse, UserLogin
from .service import authenticate_user


router = APIRouter(
    tags=["Auth"]
)


@router.post("/auth/login", response_model=UserLoginResponse)
async def log_user(item: UserLogin, db: Session = Depends(get_db)):
    return authenticate_user(item, db)