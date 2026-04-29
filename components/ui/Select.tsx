"use client";

import { type SelectHTMLAttributes, forwardRef } from "react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, className = "", id, ...props }, ref) => {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label
            htmlFor={selectId}
            className="text-sm font-bold text-cf-text-primary dark:text-cf-dark-text"
          >
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={`
            h-8 px-3 rounded-[5px] text-sm font-medium
            bg-cf-bg-white dark:bg-cf-dark-surface
            text-cf-text-primary dark:text-cf-dark-text
            border transition-colors outline-none
            ${
              error
                ? "border-cf-error"
                : "border-cf-border dark:border-cf-dark-border focus:border-cf-blue"
            }
            disabled:bg-cf-bg-gray disabled:text-cf-text-disabled
            ${className}
          `}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && (
          <span className="text-xs font-medium text-cf-error">{error}</span>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";
export default Select;
