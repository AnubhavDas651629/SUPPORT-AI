class ConversationNotFoundException(Exception):
    def __init__(self):
        super().__init__("Conversation not found.")
