import Link from 'next/link';
import { Button } from './button';

interface HeaderProps {
  title: string;
  showAdminLink?: boolean;
  showHomeLink?: boolean;
  showSignOut?: boolean;
  onSignOut?: () => void;
}

export function Header({
  title,
  showAdminLink = true,
  showHomeLink = false,
  showSignOut = false,
  onSignOut,
}: HeaderProps) {
  return (
    <header className="mb-12 flex items-center justify-between">
      <h1 className="bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-3xl font-bold text-transparent">
        {title}
      </h1>
      <div className="flex gap-4">
        {showHomeLink && (
          <Link href="/">
            <Button
              variant="ghost"
              size="sm"
              className="text-slate-600 hover:text-slate-900"
            >
              Back to Home
            </Button>
          </Link>
        )}
        {showAdminLink && (
          <Link href="/admin/login">
            <Button
              variant="ghost"
              size="sm"
              className="text-slate-600 hover:text-slate-900"
            >
              Admin Login
            </Button>
          </Link>
        )}
        {showSignOut && (
          <Button
            variant="ghost"
            size="sm"
            className="text-slate-600 hover:text-slate-900"
            onClick={onSignOut}
          >
            Sign Out
          </Button>
        )}
      </div>
    </header>
  );
}
