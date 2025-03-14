'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Header } from '@/components/ui/header';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Toaster, toast } from 'react-hot-toast';
import confetti from 'canvas-confetti';

type Pair = {
  id: number;
  optionA: string;
  optionB: string;
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

  const fetchPairs = useCallback(() => {
    console.log(
      `Fetching pairs from API... (Attempt ${retryCount + 1}/${maxRetries + 1})`,
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
    fetch(`/api/pairs?t=${timestamp}`)
      .then((res) => {
        console.log('API response status:', res.status);
        console.log(
          'API response headers:',
          Object.fromEntries([...res.headers.entries()]),
        );

        if (!res.ok) {
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

        console.log('API data received:', data);
        console.log('Data type:', typeof data);
        console.log('Is array?', Array.isArray(data));
        console.log('Data length:', data?.length);

        if (!data || !Array.isArray(data)) {
          console.error('Invalid data format received:', data);
          setFetchError('Invalid data format received from API');
          return;
        }

        if (data.length === 0) {
          console.warn('Empty pairs array received from API');
        }

        setPairs(data);
        setIsLoading(false);
        setRetryCount(0); // Reset retry count on success
      })
      .catch((err) => {
        // Clear the timeout since we got an error
        clearTimeout(fetchTimeout);

        console.error('Error fetching pairs:', err);
        console.error('Error details:', err.message);
        setFetchError(`Failed to fetch pairs: ${err.message}`);
        setIsLoading(false);
      });

    // Cleanup function to clear the timeout if the component unmounts
    return () => clearTimeout(fetchTimeout);
  }, [retryCount]);

  // Initial fetch on component mount
  useEffect(() => {
    console.log('VotePage component mounted');
    console.log('Environment:', process.env.NODE_ENV);
    fetchPairs();
  }, [fetchPairs]);

  // Retry logic
  const handleRetry = () => {
    if (retryCount < maxRetries) {
      setRetryCount((prev) => prev + 1);
      fetchPairs();
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

    // Validate voter name
    if (!voterName.trim()) {
      setFormError('Please enter your name');
      return;
    }

    // Check if all pairs have been voted on
    const unvotedPairs = pairs.filter((pair) => !votes[pair.id]);
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
      toast.error('There was an error submitting your votes.', {
        duration: 4000,
        style: {
          background: '#fee2e2',
          color: '#991b1b',
          padding: '16px',
          borderRadius: '8px',
        },
      });
      setFormError('There was an error submitting your votes.');
    }
  };

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
              <h2 className="text-3xl font-bold text-purple-800">
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

      <div className={showSuccessModal ? 'pointer-events-none opacity-50' : ''}>
        <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
          <Header title="Vote for Your Favorite Snacks" />

          {/* Debug button - only visible in development or when there's an error */}
          {(isDev() || fetchError) && (
            <div className="mb-4 text-right">
              <button
                type="button"
                onClick={() => setShowDiagnostics(!showDiagnostics)}
                className="rounded bg-gray-200 px-3 py-1 text-xs text-gray-700 hover:bg-gray-300"
              >
                {showDiagnostics ? 'Hide' : 'Show'} Diagnostics
              </button>
            </div>
          )}

          {/* Refresh button - always visible */}
          <div className="mb-4 text-right">
            <button
              type="button"
              onClick={() => fetchPairs()}
              className="rounded bg-blue-100 px-3 py-1 text-xs text-blue-700 hover:bg-blue-200"
              disabled={isLoading}
            >
              {isLoading ? 'Refreshing...' : 'Refresh Snacks'}
            </button>
          </div>

          {/* Diagnostic information */}
          {showDiagnostics && (
            <div className="mb-6 overflow-auto rounded-lg border border-gray-200 bg-gray-50 p-4 text-xs">
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
                  ? `${window.location.origin}/api/pairs`
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
                        className="text-blue-600 hover:underline"
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
            <div className="my-8 text-center">
              <p className="text-lg font-medium text-slate-700">
                Loading snack pairs...
              </p>
            </div>
          )}

          {fetchError && (
            <div className="my-8 rounded-lg bg-red-50 p-4 text-center">
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
                  className="mt-4 rounded-md bg-red-100 px-4 py-2 text-sm font-medium text-red-800 hover:bg-red-200"
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
            <div className="my-8 rounded-lg bg-yellow-50 p-4 text-center">
              <p className="text-lg font-medium text-yellow-700">
                No snack pairs available
              </p>
              <p className="mt-2 text-sm text-yellow-600">
                Please check back later when voting options are available.
              </p>
            </div>
          )}

          {!isLoading && !fetchError && pairs.length > 0 && (
            <form key={formKey} onSubmit={handleSubmit} className="space-y-8">
              {pairs.map((pair, index) => (
                <Card key={pair.id}>
                  <CardHeader>
                    <p className="text-center font-medium text-slate-700">
                      <span className="mr-2 inline-block rounded-full bg-purple-100 px-3 py-1 text-sm text-purple-800">
                        {index + 1}/{pairs.length}
                      </span>
                      Pick your favorite snack!
                    </p>
                  </CardHeader>

                  <CardContent>
                    <ToggleGroup
                      type="single"
                      value={votes[pair.id]}
                      onValueChange={(value) =>
                        value && handleChange(pair.id, value)
                      }
                      className="mx-auto grid w-full max-w-2xl grid-cols-1 gap-4 sm:grid-cols-2"
                    >
                      <ToggleGroupItem
                        value={pair.optionA}
                        className="h-16 w-full rounded-lg border-2 text-lg font-medium transition-all hover:bg-purple-50 data-[state=on]:border-transparent data-[state=on]:bg-gradient-to-r data-[state=on]:from-purple-600 data-[state=on]:to-indigo-600 data-[state=on]:text-white"
                      >
                        {pair.optionA}
                      </ToggleGroupItem>
                      <ToggleGroupItem
                        value={pair.optionB}
                        className="h-16 w-full rounded-lg border-2 text-lg font-medium transition-all hover:bg-purple-50 data-[state=on]:border-transparent data-[state=on]:bg-gradient-to-r data-[state=on]:from-purple-600 data-[state=on]:to-indigo-600 data-[state=on]:text-white"
                      >
                        {pair.optionB}
                      </ToggleGroupItem>
                    </ToggleGroup>
                  </CardContent>
                </Card>
              ))}

              <Card>
                <CardContent className="pt-6">
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
                      className="w-full rounded-lg border border-slate-200 p-3 shadow-sm outline-none focus:border-transparent focus:ring-2 focus:ring-purple-500"
                      required
                      placeholder="Enter your name"
                    />
                  </div>
                </CardContent>
              </Card>

              {formError && (
                <div className="text-center font-medium text-red-600">
                  {formError}
                </div>
              )}

              <div className="pt-8 text-center">
                <Button
                  type="submit"
                  size="lg"
                  className="rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 px-10 py-6 text-lg font-medium shadow-lg transition-all hover:from-purple-700 hover:to-indigo-700 hover:shadow-xl"
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
