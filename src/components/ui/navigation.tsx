import Link from 'next/link';
import { Button } from './button';

interface NavigationProps {
  className?: string;
  children?: React.ReactNode;
}

export function Navigation({ className = '', children }: NavigationProps) {
  return (
    <nav className={`flex justify-center gap-3 ${className}`}>{children}</nav>
  );
}

interface NavButtonProps {
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function NavButton({
  href,
  onClick,
  disabled = false,
  className = '',
  children,
}: NavButtonProps) {
  const buttonElement = (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      disabled={disabled}
      className={`hover:bg-primary/10 rounded-full text-primary transition-colors hover:text-primary-600 ${className}`}
    >
      {children}
    </Button>
  );

  if (href) {
    return <Link href={href}>{buttonElement}</Link>;
  }

  return buttonElement;
}
