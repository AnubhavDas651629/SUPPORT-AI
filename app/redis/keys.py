class RedisKeys:
    @staticmethod
    def email_otp(email: str) -> str:
        return f"otp:email:{email}"

    @staticmethod
    def phone_otp(phone: str) -> str:
        return f"otp:phone:{phone}"

    @staticmethod
    def oauth_state(state: str) -> str:
        return f"oauth:state:{state}"

    @staticmethod
    def password_reset(token: str) -> str:
        return f"password_reset:{token}"

    @staticmethod
    def rate_limit(user_id: str) -> str:
        return f"rate_limit:user:{user_id}"

    @staticmethod
    def faq_cache(key: str) -> str:
        return f"cache:faq:{key}"