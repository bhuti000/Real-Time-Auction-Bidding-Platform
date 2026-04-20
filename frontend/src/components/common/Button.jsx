import React from 'react';

const variantClasses = {
  primary:
    'bg-gradient-to-br from-primary to-primary-dim text-white hover:opacity-90 shadow-premium',
  secondary: 'bg-secondary-container text-secondary hover:bg-secondary-container/80',
  ghost: 'bg-transparent text-on-surface-variant hover:bg-surface-container-low',
  danger: 'bg-rose-500 text-white hover:bg-rose-400',
};

const sizeClasses = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-11 px-5 text-base',
};

function Button({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  ...props
}) {
  const styles = variantClasses[variant] ?? variantClasses.primary;
  const sizes = sizeClasses[size] ?? sizeClasses.md;

  return (
    <button
      type={type}
      disabled={disabled}
      className={`inline-flex items-center justify-center rounded-xl font-semibold font-headline transition disabled:cursor-not-allowed disabled:opacity-60 ${styles} ${sizes} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export default Button;
