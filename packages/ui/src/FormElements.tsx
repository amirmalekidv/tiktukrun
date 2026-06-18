import React from 'react';

// ─── Input ──────────────────────────────────────────────────────────────────

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftElement?: React.ReactNode;
  rightElement?: React.ReactNode;
  fullWidth?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, leftElement, rightElement, fullWidth, className = '', ...props }, ref) => {
    const base =
      'bg-[#1a0505]/50 border border-[rgba(127,29,29,0.4)] text-text-primary placeholder-text-muted rounded-lg px-4 py-2.5 text-sm transition-all focus:outline-none focus:border-primary focus:shadow-blood';
    const errorClass = error ? 'border-red-500 focus:border-red-500' : '';

    return (
      <div className={`${fullWidth ? 'w-full' : ''} flex flex-col gap-1`}>
        {label && (
          <label className="text-sm font-medium text-text-secondary">{label}</label>
        )}
        <div className="relative flex items-center">
          {leftElement && (
            <span className="absolute right-3 text-text-muted">{leftElement}</span>
          )}
          <input
            ref={ref}
            className={`${base} ${errorClass} ${leftElement ? 'pr-10' : ''} ${rightElement ? 'pl-10' : ''} ${fullWidth ? 'w-full' : ''} ${className}`}
            {...props}
          />
          {rightElement && (
            <span className="absolute left-3 text-text-muted">{rightElement}</span>
          )}
        </div>
        {error && <span className="text-xs text-red-400">{error}</span>}
        {hint && !error && <span className="text-xs text-text-muted">{hint}</span>}
      </div>
    );
  },
);
Input.displayName = 'Input';

// ─── Select ──────────────────────────────────────────────────────────────────

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string | number; label: string }[];
  placeholder?: string;
  fullWidth?: boolean;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, placeholder, fullWidth, className = '', ...props }, ref) => {
    return (
      <div className={`${fullWidth ? 'w-full' : ''} flex flex-col gap-1`}>
        {label && <label className="text-sm font-medium text-text-secondary">{label}</label>}
        <select
          ref={ref}
          className={`bg-[#1a0505]/50 border border-[rgba(127,29,29,0.4)] text-text-primary rounded-lg px-4 py-2.5 text-sm transition-all focus:outline-none focus:border-primary focus:shadow-blood ${fullWidth ? 'w-full' : ''} ${className}`}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && <span className="text-xs text-red-400">{error}</span>}
      </div>
    );
  },
);
Select.displayName = 'Select';

// ─── Textarea ────────────────────────────────────────────────────────────────

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, fullWidth, className = '', ...props }, ref) => {
    return (
      <div className={`${fullWidth ? 'w-full' : ''} flex flex-col gap-1`}>
        {label && <label className="text-sm font-medium text-text-secondary">{label}</label>}
        <textarea
          ref={ref}
          className={`bg-[#1a0505]/50 border border-[rgba(127,29,29,0.4)] text-text-primary placeholder-text-muted rounded-lg px-4 py-2.5 text-sm transition-all focus:outline-none focus:border-primary focus:shadow-blood resize-y ${fullWidth ? 'w-full' : ''} ${className}`}
          {...props}
        />
        {error && <span className="text-xs text-red-400">{error}</span>}
      </div>
    );
  },
);
Textarea.displayName = 'Textarea';

// ─── Checkbox ────────────────────────────────────────────────────────────────

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({ label, className = '', ...props }) => (
  <label className="flex items-center gap-2 cursor-pointer group">
    <input
      type="checkbox"
      className={`w-4 h-4 accent-primary rounded ${className}`}
      {...props}
    />
    {label && (
      <span className="text-sm text-text-secondary group-hover:text-text-primary transition-colors">
        {label}
      </span>
    )}
  </label>
);

// ─── Switch ──────────────────────────────────────────────────────────────────

export interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
}

export const Switch: React.FC<SwitchProps> = ({ checked, onChange, label, disabled }) => (
  <label className={`flex items-center gap-3 cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50 ${
        checked ? 'bg-primary' : 'bg-[rgba(127,29,29,0.3)]'
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
    {label && <span className="text-sm text-text-secondary">{label}</span>}
  </label>
);
