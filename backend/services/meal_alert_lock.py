from contextlib import contextmanager
from functools import wraps
from hashlib import sha256
from threading import Lock

from fastapi import HTTPException
from sqlalchemy import create_engine, text
from sqlalchemy.pool import NullPool

from database import engine


# Dedicated connections keep waiting operations out of the application pool.
lock_engine = create_engine(
    engine.url,
    poolclass=NullPool,
    connect_args={"connect_timeout": 10},
)
local_lock = Lock()
database_key = sha256(
    (engine.url.database or "").encode()
).hexdigest()[:32]
lock_name = f"hostelhub:meals:{database_key}"


@contextmanager
def meal_alert_lock():
    if not local_lock.acquire(timeout=10):
        raise TimeoutError("Meal processing is busy")

    try:
        with lock_engine.connect() as connection:
            acquired = connection.execute(
                text("SELECT GET_LOCK(:name, 10)"),
                {"name": lock_name},
            ).scalar()

            if acquired != 1:
                raise TimeoutError("Meal processing is busy")

            try:
                yield
            finally:
                try:
                    connection.execute(
                        text("SELECT RELEASE_LOCK(:name)"),
                        {"name": lock_name},
                    )
                finally:
                    # Ensure a session-scoped lock cannot survive in a pool.
                    connection.invalidate()
    finally:
        local_lock.release()


def coordinate_meal_operation(function):
    @wraps(function)
    def wrapped(*args, **kwargs):
        try:
            with meal_alert_lock():
                return function(*args, **kwargs)
        except TimeoutError as exc:
            raise HTTPException(
                status_code=503,
                detail="Meal processing is busy. Please try again.",
                headers={"Retry-After": "2"},
            ) from exc

    return wrapped
