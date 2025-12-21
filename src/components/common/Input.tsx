import { InputHTMLAttributes, forwardRef } from 'react';

// ============================================
// INPUT COMPONENT
// ============================================

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-copy-light dark:text-copy-light light:text-copy-light mb-2">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`
            w-full px-4 py-3 rounded-xl
            glass
            dark:text-copy light:text-copy-light
            border dark:border-border light:border-border-light
            dark:bg-foreground/50 light:bg-white
            focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
            dark:placeholder-copy-lighter light:placeholder-slate-400
            transition-all duration-200
            ${error ? 'border-error focus:ring-error' : ''}
            ${className}
          `}
          {...props}
        />
        {error && <p className="mt-2 text-sm text-error">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
