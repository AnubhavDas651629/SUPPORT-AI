class UserAlreadyExistsException(Exception):
    def __init__(self):
        super().__init__("User with this email already exists.")


class InvalidCredentialsException(Exception):
    def __init__(self):
        super().__init__("Invalid email or password.")

class PermissionDeniedException(Exception):
    def __init__(self):
        super().__init__("You do not have permission to perform this action.")

class UserNotFoundException(Exception):
    def __init__(self):
        super().__init__("User not found.")

class AlreadyOrganizationMemberException(Exception):
    def __init__(self):
        super().__init__("User is already a member of this organization.")


class ForbiddenException(Exception):
    def __init__(self):
        super().__init__("You do not have permission to access this resource.")


class InvalidOTPException(Exception):
    def __init__(self):
        super().__init__("Invalid or expired OTP.")

class RateLimitExceededException(Exception):
    def __init__(self, *, retry_after: int, limit: int):
        self.retry_after = retry_after
        self.limit = limit
        super().__init__(f"Rate limit exceeded. Try again in {retry_after} seconds")