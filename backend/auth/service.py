from fastapi import Depends, HTTPException, status, Depends
from fastapi.security import HTTPBasic, HTTPBasicCredentials, OAuth2PasswordBearer, HTTPBearer
from datetime import datetime, timedelta, timezone
from typing import Union, Any, Annotated
from pwdlib import PasswordHash
from sqlalchemy.orm import Session
import secrets
import jwt
import os
from common.repositories import get_one
from common.models import User
from common.schemas import UserLogin
from dotenv import load_dotenv, find_dotenv
from common.database import get_db

# Algoritmo del Hash
password_hash = PasswordHash.recommended()

# Cargar variables .env
load_dotenv(find_dotenv())

# CONSTANTS
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM")
ACCESS_TOKEN_EXPIRE_MINUTES = os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES")

def hash_password(password: str) -> str:
    return password_hash.hash(password)

def verify_password(password: str, hashed_password: str) -> bool:
    return password_hash.verify(password, hashed_password)

def create_access_token(subject: str, expires_delta: int = None) -> str:
    """
    Crear JWT 
    
    :param subject: Identificador del usuario (email)
    :type subject: str
    :param expires_delta: Tiempo en minutos de duración del token
    :type expires_delta: Optional[int]
    :return encoded_jwt: Token con el id del usuario y el datetime de expiracion
    :rtype: str
    """
    dt_now = datetime.now(timezone.utc)
    
    if expires_delta is not None:
        expire = dt_now + timedelta(minutes=expires_delta)
    else:
        expire = dt_now + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode = {"exp": int(expire.timestamp()), "sub": subject}
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET_KEY, JWT_ALGORITHM)

    return encoded_jwt

# Bearer JWT
bearer_scheme  = HTTPBearer()

def require_token(auth_credentials: str = Depends(bearer_scheme), db: Session = Depends(get_db)):
    """
    Extrae el bearer del header para verificar si puede ejecutarse un endpoint. 
    """
    
    credentials_exception = HTTPException(
        status_code = 401, 
        detail = "Invalid credentials", 
        headers = {"WWW-Authenticate": "Bearer"},
    )

    # Extraer solo el token
    token = auth_credentials.credentials

    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        username = payload.get("sub")
        
    except jwt.ExpiredSignatureError:
        raise credentials_exception
    except jwt.InvalidTokenError:
        raise credentials_exception
    
    user = get_one(User, User.email, username, db)

    if not user:
        raise credentials_exception

    

def authenticate_user(user_credentials: UserLogin, db: Session = Depends(get_db)):
    """
    Verifica que el usuario existe y devuelve un token.
    """
    login_error = HTTPException(
        status_code=401,
        detail="El Usuario o contraseña son incorrectos."
    )
    
    email = user_credentials.email
    password = user_credentials.password

    # Obtener usuario de la DB
    user_data = get_one(User, User.email, email, db)

    # Si el usuario no existe en la DB
    if not user_data:
        raise login_error

    hashed_password = user_data.password

    # Si las contraseñas no coinciden
    if not verify_password(password, hashed_password):
        raise login_error
    
    token = create_access_token(email, expires_delta=30)

    return {
        "name": user_data.name,
        "access_token": token
    }