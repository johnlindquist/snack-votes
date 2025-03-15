import { forwardRef } from 'react';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | 'default'
    | 'primary'
    | 'secondary'
    | 'ghost'
    | 'outline'
    | 'link'
    | 'destructive';
  size?: 'sm' | 'md' | 'lg' | 'icon';
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className = '',
      variant = 'default',
      size = 'md',
      ...props
    }: ButtonProps,
    ref,
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-200';

    const variantStyles = {
      default: 'bg-primary text-white hover:bg-primary/90',
      primary:
        'bg-primary text-white hover:bg-primary/90 shadow-sm hover:shadow',
      secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
      ghost: 'hover:bg-accent hover:text-accent-foreground',
      outline:
        'border border-input bg-white hover:bg-primary/5 hover:border-primary/50',
      link: 'text-primary underline-offset-4 hover:underline',
      destructive: 'bg-destructive text-white hover:bg-destructive/90',
    };

    const sizeStyles = {
      sm: 'h-9 px-4 rounded-md text-sm',
      md: 'h-10 px-5 py-2 rounded-md',
      lg: 'h-12 px-8 text-lg rounded-lg',
      icon: 'h-10 w-10 rounded-full',
    };

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  },
);

Button.displayName = 'Button';

export { Button };
