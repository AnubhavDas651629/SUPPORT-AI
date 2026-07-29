from pydantic import BaseModel, EmailStr


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class VerifyForgotPasswordOTPRequest(BaseModel):
    email: EmailStr
    otp: str


class VerifyOTPResponse(BaseModel):
    reset_token: str
    token_type: str = "bearer"


class ResetPasswordRequest(BaseModel):
    reset_token: str
    new_password: str


class GenericMessageResponse(BaseModel):
    message: str