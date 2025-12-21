from pydantic import BaseModel
from datetime import datetime
from typing import Dict

class SensorsPayload(BaseModel):
    timestamp: datetime | None
    data: Dict[str, float]

class SensorTimestamp(BaseModel):
    sensor_id: str
    timestamp: datetime