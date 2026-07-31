class RedisKeys:
    @staticmethod
    def email_otp(email: str) -> str:
        return f"otp:email:{email}"

    @staticmethod
    def email_otp_attempts(email: str) -> str:
        return f"otp:attempts:{email}"

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
    def rate_limit_ip(ip: str, path: str) -> str:
        return f"rate_limit:ip:{ip}:{path}"

    @staticmethod
    def rate_limit_user(user_id: str, path: str) -> str:
        return f"rate_limit:user:{user_id}:{path}"


    @staticmethod
    def cache_org(org_id:str) -> str:
        return f"cache:org:{org_id}"

    @staticmethod
    def cache_user(user_id: str) -> str:
        return f"cache:user:{user_id}"
    
    @staticmethod
    def cache_kb(kb_id: str) -> str:
        return f"cache:kb:{kb_id}"

    @staticmethod
    def cache_member(org_id: str, user_id:str) -> str:
        return f" cache:member:{org_id}:{user_id}"