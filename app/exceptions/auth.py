class UserAlreadyExistsException(Exception):
    def __init__(self):
        super().__init__("User with this email alredy exists")

    