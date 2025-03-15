import { Navigation, NavButton } from './navigation';

interface HeaderProps {
  title?: string;
  showHomeLink?: boolean;
  showSignOut?: boolean;
  onSignOut?: () => void;
}

export function Header({
  title = 'Snack Bracket',
  showHomeLink = false,
  showSignOut = false,
  onSignOut,
}: HeaderProps) {
  return (
    <header className="flex w-full flex-col items-center">
      <div className="mb-4 text-center">
        <h1 className="text-4xl font-extrabold text-primary">
          {title || 'Snack Bracket'}
        </h1>
        <div className="bg-primary/20 mx-auto mt-3 h-1 w-24 rounded-full"></div>
      </div>

      <Navigation className="mt-2">
        {showHomeLink && <NavButton href="/">Back to Home</NavButton>}
        {showSignOut && <NavButton onClick={onSignOut}>Sign Out</NavButton>}
      </Navigation>
    </header>
  );
}
