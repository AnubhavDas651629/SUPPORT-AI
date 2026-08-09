import hashlib
import secrets

def generate_api_key() -> tuple[str, str, str]:
    """
    Generates a new API key and returns a tuple of"
    (raw_key, key_hash, key_prefix)
    raw_key -> full plaintext secret, returned to user once and never stored
    key_hash -> SHA256 hash of raw_key, this is what we store in the database
    key_prefix -> Marked display string like "sk_live_9078...." for the dashboard
    """
    #secrets.token_urlsafe(32) generates 43 charactwea of URL safe random text
    raw_token = secrets.token_urlsafe(32)
    raw_key = f"sk_live_{raw_token}"

    # SHA 256 hash: one-way and non reversible safe to store in DB
    key_hash = hashlib.sha256(raw_key.encode()).hexdigest()

    # Masked preview: first 16 chars + "..." + last 4 chars
    key_prefix = raw_key[:16] + "..." + raw_key[-4:]
    return raw_key, key_hash, key_prefix

def hash_api_key(raw_key: str) -> str:
    """
    Hashes an incoming raw API key for database lookup.
    Called on every request that uses X-API-Key authentication.
    """
    return hashlib.sha256(raw_key.encode()).hexdigest()