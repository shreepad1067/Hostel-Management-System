from fastapi import FastAPI

from fastapi.middleware.cors import (
    CORSMiddleware,
)

from middleware.audit_middleware import (
    AuditMiddleware,
)

from routers import (
    student,
    room,
    allocation,
    fee,
    attendance,
    complaint,
    leave,
    visitor,
    notice,
    auth,
    meal_confirmation,
    food_menu,
    sos_alert,
    ai,
    account_management,
    food_feedback,
    website_feedback,
    hostel_profile,
    notification,

    # Feature 4
    room_transfer,

    # Feature 5
    maintenance,

    # Feature 7
    fee_receipt,

    # Feature 10
    audit_log,

)


app = FastAPI(
    title=
        "Hostel Management System API"
)


# ============================================
# CORS
# ============================================

app.add_middleware(
    CORSMiddleware,

    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],

    allow_credentials=True,

    allow_methods=["*"],

    allow_headers=["*"],
)


# ============================================
# FEATURE 10 — AUDIT LOGGING
# ============================================

app.add_middleware(
    AuditMiddleware
)


# ============================================
# EXISTING ROUTERS
# ============================================

app.include_router(
    student.router
)

app.include_router(
    room.router
)

app.include_router(
    allocation.router
)

app.include_router(
    fee.router
)

app.include_router(
    attendance.router
)

app.include_router(
    complaint.router
)

app.include_router(
    leave.router
)

app.include_router(
    visitor.router
)

app.include_router(
    notice.router
)

app.include_router(
    auth.router
)

app.include_router(
    meal_confirmation.router
)

app.include_router(
    food_menu.router
)

app.include_router(
    sos_alert.router
)

app.include_router(
    ai.router
)

app.include_router(
    account_management.router
)

app.include_router(
    food_feedback.router
)

app.include_router(
    website_feedback.router
)

app.include_router(
    hostel_profile.router
)

app.include_router(
    notification.router
)


# ============================================
# FEATURE 4 — ROOM TRANSFER
# ============================================

app.include_router(
    room_transfer.router
)


# ============================================
# FEATURE 5 — MAINTENANCE
# ============================================

app.include_router(
    maintenance.router
)


# ============================================
# FEATURE 7 — DIGITAL FEE RECEIPTS
# ============================================

app.include_router(
    fee_receipt.router
)




# ============================================
# FEATURE 10 — AUDIT LOG
# ============================================

app.include_router(
    audit_log.router
)


# ============================================
# ROOT
# ============================================

@app.get("/")
def home():
    return {
        "message":
            "Hostel Management System API is running"
    }


# ============================================
# HEALTH
# ============================================

@app.get("/health")
def health():
    return {
        "status":
            "OK"
    }