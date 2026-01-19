"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CheckboxProps extends Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "onChange" | "onInput"
> {
  onCheckedChange?: (checked: boolean) => void;
  checked?: boolean;
}

const Checkbox = React.forwardRef<HTMLButtonElement, CheckboxProps>(
  ({ className, checked, onCheckedChange, disabled, ...props }, ref) => {
    return (
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onCheckedChange?.(!checked)}
        className={cn(
          "peer h-4 w-4 shrink-0 rounded-sm border ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors",
          checked
            ? "bg-accent text-white border-accent"
            : "border-text-muted/50 hover:border-text-primary bg-transparent",
          className,
        )}
        ref={ref}
        {...props}
      >
        <span
          className={cn(
            "flex items-center justify-center text-current",
            !checked && "opacity-0",
          )}
        >
          <Check className="h-3 w-3" strokeWidth={3} />
        </span>
      </button>
    );
  },
);
Checkbox.displayName = "Checkbox";

export { Checkbox };
