"""Isolated regression tests: never import the production database or load .env.
Run: backend/venv/bin/python -m unittest discover -s backend/tests -v
"""
import os
from pathlib import Path
import sys
import types
import unittest

from fastapi import HTTPException
from pydantic import ValidationError
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
class Base(DeclarativeBase):
    pass

database = types.ModuleType("database")
database.Base = Base
database.get_db = lambda: None
sys.modules["database"] = database
dotenv = types.ModuleType("dotenv")
dotenv.load_dotenv = lambda: None
sys.modules["dotenv"] = dotenv
os.environ["SECRET_KEY"] = "isolated-test-key-not-a-production-secret"

from models.user import User
from models.student import Student
from models.room import Room
from models.allocation import RoomAllocation
from routers.allocation import create_allocation, delete_allocation
from routers.room import create_room, update_room, delete_room, get_available_rooms_by_capacity
from routers.student import get_student_by_code, update_student
from routers.auth import create_student_account, register_user
from schemas.room import RoomCreate, RoomUpdate
from schemas.allocation import AllocationCreate
from schemas.student import StudentUpdate
from schemas.user import StudentAccountCreate
from dependencies import require_roles


class CounsellingTests(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine("sqlite://")
        Base.metadata.create_all(self.engine)
        self.db = Session(self.engine)
        self.warden = User(username="warden", email="warden@example.test", role="Warden", hashed_password="unused")
        self.student = Student(name="Student", student_code="HMS202600001", email="student@example.test", phone="1000000000", course="Engineering", year=1, admission_status="Admitted")
        self.room = Room(room_number="A101", capacity=2, occupied=0, floor=1, status="Available", specifications="Desk and Wi-Fi", monthly_fee=2500, block="A", bathroom_type="Attached", room_type="Non-AC")
        self.db.add_all([self.warden, self.student, self.room])
        self.db.commit()

    def tearDown(self):
        self.db.close()
        self.engine.dispose()

    def allocate(self):
        return create_allocation(AllocationCreate(student_id=self.student.id, room_id=self.room.id), self.db, self.warden)

    def test_round_trip_and_repeated_deallocation(self):
        allocation = self.allocate()
        self.assertEqual(self.room.occupied, 1)
        self.assertEqual(self.student.room_number, "A101")
        self.assertIsNotNone(allocation.allocation_date)
        delete_allocation(allocation.id, self.db, self.warden)
        self.assertEqual(self.room.occupied, 0)
        self.assertIsNone(self.student.room_number)
        with self.assertRaises(HTTPException):
            delete_allocation(allocation.id, self.db, self.warden)
        self.assertEqual(self.room.occupied, 0)

    def test_duplicate_allocation_rejected(self):
        self.allocate()
        with self.assertRaises(HTTPException): self.allocate()
        self.assertEqual(self.room.occupied, 1)
        self.assertEqual(self.db.query(RoomAllocation).count(), 1)

    def test_maintenance_rejected(self):
        self.room.status = "Maintenance"
        self.db.commit()
        with self.assertRaises(HTTPException): self.allocate()
        self.assertEqual(self.room.occupied, 0)

    def test_full_room_rejected(self):
        self.room.occupied = self.room.capacity
        self.db.commit()
        with self.assertRaises(HTTPException): self.allocate()

    def test_pending_admission_rejected(self):
        self.student.admission_status = "Pending"
        self.db.commit()
        with self.assertRaises(HTTPException): self.allocate()

    def test_deallocation_preserves_maintenance(self):
        allocation = self.allocate()
        self.room.status = "Maintenance"
        self.db.commit()
        delete_allocation(allocation.id, self.db, self.warden)
        self.assertEqual(self.room.status, "Maintenance")

    def test_last_bed_changes_status(self):
        self.room.capacity = 1
        self.db.commit()
        self.allocate()
        self.assertEqual(self.room.status, "Occupied")
        self.assertEqual(get_available_rooms_by_capacity(1, self.db, self.warden), [])

    def test_availability_all_sharing_types(self):
        for capacity in range(1, 5):
            self.db.add(Room(room_number=f"B{capacity}", capacity=capacity, occupied=0, floor=0, status="Available"))
        self.db.add(Room(room_number="M1", capacity=1, occupied=0, floor=0, status="Maintenance"))
        self.db.commit()
        for capacity in range(1, 5):
            rooms = get_available_rooms_by_capacity(capacity, self.db, self.warden)
            self.assertTrue(rooms)
            self.assertTrue(all(r.capacity == capacity and r.status == "Available" for r in rooms))

    def test_lookup_normalizes_code(self):
        self.assertEqual(get_student_by_code(" hms202600001 ", self.db, self.warden).id, self.student.id)
        with self.assertRaises(HTTPException): get_student_by_code("missing", self.db, self.warden)

    def test_legacy_update_preserves_specifications(self):
        payload = RoomUpdate(room_number="A101", capacity=2, occupied=0, floor=2, status="Available")
        result = update_room(self.room.id, payload, self.db, self.warden)
        self.assertEqual(result.specifications, "Desk and Wi-Fi")
        self.assertEqual(result.monthly_fee, 2500)
        self.assertEqual(result.block, "A")

    def test_explicit_specification_clear(self):
        payload = RoomUpdate(room_number="A101", capacity=2, occupied=0, floor=1, status="Available", specifications=None)
        self.assertIsNone(update_room(self.room.id, payload, self.db, self.warden).specifications)

    def test_stale_occupancy_update_rejected(self):
        self.allocate()
        with self.assertRaises(HTTPException):
            update_room(self.room.id, RoomUpdate(room_number="A101", capacity=2, occupied=0, floor=1, status="Available"), self.db, self.warden)
        self.assertEqual(self.room.occupied, 1)

    def test_history_prevents_room_deletion(self):
        allocation = self.allocate()
        delete_allocation(allocation.id, self.db, self.warden)
        with self.assertRaises(HTTPException): delete_room(self.room.id, self.db, self.warden)

    def test_validation(self):
        for changes in ({"capacity":5}, {"capacity":0}, {"room_number":" "}, {"monthly_fee":-1}, {"monthly_fee":"1.234"}, {"status":"Invalid"}):
            with self.assertRaises(ValidationError):
                RoomCreate(**({"room_number":"Test", "capacity":2, "floor":0} | changes))
        with self.assertRaises(ValidationError):
            AllocationCreate(student_id=1, room_id=1, status="Inactive")

    def test_new_room_must_be_empty(self):
        with self.assertRaises(HTTPException):
            create_room(RoomCreate(room_number="B1", capacity=2, occupied=1, floor=0), self.db, self.warden)

    def test_student_cannot_use_staff_routes_and_warden_cannot_create_accounts(self):
        with self.assertRaises(HTTPException): require_roles("Admin", "Warden")(User(role="Student"))
        with self.assertRaises(HTTPException): require_roles("Admin")(self.warden)
        with self.assertRaises(HTTPException): register_user(None)

    def test_one_login_per_admitted_student(self):
        account = StudentAccountCreate(student_code=self.student.student_code, username="student", password="test-password-only")
        user = create_student_account(account, self.db, User(role="Admin"))
        self.assertEqual(user.id, self.student.user_id)
        with self.assertRaises(HTTPException): create_student_account(account, self.db, User(role="Admin"))
        self.assertEqual(self.db.query(User).filter(User.role == "Student").count(), 1)

    def test_no_login_for_pending_student(self):
        self.student.admission_status = "Pending"
        self.db.commit()
        with self.assertRaises(HTTPException):
            create_student_account(StudentAccountCreate(student_code=self.student.student_code, username="pending", password="test-password-only"), self.db, User(role="Admin"))

    def test_student_update_cannot_unlink_login(self):
        self.student.user_id = self.warden.id
        self.db.commit()
        with self.assertRaises(HTTPException):
            update_student(self.student.id, StudentUpdate(name=self.student.name, email=self.student.email, phone=self.student.phone, course=self.student.course, year=1, admission_status="Admitted"), self.db, self.warden)


if __name__ == "__main__":
    unittest.main()
