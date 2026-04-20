import React from 'react';

function Input({ label, id, error, className = '', containerClassName = '', ...props }) {
  const inputId = id ?? props.name;

  return (
    <div className={containerClassName}>
      {label && (
        <label
          htmlFor={inputId}
          className="mb-1.5 block text-sm font-semibold text-on-surface font-body"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`h-10 w-full rounded-xl border border-surface-container-highest bg-surface-container-low px-3 text-sm text-on-surface font-body outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10 placeholder:text-on-surface-variant/60 ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-error font-body">{error}</p>}
    </div>
  );
}

export default Input;
