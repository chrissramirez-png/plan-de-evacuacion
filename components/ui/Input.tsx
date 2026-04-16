"use client";

import { type InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helper?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helper, className = "", id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-bold text-cf-text-primary dark:text-cf-dark-text"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`
            h-8 px-3 rounded-[5px] text-sm font-medium
            bg-cf-bg-white dark:bg-cf-dark-surface
            text-cf-text-primary dark:text-cf-dark-text
            placeholder:text-cf-text-secondary dark:placeholder:text-cf-dark-text-secondary
            border transition-colors outline-none
            ${
              error
                ? "border-cf-error focus:border-cf-error"
                : "border-cf-border-form dark:border-cf-dark-border focus:border-cf-blue"
            }
            disabled:bg-cf-bg-gray disabled:text-cf-text-disabled disabled:dark:bg-cf-dark-bg
            ${className}
          `}
          {...props}
        />
        {error && (
          <span className="text-xs font-medium text-cf-error">{error}</span>
        )}
        {helper && !error && (
          <span className="text-xs font-medium text-cf-text-secondary dark:text-cf-dark-text-secondary">
            {helper}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
export default Input;
