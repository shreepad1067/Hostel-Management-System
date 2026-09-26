from pydantic import BaseModel


class AIQuestionRequest(BaseModel):
    question: str


class AIAnswerResponse(BaseModel):
    answer: str


class ComplaintQueueItem(BaseModel):
    id: int
    student_id: int
    title: str
    description: str
    category: str
    complaint_date: str
    status: str


class ComplaintAIResponse(BaseModel):
    complaint_id: int
    suggested_category: str
    priority: str
    summary: str
    recommended_action: str


class NoticeAIRequest(BaseModel):
    topic: str
    category: str = "General"
    audience: str = "All Students"
    tone: str = "Formal"
    key_points: str | None = None


class NoticeAIResponse(BaseModel):
    title: str
    content: str
    category: str
    remarks: str | None = None


class ProvisioningStudent(BaseModel):
    student_id: int
    student_code: str | None = None
    name: str
    course: str | None = None
    year: int | None = None


class ProvisioningSummaryResponse(BaseModel):
    admitted_students: int
    linked_accounts: int
    accounts_pending: int
    students_without_accounts: list[
        ProvisioningStudent
    ]