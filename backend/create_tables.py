from database import Base, engine

from models.student import Student
from models.room import Room
from models.allocation import RoomAllocation
from models.fee import Fee
from models.attendance import Attendance
from models.complaint import Complaint
from models.leave import Leave
from models.visitor import Visitor
from models.notice import Notice
from models.user import User


Base.metadata.create_all(bind=engine)

print("Tables created successfully!")