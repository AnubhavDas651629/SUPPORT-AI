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