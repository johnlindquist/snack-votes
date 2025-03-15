'use client';

import * as React from 'react';
import { Menu } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { NavButton } from '@/components/ui/navigation';

interface HamburgerMenuProps {
  showAdminLink?: boolean;
  showRefresh?: boolean;
  showDiagnostics?: boolean;
  showDbDebug?: boolean;
  isDiagnosticsVisible?: boolean;
  isLoading?: boolean;
  onRefresh?: () => void;
  onToggleDiagnostics?: () => void;
}

export function HamburgerMenu({
  showAdminLink = true,
  showRefresh = true,
  showDiagnostics = false,
  showDbDebug = false,
  isDiagnosticsVisible = false,
  isLoading = false,
  onRefresh,
  onToggleDiagnostics,
}: HamburgerMenuProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="absolute right-4 top-4">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[240px] sm:w-[300px]">
        <nav className="mt-8 flex flex-col space-y-4">
          {showAdminLink && (
            <NavButton href="/admin/login" onClick={() => setOpen(false)}>
              Admin Login
            </NavButton>
          )}

          {showRefresh && (
            <NavButton
              onClick={() => {
                if (onRefresh) onRefresh();
                setOpen(false);
              }}
              disabled={isLoading}
            >
              {isLoading ? 'Refreshing...' : 'Refresh Snacks'}
            </NavButton>
          )}

          {showDiagnostics && (
            <NavButton
              onClick={() => {
                if (onToggleDiagnostics) onToggleDiagnostics();
                setOpen(false);
              }}
            >
              {isDiagnosticsVisible ? 'Hide' : 'Show'} Diagnostics
            </NavButton>
          )}

          {showDbDebug && (
            <NavButton
              href="/api/debug/db"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
            >
              Test Database Connection
            </NavButton>
          )}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
