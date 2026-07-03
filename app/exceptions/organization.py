class OrganizationNotFoundException(Exception):
    def __init__(Self):
        super().__init__("Organization not found")