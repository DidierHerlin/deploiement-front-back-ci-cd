"use client"

import * as React from "react"
import { Eye, EyeOff, LockKeyhole } from "lucide-react"

export interface PasswordInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, error, ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false)

    return (
      <div className="relative">
        <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" aria-hidden="true" />
        <input
          type={showPassword ? "text" : "password"}
          className={`h-12 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-950/60 pl-11 pr-11 text-sm text-slate-900 dark:text-slate-100 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 hover:bg-white dark:hover:bg-slate-950 hover:border-slate-300 dark:hover:border-slate-700 focus:border-primary dark:focus:border-blue-500 focus:bg-white dark:focus:bg-slate-950 focus:ring-4 focus:ring-primary/10 dark:focus:ring-blue-500/10 ${
            error ? "border-destructive dark:border-destructive focus:border-destructive hover:border-destructive" : ""
          } ${className || ""}`}
          ref={ref}
          {...props}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors cursor-pointer"
        >
          {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
    )
  }
)
PasswordInput.displayName = "PasswordInput"

export { PasswordInput }
