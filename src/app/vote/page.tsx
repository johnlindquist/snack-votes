'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Header } from '@/components/ui/header';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { HamburgerMenu } from '@/components/ui/hamburger-menu';
import { Toaster, toast } from 'react-hot-toast';
import confetti from 'canvas-confetti';
import Link from 'next/link';

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
  const [activePoll, setActivePoll] = useState<Poll | null>(null);
  const [pairs, setPairs] = useState<Pair[]>([]);
  const [votes, setVotes] = useState<{ [key: number]: string }>({});
  const [voterName, setVoterName] = useState('');
  const [formError, setFormError] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [completedVoterName, setCompletedVoterName] = useState('');
  const [formKey, setFormKey] = useState(Date.now());
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  // Function to check if we're in a development environment
  const isDev = () => {
    return process.env.NODE_ENV === 'development';
  };

  const fetchActivePoll = useCallback(() => {
    console.log(
      `Fetching active poll from API... (Attempt ${retryCount + 1}/${maxRetries + 1})`,
    );
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
    fetch(`/api/polls/active?t=${timestamp}`)
      .then((res) => {
        console.log('API response status:', res.status);
        console.log(
          'API response headers:',
          Object.fromEntries([...res.headers.entries()]),
        );

        if (!res.ok) {
          if (res.status === 404) {
            console.log('No active poll found');
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

        return res.json();
      })
      .then((data) => {
        // Clear the timeout since we got a response
        clearTimeout(fetchTimeout);

        if (!data) return;

        console.log('API data received:', data);
        console.log('Data type:', typeof data);

        setActivePoll(data);
        setPairs(data.pairs || []);
        setIsLoading(false);
        setRetryCount(0); // Reset retry count on success
      })
      .catch((err) => {
        // Clear the timeout since we got an error
        clearTimeout(fetchTimeout);

        console.error('Error fetching active poll:', err);
        console.error('Error details:', err.message);
        setFetchError(`Failed to fetch active poll: ${err.message}`);
        setIsLoading(false);
      });

    // Cleanup function to clear the timeout if the component unmounts
    return () => clearTimeout(fetchTimeout);
  }, [retryCount]);

  // Initial fetch on component mount
  useEffect(() => {
    console.log('VotePage component mounted');
    console.log('Environment:', process.env.NODE_ENV);
    fetchActivePoll();
  }, [fetchActivePoll]);

  // Retry logic
  const handleRetry = () => {
    if (retryCount < maxRetries) {
      setRetryCount((prev) => prev + 1);
      fetchActivePoll();
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
      setFormError('Please vote on all pairs before submitting!');
      return;
    }

    // Build vote objects
    const voteArray = Object.keys(votes).map((pairId) => ({
      pairId: Number(pairId),
      selection: votes[Number(pairId)],
    }));

    const response = await fetch('/api/vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        votes: voteArray,
        voterName: voterName.trim(),
        pollId: activePoll.id,
      }),
    });

    if (response.ok) {
      setVotes({});
      setFormKey(Date.now());

      setCompletedVoterName(voterName);
      setShowSuccessModal(true);
      triggerConfetti();

      setTimeout(() => {
        setVoterName('');
        setFormError('');
        setShowSuccessModal(false);
        setCompletedVoterName('');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 3000);
    } else {
      const errorData = await response.json();
      toast.error(
        errorData.error || 'There was an error submitting your votes.',
        {
          duration: 4000,
          style: {
            background: '#fee2e2',
            color: '#991b1b',
            padding: '16px',
            borderRadius: '8px',
          },
        },
      );
      setFormError(
        errorData.error || 'There was an error submitting your votes.',
      );
    }
  };

  // If there's no active poll
  if (!isLoading && !activePoll) {
    return (
      <>
        <Header />
        <div className="container mx-auto px-4 py-12">
          <div className="mx-auto max-w-md text-center">
            <h2 className="mb-4 text-2xl font-bold">No Active Poll</h2>
            <p className="mb-6 text-gray-600">
              There is no active poll available at the moment. Please check back
              later.
            </p>
          </div>
        </div>
      </>
    );
  }

  // If the poll is closed
  if (!isLoading && activePoll && activePoll.isClosed) {
    return (
      <>
        <Header />
        <div className="container mx-auto px-4 py-12">
          <div className="mx-auto max-w-md text-center">
            <h2 className="mb-4 text-2xl font-bold">{activePoll.title}</h2>
            <p className="mb-6 text-gray-600">
              This poll is now closed. Thank you for your interest!
            </p>
            <Link href={`/poll/${activePoll.id}`}>
              <Button>View Results</Button>
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Toaster />
      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div className="relative mx-4 w-full max-w-md scale-100 transform rounded-2xl bg-white p-8 shadow-2xl duration-300 animate-in fade-in zoom-in">
            <div className="space-y-4 text-center">
              <div className="text-6xl">🎉</div>
              <h2 className="text-3xl font-bold text-primary">
                Thanks for voting!
              </h2>
              <p className="text-xl text-gray-600">
                We appreciate your input, {completedVoterName}!
              </p>
              <p className="mt-4 text-sm text-gray-500">
                The form will reset in a moment...
              </p>
            </div>
          </div>
        </div>
      )}

      <div
        className={`min-h-screen bg-gray-50 ${showSuccessModal ? 'pointer-events-none opacity-50' : ''}`}
      >
        <div className="relative mx-auto max-w-3xl px-4 py-8 sm:px-6">
          <HamburgerMenu
            showAdminLink={true}
            showRefresh={true}
            showDiagnostics={isDev() || !!fetchError}
            isDiagnosticsVisible={showDiagnostics}
            isLoading={isLoading}
            onRefresh={fetchActivePoll}
            onToggleDiagnostics={() => setShowDiagnostics(!showDiagnostics)}
          />

          <div className="mb-10">
            <Header title="Vote for Your Favorite Snacks" />
          </div>

          {/* Diagnostic information */}
          {showDiagnostics && (
            <div className="mb-8 overflow-auto rounded-lg border border-gray-200 bg-gray-50 p-4 text-xs">
              <h3 className="mb-2 font-bold">Diagnostic Information:</h3>
              <p>
                <strong>Environment:</strong> {process.env.NODE_ENV}
              </p>
              <p>
                <strong>Base URL:</strong>{' '}
                {typeof window !== 'undefined' ? window.location.origin : 'N/A'}
              </p>
              <p>
                <strong>API URL:</strong>{' '}
                {typeof window !== 'undefined'
                  ? `${window.location.origin}/api/polls/active`
                  : 'N/A'}
              </p>

              {/* Debug links - only in development */}
              {isDev() && (
                <div className="mt-2">
                  <p>
                    <strong>Debug Tools:</strong>
                  </p>
                  <ul className="mt-1 list-inside list-disc">
                    <li>
                      <a
                        href="/api/debug/db"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-secondary hover:underline"
                      >
                        Test Database Connection
                      </a>
                    </li>
                  </ul>
                </div>
              )}

              <p className="mt-2">
                <strong>Public Environment Variables:</strong>
              </p>
              <pre className="mt-1 max-h-40 overflow-auto rounded bg-gray-100 p-2">
                {JSON.stringify(
                  Object.keys(process.env)
                    .filter((key) => key.startsWith('NEXT_PUBLIC_'))
                    .reduce((obj: Record<string, string>, key) => {
                      obj[key] = process.env[key] as string;
                      return obj;
                    }, {}),
                  null,
                  2,
                )}
              </pre>
            </div>
          )}

          {isLoading && (
            <div className="my-12 flex items-center justify-center">
              <div className="rounded-lg bg-white p-8 shadow-md">
                <div className="flex flex-col items-center">
                  <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
                  <p className="mt-4 text-lg font-medium text-slate-700">
                    Loading snack pairs...
                  </p>
                </div>
              </div>
            </div>
          )}

          {fetchError && (
            <div className="my-8 rounded-lg bg-red-50 p-6 text-center shadow-sm">
              <p className="text-lg font-medium text-red-700">
                Error: {fetchError}
              </p>
              <p className="mt-2 text-sm text-red-600">
                Please try refreshing the page or contact support if the issue
                persists.
              </p>

              {retryCount < maxRetries && (
                <button
                  onClick={handleRetry}
                  className="mt-4 rounded-full bg-red-100 px-6 py-2 text-sm font-medium text-red-800 transition-colors hover:bg-red-200"
                >
                  Retry ({retryCount}/{maxRetries})
                </button>
              )}

              <pre className="mt-4 max-h-40 overflow-auto rounded bg-red-100 p-2 text-xs text-red-800">
                {fetchError}
              </pre>
            </div>
          )}

          {!isLoading && !fetchError && pairs.length === 0 && (
            <div className="my-12 rounded-lg bg-yellow-50 p-8 text-center shadow-sm">
              <p className="text-xl font-medium text-yellow-700">
                No snack pairs available
              </p>
              <p className="mt-2 text-sm text-yellow-600">
                Please check back later when voting options are available.
              </p>
            </div>
          )}

          {!isLoading && !fetchError && pairs.length > 0 && (
            <form key={formKey} onSubmit={handleSubmit} className="space-y-12">
              {activePoll &&
              activePoll.groups &&
              activePoll.groups.length > 0 ? (
                // If we have groups, display pairs by group
                activePoll.groups.map((group) => (
                  <div key={group.id} className="mb-12">
                    <div className="mb-6 flex items-center">
                      <h2 className="text-2xl font-bold text-primary">
                        {group.title}
                      </h2>
                      <div className="from-primary/30 ml-4 h-px flex-1 bg-gradient-to-r to-transparent"></div>
                    </div>
                    <div className="space-y-6">
                      {group.pairs.map((pair) => (
                        <Card
                          key={pair.id}
                          className="hover:border-primary/50 overflow-hidden transition-all hover:shadow-lg"
                        >
                          <CardHeader className="bg-primary/5 py- border-b border-slate-100">
                            <h3 className="text-md font-medium text-primary">
                              Choose One:
                            </h3>
                          </CardHeader>
                          <CardContent>
                            <ToggleGroup
                              type="single"
                              value={votes[pair.id] || ''}
                              onValueChange={(value) =>
                                handleChange(pair.id, value)
                              }
                              className="flex flex-col gap-3 sm:flex-row"
                            >
                              <ToggleGroupItem
                                value={pair.optionA}
                                className="h-auto flex-1 rounded-lg py-4 text-base transition-all"
                              >
                                {pair.optionA}
                              </ToggleGroupItem>
                              <ToggleGroupItem
                                value={pair.optionB}
                                className="h-auto flex-1 rounded-lg py-4 text-base transition-all"
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
                // Fallback to flat list of pairs if no groups
                <div className="space-y-6">
                  {activePoll &&
                    activePoll.pairs.map((pair) => (
                      <Card
                        key={pair.id}
                        className="overflow-hidden transition-all hover:border-primary hover:shadow-lg"
                      >
                        <CardHeader className="bg-primary/5 border-b border-slate-100 py-4">
                          <h3 className="text-sm font-medium text-primary">
                            Choose One:
                          </h3>
                        </CardHeader>
                        <CardContent className="pb-4 pt-6">
                          <ToggleGroup
                            type="single"
                            value={votes[pair.id] || ''}
                            onValueChange={(value) =>
                              handleChange(pair.id, value)
                            }
                            className="flex flex-col gap-3 sm:flex-row"
                          >
                            <ToggleGroupItem
                              value={pair.optionA}
                              className="h-auto flex-1 rounded-lg py-4 text-base transition-all"
                            >
                              {pair.optionA}
                            </ToggleGroupItem>
                            <ToggleGroupItem
                              value={pair.optionB}
                              className="h-auto flex-1 rounded-lg py-4 text-base transition-all"
                            >
                              {pair.optionB}
                            </ToggleGroupItem>
                          </ToggleGroup>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              )}

              <Card className="border-secondary-100 shadow-md transition-all hover:shadow-lg">
                <CardContent className="py-6">
                  <div className="space-y-2">
                    <label
                      htmlFor="voterName"
                      className="block text-sm font-medium text-slate-700"
                    >
                      Your Name
                    </label>
                    <input
                      id="voterName"
                      type="text"
                      value={voterName}
                      onChange={(e) => {
                        setVoterName(e.target.value);
                        setFormError('');
                      }}
                      className="w-full rounded-lg border border-slate-200 p-3 shadow-sm outline-none focus:border-transparent focus:ring-2 focus:ring-primary"
                      required
                      placeholder="Enter your name"
                    />
                  </div>
                </CardContent>
              </Card>

              {formError && (
                <div className="rounded-lg border border-red-100 bg-red-50 p-4 text-center shadow-sm">
                  <p className="font-medium text-red-600">{formError}</p>
                </div>
              )}

              <div className="py-6 text-center">
                <Button
                  type="submit"
                  size="lg"
                  className="rounded-full px-10 py-6 text-lg font-medium shadow-md transition-all hover:shadow-lg"
                >
                  Submit Votes
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
