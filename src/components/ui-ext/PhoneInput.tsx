import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface PhoneInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> {
  value?: string;
  onChange?: (value: string) => void;
}

/**
 * Tanzanian phone input.
 * Accepts either +255XXXXXXXXX (13 chars) or 0XXXXXXXXX (10 chars).
 * Strips invalid characters and enforces max length based on prefix.
 */
export const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ value = "", onChange, className, placeholder = "+255XXXXXXXXX or 0XXXXXXXXX", ...props }, ref) => {
    const sanitize = (raw: string) => {
      // Keep leading + only if it starts with +; everything else digits
      let v = raw.replace(/[^\d+]/g, "");
      // + only allowed at position 0
      if (v.indexOf("+") > 0) v = v.replace(/\+/g, "");
      if (v.startsWith("+")) {
        // Force +255 prefix; max length 13 (+255 + 9 digits)
        if (!v.startsWith("+255")) {
          // If user is mid-typing the prefix, allow partial up to "+255"
          const prefix = "+255".slice(0, v.length);
          if (v === prefix) return v;
          // Replace whatever country code typed with +255 + remaining digits
          const digits = v.replace(/^\+\d*/, "");
          v = "+255" + digits;
        }
        return v.slice(0, 13);
      }
      if (v.startsWith("0")) {
        return v.slice(0, 10);
      }
      // No prefix yet — allow digits up to 10 (will be treated as 0-prefixed)
      return v.slice(0, 10);
    };

    return (
      <Input
        ref={ref}
        type="tel"
        inputMode="numeric"
        pattern="[0-9+]*"
        autoComplete="tel"
        placeholder={placeholder}
        value={value}
        onKeyDown={(e) => {
          // Allow control keys
          if (
            e.ctrlKey || e.metaKey || e.altKey ||
            ["Backspace", "Delete", "Tab", "Escape", "Enter", "Home", "End",
              "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)
          ) return;
          // Allow digits always; allow + only as first char
          if (/^\d$/.test(e.key)) return;
          if (e.key === "+" && (e.currentTarget.selectionStart ?? 0) === 0 && !e.currentTarget.value.startsWith("+")) return;
          e.preventDefault();
        }}
        onPaste={(e) => {
          e.preventDefault();
          const text = e.clipboardData.getData("text");
          onChange?.(sanitize(text));
        }}
        onChange={(e) => onChange?.(sanitize(e.target.value))}
        className={cn("num", className)}
        {...props}
      />
    );
  }
);
PhoneInput.displayName = "PhoneInput";
