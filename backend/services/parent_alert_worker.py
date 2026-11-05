from services.meal_alert_lock import meal_alert_lock
import asyncio
import logging
from contextlib import asynccontextmanager

from database import SessionLocal
from models.parent_alert import ParentAlert
from services.missed_meal_alert_service import queue_missed_meal_alerts
from services.parent_alert_service import deliver_parent_alert


logger = logging.getLogger("uvicorn.error")
CHECK_INTERVAL_SECONDS = 30


def check_once():
    with meal_alert_lock():
        _check_once_locked()


def _check_once_locked():
    # Each check owns a separate database session and transaction.
    with SessionLocal() as db:
        try:
            results = queue_missed_meal_alerts(db, dry_run=False)
            db.commit()
            queued = sum(item["queued"] for item in results)
            if queued:
                logger.info("Queued %s missed-meal parent alerts.", queued)

            alerts = (
                db.query(ParentAlert)
                .filter(
                    ParentAlert.alert_type.in_(
                        ("AttendanceAbsent", "MissedMeal")
                    ),
                    ParentAlert.status.in_(("Pending", "Failed")),
                    ParentAlert.attempts < 5,
                )
                .order_by(ParentAlert.created_at, ParentAlert.id)
                .limit(20)
                .all()
            )

            sent = sum(
                1 for alert in alerts
                if deliver_parent_alert(db, alert)
            )
            if alerts:
                logger.info(
                    "Parent alert delivery check: %s sent; %s attempted.",
                    sent,
                    len(alerts),
                )
        except Exception:
            db.rollback()
            raise


async def run_checker(stop):
    logger.info("Parent alert checker started: queueing and delivery enabled.")
    while not stop.is_set():
        try:
            await asyncio.to_thread(check_once)
        except Exception:
            logger.exception("Parent alert check failed; retrying in 30 seconds.")

        try:
            await asyncio.wait_for(
                stop.wait(), timeout=CHECK_INTERVAL_SECONDS
            )
        except asyncio.TimeoutError:
            pass

    logger.info("Parent alert checker stopped.")


@asynccontextmanager
async def parent_alert_lifespan(app):
    stop = asyncio.Event()
    task = asyncio.create_task(run_checker(stop))
    try:
        yield
    finally:
        stop.set()
        await task
