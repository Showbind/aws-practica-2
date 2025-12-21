from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException
from common.schemas import UserCreate
from auth.service import hash_password 
from common.models import User
from common.repositories import add_one

def create_user_service(user: UserCreate, db: Session) -> User:
    """
    Crea un nuevo usuario en la base de datos.
    """
    # Hashear la contraseña
    hashed_password = hash_password(user.password)

    # Crear instancia del modelo SQLAlchemy
    db_user = User(
        email = user.email,
        name = user.name,
        password = hashed_password
    )

    try:
        response_data = add_one(db_user, db)
    except IntegrityError:
        raise HTTPException(status_code=400, detail="El email ya existe")  
    