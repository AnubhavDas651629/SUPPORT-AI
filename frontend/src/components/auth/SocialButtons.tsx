"use client";

import React, { useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

interface SocialButtonsProps {
  isLoading?: boolean;
}

export function SocialButtons({ isLoading: parentIsLoading }: SocialButtonsProps) {
  const { googleLogin } = useAuth();
  const router = useRouter();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleGoogleSuccess = async (credentialResponse: any) => {
    if (credentialResponse.credential) {
      setIsGoogleLoading(true);
      try {
        await googleLogin(credentialResponse.credential);
        router.push("/dashboard");
      } catch (error) {
        console.error("Google login failed", error);
      } finally {
        setIsGoogleLoading(false);
      }
    }
  };

  const isLoading = parentIsLoading || isGoogleLoading;

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Google Sign In Button */}
      <div className="w-full flex justify-center">
        {isLoading ? (
          <div className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl border border-slate-200 bg-white text-slate-800 font-medium text-sm">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Signing in...</span>
          </div>
        ) : (
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => console.error("Google Login Failed")}
            width="100%"
            theme="outline"
            size="large"
          />
        )}
      </div>

      {/* Divider */}
      <div className="relative my-3 flex items-center justify-center">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200"></div>
        </div>
        <span className="relative bg-white px-3 text-xs font-semibold text-slate-400 tracking-wider">
          OR
        </span>
      </div>
    </div>
  );
}
