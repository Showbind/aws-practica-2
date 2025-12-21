from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from .schemas import *
from .service import *
from common.database import get_db
from auth.service import require_token
from typing import Optional

router = APIRouter(
    tags=["sensors"]
)


@router.post("/sensors/data")
def store_sensor_readings(item: SensorsPayload, db: Session = Depends(get_db), auth = Depends(require_token)):
    return save_sensors_data(item, db)

@router.get("/sensors/{sensor_id}/")
def obtain_sensor_data(sensor_id: str, start_time: datetime = None, db: Session = Depends(get_db), auth = Depends(require_token)):

    return get_sensor_data_from_timestamp(Sensor, sensor_id, start_time, db)