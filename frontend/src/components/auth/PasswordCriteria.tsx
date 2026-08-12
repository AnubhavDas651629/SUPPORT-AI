"use client";

import React from "react";
import { Check, X } from "lucide-react";

interface PasswordCriteriaProps {
  password: string;
}

export function PasswordCriteria({ password }: PasswordCriteriaProps) {
  const hasMinLength = password.length >= 8;
  const hasNumber = /\d/.test(password);
  const hasNoSpaces = password.length > 0 && !/\s/.test(password);
  const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  const criteria = [
    { label: "Minimum 8 characters", valid: hasMinLength },
    { label: "One number required", valid: hasNumber },
    { label: "No spaces allowed", valid: hasNoSpaces, isSpaceRule: true },
    { label: "Add a symbol (e.g., @, #, !)", valid: hasSymbol },
  ];

  return (
    <div className="flex flex-col gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
      {criteria.map((item, index) => {
        const isSpaceFail = item.isSpaceRule && /\s/.test(password);

        return (
          <div key={index} className="flex items-center gap-2 transition-colors">
            <span
              className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] shrink-0 ${
                item.valid
                  ? "bg-emerald-100 text-emerald-600"
                  : isSpaceFail
                  ? "bg-rose-100 text-rose-600"
                  : "bg-slate-200 text-slate-400"
              }`}
            >
              {item.valid ? (
                <Check className="w-2.5 h-2.5 stroke-[3]" />
              ) : isSpaceFail ? (
                <X className="w-2.5 h-2.5 stroke-[3]" />
              ) : (
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
              )}
            </span>
            <span
              className={`font-medium ${
                item.valid
                  ? "text-emerald-700"
                  : isSpaceFail
                  ? "text-rose-600 font-semibold"
                  : "text-slate-500"
              }`}
            >
              {item.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function isPasswordValid(password: string): boolean {
  return (
    password.length >= 8 &&
    /\d/.test(password) &&
    !/\s/.test(password) &&
    /[!@#$%^&*(),.?":{}|<>]/.test(password)
  );
}
