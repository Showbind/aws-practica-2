from sqlalchemy import Column, Integer, String, DateTime, Float, Index
from sqlalchemy.orm import declarative_base, relationship
import datetime

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, index=True, unique=True)
    name = Column(String, index=True)
    password = Column(String, index=True)

class Sensor(Base):
    __tablename__ = "sensors"
    
    # PK Compuesta (sensor_id, timestamp)
    sensor_id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, primary_key=True)
    value = Column(Float, nullable=False)

    __table_args__ = (
        Index("sensor_data_timestamp", "timestamp"),
    )