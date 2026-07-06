class DocumentNotFoundException(Exception):
    def __init__(self):
        super().__init__("Document not found.")


class DocumentAlreadyExistsException(Exception):
    def __init__(self):
        super().__init__("Document already exists.")
