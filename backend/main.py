from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

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
    auth
)


app = FastAPI(
    title="Hostel Management System API"
)


# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Register routers
app.include_router(student.router)
app.include_router(room.router)
app.include_router(allocation.router)
app.include_router(fee.router)
app.include_router(attendance.router)
app.include_router(complaint.router)
app.include_router(leave.router)
app.include_router(visitor.router)
app.include_router(notice.router)
app.include_router(auth.router)


@app.get("/")
def home():
    return {
        "message": "Hostel Management System API is running"
    }


@app.get("/health")
def health():
    return {
        "status": "OK"
    }