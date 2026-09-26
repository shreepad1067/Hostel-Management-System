from typing import Optional

from pydantic import (
    BaseModel,
    ConfigDict,
)


# Used only by the disabled
# public registration endpoint.
class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    role: str = "Student"


class UserLogin(BaseModel):
    username: str
    password: str


class ForgotPasswordRequest(
    BaseModel
):
    identifier: str


class VerifyOTPRequest(
    BaseModel
):
    identifier: str
    otp: str


class ResetPasswordRequest(
    BaseModel
):
    identifier: str
    otp: str
    new_password: str


class UserResponse(BaseModel):
    id: int
    username: str
    email: str

    phone_number: (
        Optional[str]
    ) = None

    full_name: (
        Optional[str]
    ) = None

    role: str
    is_active: bool

    model_config = ConfigDict(
        from_attributes=True
    )


class TokenResponse(BaseModel):
    access_token: str
    token_type: str