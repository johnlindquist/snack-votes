'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/ui/header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { HamburgerMenu } from '@/components/ui/hamburger-menu';
import confetti from 'canvas-confetti';

// Disable static optimization for this route
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Function to trigger confetti for the winners announcement
const triggerWinnersConfetti = () => {
  const count = 200;
  const defaults = {
    origin: { y: 0.7 },
    zIndex: 10000,
  };

  function fire(particleRatio: number, opts: confetti.Options) {
    confetti({
      ...defaults,
      ...opts,
      particleCount: Math.floor(count * particleRatio),
    });
  }

  fire(0.25, {
    spread: 26,
    startVelocity: 55,
  });

  fire(0.2, {
    spread: 60,
  });

  fire(0.35, {
    spread: 100,
    decay: 0.91,
    scalar: 0.8,
  });

  fire(0.1, {
    spread: 120,
    startVelocity: 25,
    decay: 0.92,
    scalar: 1.2,
  });

  fire(0.1, {
    spread: 120,
    startVelocity: 45,
  });
};

export default function Home() {
  const [activePollName, setActivePollName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [_error, setError] = useState<string | null>(null);
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  const isDev = () => {
    return process.env.NODE_ENV === 'development';
  };

  useEffect(() => {
    const fetchActivePoll = async () => {
      try {
        console.log('Home page: Fetching active poll info');
        const timestamp = new Date().getTime();
        const response = await fetch(`/api/polls/active?t=${timestamp}`, {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            Pragma: 'no-cache',
            Expires: '0',
            // Add a random header value to bypass cache
            'X-Cache-Bust': timestamp.toString(),
          },
        });

        if (!response.ok) {
          if (response.status === 404) {
            console.log('Home page: No active poll found');
            setActivePollName(null);
            setIsLoading(false);
            return;
          }
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Home page: Active poll retrieved:', data.title);
        setActivePollName(data.title);
      } catch (err) {
        console.error('Home page: Error fetching active poll:', err);
        setError(
          `Failed to fetch active poll: ${err instanceof Error ? err.message : String(err)}`,
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchActivePoll();
    triggerWinnersConfetti(); // Trigger confetti when the page loads
  }, []);

  // These are the winning snacks
  const winners = [
    'Peanut M&Ms',
    'Chocolate Strawberries',
    'Regular Chex Mix',
    'Chips and Salsa',
  ];

  return (
    <>
      {/* Status bar for active poll - always visible regardless of errors */}
      {!isLoading && (
        <div className="fixed left-0 right-0 top-0 z-50 bg-primary p-2 text-center text-sm text-white shadow-md">
          {activePollName ? (
            <div>
              <span className="mr-2 inline-block h-2 w-2 animate-pulse rounded-full bg-green-300"></span>
              Active Poll: <strong>{activePollName}</strong>
            </div>
          ) : (
            <div>
              <span className="mr-2 inline-block h-2 w-2 rounded-full bg-yellow-300"></span>
              No Active Poll
            </div>
          )}
        </div>
      )}

      {/* Main content with padding to accommodate the status bar */}
      <div className="pt-10">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="relative">
            <Header title="Snack Vote Results" />
            <HamburgerMenu
              showDiagnostics={isDev()}
              isDiagnosticsVisible={showDiagnostics}
              onToggleDiagnostics={() => setShowDiagnostics(!showDiagnostics)}
            />
          </div>

          {isLoading ? (
            <div className="my-10 text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              <p className="mt-2 text-gray-600">Loading poll data...</p>
            </div>
          ) : (
            <>
              <Card className="mb-6 border-green-200 bg-green-50">
                <CardContent className="p-6">
                  <h2 className="mb-4 text-center text-2xl font-bold text-green-700">
                    🏆 Winning Snacks 🏆
                  </h2>
                  <p className="mb-6 text-center text-gray-700">
                    Thank you to everyone who participated in the snack voting!
                    Here are the winners:
                  </p>

                  <div className="divide-y divide-green-200">
                    {winners.map((winner, index) => (
                      <div key={index} className="flex items-center py-4">
                        <div className="mr-4 flex-shrink-0 text-2xl">🏆</div>
                        <div className="flex-grow">
                          <h3 className="text-xl font-semibold text-green-800">
                            {winner}
                          </h3>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* <div className="mt-8 text-center">
                <Link href="/vote">
                  <Button size="lg" className="bg-primary hover:bg-primary/90">
                    Go to Voting Page
                  </Button>
                </Link>
              </div> */}

              {/* Show diagnostics in development mode */}
              {isDev() && showDiagnostics && (
                <div className="mt-8 rounded-md border border-gray-300 bg-gray-50 p-4">
                  <h3 className="mb-2 font-semibold">Debug Info:</h3>
                  <pre className="overflow-x-auto text-xs">
                    {JSON.stringify(
                      {
                        activePollName,
                        env: process.env.NODE_ENV,
                        origin:
                          typeof window !== 'undefined'
                            ? window.location.origin
                            : 'N/A',
                      },
                      null,
                      2,
                    )}
                  </pre>
                  <Button
                    onClick={() => setShowDiagnostics(false)}
                    variant="outline"
                    className="mt-2"
                    size="sm"
                  >
                    Hide Debug
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
