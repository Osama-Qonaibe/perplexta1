/**
 * 📝 PERPLEXTA DESIGN SYSTEM — INPUT FIELD PRIMITIVE (v4.0.0)
 * 
 * Standardized form text input with label, leading/trailing icons, error state,
 * 1.5px border, and Brand Focus Ring (3px box-shadow with var(--github-blue) 18%).
 */

import React, { forwardRef } from 'react';

export interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: React.ReactNode;
  icon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  error?: string;
  helperText?: string;
  containerClassName?: string;
}

export const InputField = forwardRef<HTMLInputElement, InputFieldProps>(({
  label,
  icon,
  trailingIcon,
  error,
  helperText,
  containerClassName = '',
  className = '',
  disabled,
  id,
  ...props
}, ref) => {
  const inputId = id || (label ? `input-${String(label).toLowerCase().replace(/\s+/g, '-')}` : undefined);

  return (
    <div className={`flex flex-col gap-1.5 w-full ${containerClassName}`}>
      {label && (
        <label htmlFor={inputId} className="text-xs font-semibold text-[var(--foreground)] select-none">
          {label}
        </label>
      )}
      
      <div className="relative flex items-center w-full">
        {icon && (
          <div className="absolute left-3 inset-y-0 flex items-center pointer-events-none text-[var(--muted-foreground)] shrink-0">
            {icon}
          </div>
        )}

        <input
          ref={ref}
          id={inputId}
          disabled={disabled}
          className={`
            w-full h-9 px-3 text-xs sm:text-sm font-medium
            bg-[var(--surface-page)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]
            border-[1.5px] border-[var(--border)] rounded-[10px]
            focus:outline-none focus:border-[var(--github-blue)]
            focus:shadow-[0_0_0_3px_color-mix(in_oklab,var(--github-blue)_18%,transparent)]
            transition-all duration-150 ease-out
            disabled:opacity-50 disabled:cursor-not-allowed
            ${icon ? 'pl-9' : ''}
            ${trailingIcon ? 'pr-9' : ''}
            ${error ? 'border-[var(--destructive)] focus:border-[var(--destructive)] focus:shadow-[0_0_0_3px_color-mix(in_oklab,var(--destructive)_18%,transparent)]' : ''}
            ${className}
          `}
          {...props}
        />

        {trailingIcon && (
          <div className="absolute right-3 inset-y-0 flex items-center text-[var(--muted-foreground)] shrink-0">
            {trailingIcon}
          </div>
        )}
      </div>

      {error ? (
        <span className="text-[11px] font-medium text-[var(--destructive)]">{error}</span>
      ) : helperText ? (
        <span className="text-[11px] font-medium text-[var(--muted-foreground)]">{helperText}</span>
      ) : null}
    </div>
  );
});

InputField.displayName = 'InputField';
