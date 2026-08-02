#Reusable generic response container for all paginated endpoints ex -> tickets, conversations, messages

from typing import Generic, TypeVar
from pydantic import BaseModel

T = TypeVar("T")

class CursorPageResponse(BaseModel, Generic[T]):
    items: list[T] # actual list of data objects returned for the current page
    next_cursor: str | None = None # base64 cursor token generated, if we reach the end of the database, next_cursor becomes None
    has_more: bool = False # tells frontedn whether to show or disable the "Load more" button