from typing import Annotated
from pydantic import BaseModel, EmailStr, Field
from fastapi import Depends, FastAPI, HTTPException, Query
from sqlmodel import Field, Session, SQLModel, create_engine, select

# Pydantic model para pedir datos de registro
class UserCreate(BaseModel):
    email: EmailStr
    name: str = Field(..., min_length=4)
    password: str = Field(..., min_length=6)

# Pydantic model para pedir datos de logeo al usuario
class UserLogin(BaseModel):
    email: str
    password: str

# Pydantic model para devolver al usuario cuando se logea
class UserLoginResponse(BaseModel):
    name: str
    access_token: str


