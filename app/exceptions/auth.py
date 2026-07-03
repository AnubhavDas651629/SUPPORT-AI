class UserAlreadyExistsException(Exception):
    def __init__(self):
        super().__init__("User with this email already exists.")


class InvalidCredentialsException(Exception):
    def __init__(self):
        super().__init__("Invalid email or password.")