'use client';

import { useState, useEffect } from 'react';
import VotePage from './vote/page';

// Disable static optimization for this route
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function Home() {
  // Add a component to display the active poll in the main page for debugging
  const [activePollName, setActivePollName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [_error, setError] = useState<string | null>(null);

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
  }, []);

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
        <VotePage />
      </div>
    </>
  );
}
