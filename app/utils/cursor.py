import base64
from datetime import datetime
from uuid import UUID

"""
suppose we are viewing tickets, in page 1 we have 20 tickets after that
 to fetch tickets of page 2 frontend needs to call postgress

To do this safely without exposing raw database implementation details to the frontend, we bundle two pieces of 
information about the last ticket on Page 1 into a single opaque, URL-safe string called a Cursor:

created_at: 2026-08-02T15:30:00+00:00 (timestamp)
item_id: a1b2c3d4-e5f6-7890-abcd-1234567890ab (UUID)
Instead of passing ugly raw timestamps in the URL like: GET /tickets?last_time=2026-08-02T15:30:00&last_id=a1b2...

The API simply passes a clean Base64 cursor token: GET /tickets?cursor=MjAyNi0wOC0wMlQxNTozMDowMCswMDowMHxhMWIyYzNkNC1lNWY2LTc4OTAtYWJjZC0xMjM0NTY3ODkwYWI=
"""
def encode_cursor(created_at:datetime, item_id:UUID) -> str:
    """Encode created_at datetime and UUID into a base64 cursor string"""

    raw_str = f"{created_at.isoformat()} | {item_id}"
    return base64.urlsafe_b64encode(raw_str.encode()).decode() 


"""
When the user clicks "Next Page", the frontend sends the cursor back to the backend.

Base64 Decoding (urlsafe_b64decode) Converts "MjAyNi0wOC0wMlQx..." back into the original raw text string: "2026-08-02T15:30:00+00:00 | a1b2c3d4-e5f6-7890-abcd-1234567890ab"

iso_dt, uuid_str = raw_str.split(" | ") Splits the string back into two separate parts:

iso_dt = "2026-08-02T15:30:00+00:00"
uuid_str = "a1b2c3d4-e5f6-7890-abcd-1234567890ab"
Reconstruct Objects

datetime.fromisoformat(iso_dt) → Recreates Python datetime object.
UUID(uuid_str) → Recreates Python UUID object.
The server uses these values in PostgreSQL WHERE clause to fetch the next 20 items efficiently!
"""

def decode_cursor(cursor_str: str) -> tuple[datetime, UUID]:
    """Decode a base64 cursor string back into (created_at, item_id """
    try:
        decoed_bytes = base64.urlsafe_b64decode(cursor_str.encode())
        raw_str = decoed_bytes.decode()
        iso_dt, uuid_str = raw_str.split(" | ")
        dt = datetime.fromisoformat(iso_dt)
        return dt, UUID(uuid_str)
    except Exception:
        raise ValueError("Invalid cursor format") 