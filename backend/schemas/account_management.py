from pydantic import BaseModel


class StudentProvisionRequest(BaseModel):
    student_code: str
    username: str | None = None


class WardenProvisionRequest(BaseModel):
    full_name: str
    email: str
    phone_number: str
    username: str | None = None


class AccountProvisionResponse(BaseModel):
    message: str
    username: str
    email: str
    role: str
    credentials_sent: bool


class AccountUserSummary(BaseModel):
    id: int
    username: str
    email: str
    phone_number: str | None = None
    full_name: str | None = None
    role: str
    is_active: bool


class StudentAccountStatus(BaseModel):
    student_id: int
    student_code: str | None = None
    name: str
    email: str
    phone: str
    course: str | None = None
    year: int | None = None
    admission_status: str

    account_id: int | None = None
    username: str | None = None
    has_account: bool


class AccountOverviewResponse(BaseModel):
    admitted_students: int
    linked_student_accounts: int
    pending_student_accounts: int
    total_wardens: int

    students: list[
        StudentAccountStatus
    ]

    wardens: list[
        AccountUserSummary
    ]