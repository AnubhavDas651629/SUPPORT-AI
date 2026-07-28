import secrets
import string

def generate_otp(length: int = 6) -> str:
    """
    Generate a cryptographically secure numeric OTP.

    Args:
        length: Length of the OTP.

    Returns:
        A numeric OTP as a string.
    """

    digits = string.digits
    return "".join(secrets.choice(digits) for _ in range(length))

print(generate_otp())
print(generate_otp())
print(generate_otp())