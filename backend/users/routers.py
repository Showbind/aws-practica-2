from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session
from common.database import get_db
from .service import create_user_service

# Models
from common.schemas import UserCreate, UserLoginResponse

router = APIRouter(
    tags=["Users"]
)

# API endpoint para crear un usuario
@router.post("/users/register")
async def create_user(item: UserCreate, db: Session = Depends(get_db)):
    create_user_service(item, db)
    
    return Response(status_code=status.HTTP_201_CREATED)