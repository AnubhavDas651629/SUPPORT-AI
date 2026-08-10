import hashlib
import hmac
import secrets
import time

def generate_webhook_secret() -> str:
    """
    Generate a unique secret for a webhook endpoint
    to be only shown once to the customer, then stored encrypted in DB
    """
    raw = secrets.token_urlsafe(32) 
    return f"whsec_{raw}" #would look like whsec_awciub342dq...

#in the input -> secret: the key generated from the generate_webhook_secret
#payload: actual JSON data of the event being sent over as raw_bytes, for example: ticket.created
def sign_webhook_payload(*, secret: str, payload: str) -> str:
    
    """        
    Creates the X-SupportAI-Signature header value using HMAC-SHA256.
    Format: "t=1723300200,v1=9a8f4c2e1b8..."
    - t = Unix timestamp (customer uses this to reject old replayed requests)
    - v1 = HMAC_SHA256(secret, f"{timestamp}.{raw_payload_bytes}")
    """

    timestamp = str(int(time.time()))

    #using encode because cannot mix "str" (timestamp) and "bytes"(payload), so encode will convert timestamp to bytes
    signed_payload = f"{timestamp}.".encode() + payload
    # HMAC-SHA256 with the webhook secret as key
    signature = hmac.new(
        secret.encode("utf-8"), #the customer's webhook secret as bytes
        signed_payload, #Message: timestamp.payload bytes
        hashlib.sha256 # algorithm: SHA 256
    ).hexdigest() # hexidigest will convert resulting cryptographic binary into human readble 64 hexadecimal string
    return f"t={timestamp},v1={signature}"
