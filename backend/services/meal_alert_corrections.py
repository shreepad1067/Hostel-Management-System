from models.parent_alert import ParentAlert


def cancel_missed_meal_alerts(db, meal_date, meal_type, student_id=None):
    """Cancel unsent alerts inside the caller's transaction."""
    query = db.query(ParentAlert).filter(
        ParentAlert.alert_type == "MissedMeal",
        ParentAlert.reference_key == f"{meal_date.isoformat()}:{meal_type}",
        ParentAlert.status.in_(("Pending", "Failed")),
    )
    if student_id is not None:
        query = query.filter(ParentAlert.student_id == student_id)

    return query.update(
        {ParentAlert.status: "Cancelled"},
        synchronize_session="fetch",
    )
