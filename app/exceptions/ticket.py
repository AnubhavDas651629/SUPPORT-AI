class TicketNotFoundException(Exception):
    def __init__(self):
        super().__init__("Ticket not found.")


class TicketAlreadyExistsException(Exception):
    def __init__(self):
        super().__init__("Ticket already exists.")
