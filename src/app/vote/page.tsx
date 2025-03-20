'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Header } from '@/components/ui/header';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { HamburgerMenu } from '@/components/ui/hamburger-menu';
import { Toaster, toast } from 'react-hot-toast';
import confetti from 'canvas-confetti';

type Pair = {
  id: number;
  optionA: string;
  optionB: string;
  groupId?: number;
};

type Group = {
  id: number;
  title: string;
  pairs: Pair[];
};

type Poll = {
  id: number;
  title: string;
  isActive: boolean;
  isClosed: boolean;
  pairs: Pair[]; // Keep for backward compatibility
  groups: Group[];
};

// Function to trigger confetti
const triggerConfetti = () => {
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

export default function VotePage() {
  // Add a component to display the active poll in the main page for debugging
  const [activePollName, setActivePollName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [_error, setError] = useState<string | null>(null);
  const [activePoll, setActivePoll] = useState<Poll | null>(null);
  const [pairs, setPairs] = useState<Pair[]>([]);
  const [votes, setVotes] = useState<{ [key: number]: string }>({});
  const [voterName, setVoterName] = useState('');
  const [formError, setFormError] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [completedVoterName, setCompletedVoterName] = useState('');
  const [formKey, setFormKey] = useState(Date.now());
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  // Function to check if we're in a development environment
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
        setActivePoll(data);
        setPairs(data.pairs || []);
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

  const fetchActivePollWithRetry = useCallback(() => {
    console.log('************************');
    console.log(
      `Fetching active poll from client - (Attempt ${retryCount + 1}/${maxRetries + 1})`,
    );
    console.log('Timestamp:', new Date().toISOString());
    console.log('************************');

    setIsLoading(true);
    setFetchError(null);

    // Define a timeout for the fetch operation
    const fetchTimeout = setTimeout(() => {
      console.warn('API fetch timeout reached after 10 seconds');
      setFetchError('Request timed out. The server might be unavailable.');
      setIsLoading(false);
    }, 10000);

    // Add cache-busting parameter to prevent caching
    const timestamp = new Date().getTime();
    console.log(`Starting fetch request to /api/polls/active?t=${timestamp}`);
    fetch(`/api/polls/active?t=${timestamp}`, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
        // Add a random header value to bypass cache
        'X-Cache-Bust': timestamp.toString(),
        // Force primary read
        'X-Force-Primary': 'true',
      },
    })
      .then((res) => {
        console.log('API response received');
        console.log('API response status:', res.status);
        console.log(
          'API response headers:',
          Object.fromEntries([...res.headers.entries()]),
        );

        if (!res.ok) {
          if (res.status === 404) {
            console.log('No active poll found - 404 response');
            setActivePoll(null);
            setPairs([]);
            setIsLoading(false);
            clearTimeout(fetchTimeout);
            return null;
          }

          console.error('API response not OK:', res.status, res.statusText);
          throw new Error(
            `API response error: ${res.status} ${res.statusText}`,
          );
        }

        console.log('API response OK, parsing JSON data');
        return res.json();
      })
      .then((data) => {
        // Clear the timeout since we got a response
        clearTimeout(fetchTimeout);

        if (!data) {
          console.log('No data returned from API');
          return;
        }

        console.log('API data received successfully');
        console.log('Active poll data:', JSON.stringify(data, null, 2));

        setActivePoll(data);
        setPairs(data.pairs || []);
        setIsLoading(false);
        setRetryCount(0); // Reset retry count on success
        console.log(`Successfully set active poll: "${data.title}"`);
      })
      .catch((err) => {
        // Clear the timeout since we got an error
        clearTimeout(fetchTimeout);

        console.error('Error fetching active poll:', err);
        console.error('Error details:', err.message);
        setFetchError(`Failed to fetch active poll: ${err.message}`);
        setIsLoading(false);
      })
      .finally(() => {
        console.log('************************');
        console.log('Active poll fetch request completed');
        console.log('************************');
      });

    // Cleanup function to clear the timeout if the component unmounts
    return () => clearTimeout(fetchTimeout);
  }, [retryCount]);

  // Retry logic
  const handleRetry = () => {
    if (retryCount < maxRetries) {
      setRetryCount((prev) => prev + 1);
      fetchActivePollWithRetry();
    } else {
      console.error('Maximum retry attempts reached');
      setFetchError('Maximum retry attempts reached. Please try again later.');
    }
  };

  const _resetForm = () => {
    setVotes({});
    setVoterName('');
    setFormError('');
    setShowSuccessModal(false);
    setCompletedVoterName('');
    setFormKey(Date.now());
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleChange = (pairId: number, selection: string) => {
    setVotes((prev) => ({ ...prev, [pairId]: selection }));
    setFormError(''); // Clear error when user makes a selection
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!activePoll) {
      setFormError('No active poll available');
      return;
    }

    // Validate voter name
    if (!voterName.trim()) {
      setFormError('Please enter your name');
      return;
    }

    // Get all pairs from all groups
    const allPairs =
      activePoll.groups.length > 0
        ? activePoll.groups.flatMap((group) => group.pairs)
        : activePoll.pairs;

    // Check if all pairs have been voted on
    const unvotedPairs = allPairs.filter((pair) => !votes[pair.id]);
    if (unvotedPairs.length > 0) {
      setFormError(`Please select an option for all ${allPairs.length} pairs`);
      return;
    }

    // Prepare the vote data
    const voteData = {
      pollId: activePoll.id,
      voterName: voterName.trim(),
      votes: Object.entries(votes).map(([pairId, selection]) => ({
        pairId: parseInt(pairId),
        selection,
      })),
    };

    try {
      const response = await fetch('/api/vote/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(voteData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit vote');
      }

      // Trigger the confetti effect on successful vote
      triggerConfetti();

      // Display success message
      setCompletedVoterName(voterName.trim());
      setShowSuccessModal(true);
      toast.success('Your vote has been recorded!');

      // Reset all form fields
      setVotes({});
      setVoterName('');
      setFormError('');
      setFormKey(Date.now()); // Reset the form key to force a re-render
    } catch (error) {
      console.error('Error submitting vote:', error);
      setFormError(
        `Failed to submit vote: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  };

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
            <Header title={activePoll?.title || 'Snack Voting'} />
            <HamburgerMenu
              showDiagnostics={isDev()}
              isDiagnosticsVisible={showDiagnostics}
              onToggleDiagnostics={() => setShowDiagnostics(!showDiagnostics)}
              showRefresh={true}
              isLoading={isLoading}
              onRefresh={fetchActivePollWithRetry}
            />
          </div>

          {/* Display loading state */}
          {isLoading && (
            <div className="my-10 text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              <p className="mt-2 text-gray-600">Loading poll data...</p>
            </div>
          )}

          {/* Display fetch error with retry button */}
          {fetchError && !isLoading && (
            <Card className="mb-6 border-red-200 bg-red-50">
              <CardContent className="p-4">
                <div className="text-center">
                  <h3 className="mb-2 text-lg font-semibold text-red-700">
                    Error Loading Poll
                  </h3>
                  <p className="mb-4 text-red-600">{fetchError}</p>
                  <Button
                    onClick={handleRetry}
                    variant="destructive"
                    className="mx-auto"
                    disabled={retryCount >= maxRetries}
                  >
                    Retry
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Display when no active poll is available */}
          {!isLoading && !fetchError && !activePoll && (
            <Card>
              <CardContent className="p-6 text-center">
                <h2 className="mb-2 text-xl font-semibold">
                  No Active Poll Available
                </h2>
                <p className="mb-4 text-gray-600">
                  There is currently no active poll. Please check back later.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Display voting form when poll is available */}
          {!isLoading && !fetchError && activePoll && (
            <div key={formKey}>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Error message display */}
                {formError && (
                  <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
                    {formError}
                  </div>
                )}

                {/* Voter name input */}
                <div className="mb-4">
                  <label
                    htmlFor="voterName"
                    className="mb-2 block font-medium text-gray-700"
                  >
                    Your Name
                  </label>
                  <input
                    type="text"
                    id="voterName"
                    value={voterName}
                    onChange={(e) => setVoterName(e.target.value)}
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-primary"
                    placeholder="Enter your name"
                    required
                  />
                </div>

                {/* Voting section */}
                <div className="space-y-8">
                  {/* If the poll has groups, display each group separately */}
                  {activePoll.groups.length > 0 ? (
                    activePoll.groups.map((group) => (
                      <div key={group.id} className="rounded-lg bg-gray-50 p-4">
                        <h3 className="mb-4 text-lg font-semibold">
                          {group.title}
                        </h3>
                        <div className="space-y-4">
                          {group.pairs.map((pair) => (
                            <Card key={pair.id} className="overflow-hidden">
                              <CardHeader className="bg-gray-100 py-3">
                                <h4 className="text-sm font-medium">
                                  Select one option:
                                </h4>
                              </CardHeader>
                              <CardContent className="p-4">
                                <ToggleGroup
                                  type="single"
                                  value={votes[pair.id] || ''}
                                  onValueChange={(value) =>
                                    handleChange(pair.id, value)
                                  }
                                  className="flex flex-col space-y-2"
                                >
                                  <ToggleGroupItem
                                    value={pair.optionA}
                                    className="justify-start px-4 py-2 text-left"
                                  >
                                    {pair.optionA}
                                  </ToggleGroupItem>
                                  <ToggleGroupItem
                                    value={pair.optionB}
                                    className="justify-start px-4 py-2 text-left"
                                  >
                                    {pair.optionB}
                                  </ToggleGroupItem>
                                </ToggleGroup>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    ))
                  ) : (
                    // For backward compatibility - display pairs without groups
                    <div className="space-y-4">
                      {pairs.map((pair) => (
                        <Card key={pair.id} className="overflow-hidden">
                          <CardHeader className="bg-gray-100 py-3">
                            <h4 className="text-sm font-medium">
                              Select one option:
                            </h4>
                          </CardHeader>
                          <CardContent className="p-4">
                            <ToggleGroup
                              type="single"
                              value={votes[pair.id] || ''}
                              onValueChange={(value) =>
                                handleChange(pair.id, value)
                              }
                              className="flex flex-col space-y-2"
                            >
                              <ToggleGroupItem
                                value={pair.optionA}
                                className="justify-start px-4 py-2 text-left"
                              >
                                {pair.optionA}
                              </ToggleGroupItem>
                              <ToggleGroupItem
                                value={pair.optionB}
                                className="justify-start px-4 py-2 text-left"
                              >
                                {pair.optionB}
                              </ToggleGroupItem>
                            </ToggleGroup>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>

                {/* Submit button */}
                <div className="mt-6 text-center">
                  <Button type="submit" className="w-full sm:w-auto" size="lg">
                    Submit Vote
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Success Modal */}
          {showSuccessModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
              <div className="w-11/12 max-w-md rounded-lg bg-white p-6 shadow-xl">
                <h2 className="mb-4 text-center text-2xl font-bold text-green-600">
                  Thank You!
                </h2>
                <p className="mb-6 text-center text-lg">
                  {completedVoterName}, your vote has been recorded
                  successfully.
                </p>
                <div className="flex justify-center">
                  <Button
                    onClick={() => setShowSuccessModal(false)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Close
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Show diagnostics in development mode */}
          {isDev() && showDiagnostics && (
            <div className="mt-8 rounded-md border border-gray-300 bg-gray-50 p-4">
              <h3 className="mb-2 font-semibold">Debug Info:</h3>
              <pre className="overflow-x-auto text-xs">
                {JSON.stringify(
                  {
                    activePoll: activePoll
                      ? {
                          id: activePoll.id,
                          title: activePoll.title,
                          isActive: activePoll.isActive,
                          isClosed: activePoll.isClosed,
                          groupsCount: activePoll.groups.length,
                          pairsCount: activePoll.pairs.length,
                        }
                      : null,
                    votes,
                    retryCount,
                    formKey,
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

          {/* Debug button - only in development */}
          {isDev() && !showDiagnostics && (
            <div className="mt-4 text-center">
              <button
                onClick={() => setShowDiagnostics(true)}
                className="text-xs text-gray-400 hover:text-gray-600"
              >
                Show Debug Info
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Toaster for notifications */}
      <Toaster position="bottom-center" />
    </>
  );
}
