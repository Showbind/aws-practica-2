from sqlalchemy import select
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError, IntegrityError

def add_one(item, db: Session):
    """
    Añade un objeto a una tabla de la base de datos y lo devuelve.

    """
    db.add(item)
    try:
        db.commit()
        db.refresh(item)
    except IntegrityError:
        db.rollback()
    except SQLAlchemyError:
        db.rollback()
        raise

    return item

def add_many(items, db: Session):
    """
    Añade varios objetos a una tabla de la base de datos.

    """
    db.add_all(items)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise RuntimeError("Primary Key ya existe")
    except SQLAlchemyError:
        db.rollback()
        raise 

    return items

def get_one(model, column, value, db:Session):
    """
    Devuelve los datos de una fila con clave coincidente
    """
    
    query = select(model).where(column == value)
    return db.execute(query).scalar_one_or_none()


