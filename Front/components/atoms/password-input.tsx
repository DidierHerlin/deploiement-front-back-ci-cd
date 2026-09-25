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
        <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <input
          type={showPassword ? "text" : "password"}
          className={`h-12 w-full rounded-xl border border-input/60 bg-white/50 pl-11 pr-11 text-sm outline-none transition-all placeholder:text-muted-foreground hover:bg-white focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 ${
            error ? "border-destructive focus:border-destructive hover:border-destructive" : ""
          } ${className || ""}`}
          ref={ref}
          {...props}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
    )
  }
)
PasswordInput.displayName = "PasswordInput"

export { PasswordInput }
