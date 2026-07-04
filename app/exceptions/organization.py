class OrganizationNotFoundException(Exception):
    def __init__(Self):
        super().__init__("Organization not found")

class OrganizationAlreadyExistsException(Exception):
    def __init__(self):
        super().__init__("Organization already exists.")