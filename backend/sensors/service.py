from .schemas import SensorsPayload
from common.database import get_db
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from common.models import Sensor
from common.repositories import add_many


def save_sensors_data(item:SensorsPayload, db: Session):
    sensors = item.data
    timestamp = item.timestamp

    rows = []
    for key, val in sensors.items():
        sensor_data = Sensor(
            sensor_id = key,
            timestamp = timestamp,
            value = val
        )
        rows.append(sensor_data)

    return add_many(rows, db)
    
     # Llamar funcion BD guardar en tabla


def get_sensor_data_from_timestamp(model, sensor_id, timestamp, db:Session):
    """
    Devuelve los datos de varias filas con clave coincidente
    """
    if timestamp:
        data = db.query(model)\
             .filter(model.sensor_id == sensor_id)\
             .filter(model.timestamp >= timestamp)\
             .order_by(model.timestamp.asc())\
             .all()
    else:
        data = db.query(model)\
                .filter(model.sensor_id == sensor_id)\
                .order_by(model.timestamp.asc())\
                .all()
        
    return data