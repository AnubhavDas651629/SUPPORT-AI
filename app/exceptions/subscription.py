class PlanLimitExceededException(Exception):
    def __init__(self, message: str = "Plan capacity limit exceeded. Please upgrade your subscription."):
        self.message = message
        super().__init__(message)

class FeatureNotAllowedException(Exception):
    def __init__(self, feature_name: str = "Feature"):
        self.message = f"{feature_name} is not available on your current plan. Please upgrade to Pro."
        super().__init__(self.message)

