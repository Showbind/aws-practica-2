from typing import Union
from dotenv import load_dotenv
from fastapi import FastAPI, Depends
from pydantic import BaseModel
from users.routers import router as users_router
from auth.service import require_token
from auth.routers import router as auth_router
from sensors.routers import router as sensors_router
from fastapi.middleware.cors import CORSMiddleware

# Iniciar API
app = FastAPI(root_path="/api") 

# CORS
origins = [
    "http://localhost:5500",
    "http://127.0.0.1:5500"
    "http://127.0.0.1:8080"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(users_router)
app.include_router(auth_router)
app.include_router(sensors_router)

# Schema
class Item(BaseModel):
    name: str
    price: float
    is_offer: Union[bool, None] = None

# Routers Ejemplo
@app.get("/")
def read_root(current_user = Depends(require_token)): # Probando el uso de JWT
    return {"Hello": "World"}

iot_last_message = "No se ha recibido ningun mensaje"

@app.post("/iot/")
def read_sensor_data(current_user = Depends(require_token), item: dict = None):
    global iot_last_message 
    iot_last_message = item
    return {"message": iot_last_message}

@app.get("/iot/")
def send_sensor_data(current_user = Depends(require_token)):
    global iot_last_message 
    return {"message": iot_last_message}

@app.get("/health")
def health_check():
    return {"status": "ok"}