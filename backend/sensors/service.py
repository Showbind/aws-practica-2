from .schemas import SensorsPayload
from common.database import get_db
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from common.models import Sensor
from common.repositories import add_many
import json
import os

# AWS
import io
import boto3

BUCKET_NAME =os.getenv("BUCKET_NAME")
S3_PREFIX = os.getenv("S3_PREFIX")
S3_CLIENT = boto3.client("s3")

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

        data_json = {
            "sensor_id": key,
            "timestamp": timestamp.isoformat(),
            "value": val
        }

        s3_key = f"{S3_PREFIX}/{data_json["sensor_id"]}/{timestamp.isoformat()}.json"
        S3_CLIENT.upload_fileobj(
            io.BytesIO(json.dumps(data_json).encode("utf-8")),
            BUCKET_NAME,
            s3_key
        )
        
    items =  add_many(rows, db) 
    return items
    


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