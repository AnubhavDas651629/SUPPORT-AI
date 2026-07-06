class OrganizationNotFoundException(Exception):
    def __init__(self):
        super().__init__("Organization not found.")


class OrganizationAlreadyExistsException(Exception):
    def __init__(self):
        super().__init__("Organization already exists.")


class MemberNotFoundException(Exception):
    def __init__(self):
        super().__init__("Organization member not found.")


class KnowledgeBaseNotFoundException(Exception):
    def __init__(self):
        super().__init__("Knowledge base not found.")


class KnowledgeBaseAlreadyExistsException(Exception):
    def __init__(self):
        super().__init__("Knowledge base already exists.")