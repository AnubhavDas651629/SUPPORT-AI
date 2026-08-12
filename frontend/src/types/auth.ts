export interface User {
  id: string;
  email: string;
  full_name: string;
  is_active: boolean;
  is_verified?: boolean;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in?: number;
}

export interface GenericMessageResponse {
  message: string;
}

export interface VerifyOTPResponse {
  reset_token: string;
  token_type: string;
}
