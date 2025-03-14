'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Header } from '@/components/ui/header';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'react-hot-toast';

type Pair = {
  id: number;
  optionA: string;
  optionB: string;
  votes: { selection: string }[];
};

type Vote = {
  id: number;
  selection: string;
  pair: Pair;
};

type Voter = {
  id: number;
  name: string;
  identifier: string;
  votes: Vote[];
  _count: {
    votes: number;
  };
};

export default function Dashboard() {
  console.log('Dashboard component rendering');
  const router = useRouter();
  const [pairs, setPairs] = useState<Pair[]>([]);
  const [voters, setVoters] = useState<Voter[]>([]);
  const [optionA, setOptionA] = useState('');
  const [optionB, setOptionB] = useState('');
  const [bulkPairsText, setBulkPairsText] = useState('');
  const [bulkImportError, setBulkImportError] = useState('');

  const handleSignOut = useCallback(() => {
    console.log('Signing out user');
    sessionStorage.removeItem('adminSession');
    router.push('/admin/login');
  }, [router]);

  useEffect(() => {
    console.log('Running auth check effect');
    const checkAuth = async () => {
      try {
        console.log('Checking authentication');
        const sessionData = sessionStorage.getItem('adminSession');
        console.log('Session data:', sessionData);
        if (!sessionData) {
          console.log('No session data found, signing out');
          handleSignOut();
          return;
        }
        const { authToken } = JSON.parse(sessionData);
        console.log('Auth token found:', authToken);
        const response = await fetch('/api/admin/auth', {
          method: 'GET',
          headers: {
            Authorization: authToken,
          },
        });
        console.log('Auth API response status:', response.status);
        if (!response.ok) {
          console.log('Auth API response not OK, signing out');
          handleSignOut();
        } else {
          console.log('Authentication successful');
        }
      } catch (error) {
        console.error('Error during auth check:', error);
        handleSignOut();
      }
    };
    checkAuth();
  }, [handleSignOut, router]);

  useEffect(() => {
    console.log('Running data fetch effect');
    const fetchData = async () => {
      console.log('Fetching data');
      try {
        await Promise.all([fetchPairs(), fetchVoters()]);
        console.log('Data fetch complete');
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchData();
  }, []);

  const fetchPairs = async () => {
    console.log('Fetching pairs');
    const sessionData = sessionStorage.getItem('adminSession');
    if (!sessionData) {
      console.log('No session data found when fetching pairs');
      return;
    }
    try {
      const { authToken } = JSON.parse(sessionData);
      console.log('Using auth token for pairs fetch:', authToken);
      const res = await fetch('/api/admin/pairs', {
        headers: { Authorization: authToken },
      });
      console.log('Pairs API response status:', res.status);
      if (!res.ok) {
        console.error('Failed to fetch pairs:', res.statusText);
        return;
      }
      const data = await res.json();
      console.log('Pairs data received:', data);
      setPairs(data);
      console.log('Pairs state updated');
    } catch (error) {
      console.error('Error in fetchPairs:', error);
    }
  };

  const fetchVoters = async () => {
    console.log('Fetching voters');
    const sessionData = sessionStorage.getItem('adminSession');
    if (!sessionData) {
      console.log('No session data found when fetching voters');
      return;
    }
    try {
      const { authToken } = JSON.parse(sessionData);
      console.log('Using auth token for voters fetch:', authToken);
      const res = await fetch('/api/admin/voters', {
        headers: { Authorization: authToken },
      });
      console.log('Voters API response status:', res.status);
      if (!res.ok) {
        console.error('Failed to fetch voters:', res.statusText);
        return;
      }
      const data = await res.json();
      console.log('Voters data received:', data);
      setVoters(data);
      console.log('Voters state updated');
    } catch (error) {
      console.error('Error in fetchVoters:', error);
    }
  };

  const handleAddPair = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Adding pair:', { optionA, optionB });
    const sessionData = sessionStorage.getItem('adminSession');
    if (!sessionData) {
      console.log('No session data found when adding pair');
      return;
    }
    try {
      const { authToken } = JSON.parse(sessionData);
      console.log('Using auth token for add pair:', authToken);
      const res = await fetch('/api/admin/pairs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: authToken,
        },
        body: JSON.stringify({ optionA, optionB }),
      });
      console.log('Add pair API response status:', res.status);
      if (!res.ok) {
        console.error('Failed to add pair:', res.statusText);
        return;
      }
      setOptionA('');
      setOptionB('');
      console.log('Pair added successfully, fetching updated pairs');
      fetchPairs();
    } catch (error) {
      console.error('Error in handleAddPair:', error);
    }
  };

  const handleDeleteVoter = async (voterId: number) => {
    console.log('Deleting voter:', voterId);
    if (
      !confirm(
        'Are you sure you want to delete this voter and all their votes?',
      )
    ) {
      console.log('Voter deletion cancelled by user');
      return;
    }

    const sessionData = sessionStorage.getItem('adminSession');
    if (!sessionData) {
      console.log('No session data found when deleting voter');
      return;
    }
    try {
      const { authToken } = JSON.parse(sessionData);
      console.log('Using auth token for delete voter:', authToken);
      const res = await fetch(`/api/admin/voters/${voterId}`, {
        method: 'DELETE',
        headers: { Authorization: authToken },
      });
      console.log('Delete voter API response status:', res.status);

      if (res.ok) {
        console.log('Voter deleted successfully, refreshing data');
        fetchVoters();
        fetchPairs(); // Refresh pairs to update vote counts
      } else {
        console.error('Failed to delete voter:', res.statusText);
        toast.error('Failed to delete voter');
      }
    } catch (error) {
      console.error('Error in handleDeleteVoter:', error);
    }
  };

  const handleBulkImport = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Bulk importing pairs');
    setBulkImportError('');

    try {
      const sessionData = sessionStorage.getItem('adminSession');
      if (!sessionData) {
        console.log('No session data found when bulk importing');
        return;
      }
      const { authToken } = JSON.parse(sessionData);
      console.log('Using auth token for bulk import:', authToken);
      console.log('Bulk import text:', bulkPairsText);
      const res = await fetch('/api/admin/pairs/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: authToken,
        },
        body: JSON.stringify({ pairsText: bulkPairsText }),
      });
      console.log('Bulk import API response status:', res.status);

      if (!res.ok) {
        const error = await res.json();
        console.error('Bulk import failed:', error);
        throw new Error(error.error || 'Failed to import pairs');
      }

      console.log('Bulk import successful');
      setBulkPairsText('');
      fetchPairs();
    } catch (error) {
      console.error('Error in handleBulkImport:', error);
      setBulkImportError(
        error instanceof Error ? error.message : 'Failed to import pairs',
      );
    }
  };

  const handleDeletePair = async (pairId: number) => {
    console.log('Deleting pair:', pairId);
    if (
      !confirm('Are you sure you want to delete this pair and all its votes?')
    ) {
      console.log('Pair deletion cancelled by user');
      return;
    }

    const sessionData = sessionStorage.getItem('adminSession');
    if (!sessionData) {
      console.log('No session data found when deleting pair');
      return;
    }
    try {
      const { authToken } = JSON.parse(sessionData);
      console.log('Using auth token for delete pair:', authToken);
      const res = await fetch(`/api/admin/pairs/${pairId}`, {
        method: 'DELETE',
        headers: { Authorization: authToken },
      });
      console.log('Delete pair API response status:', res.status);

      if (res.ok) {
        console.log('Pair deleted successfully, refreshing pairs');
        fetchPairs();
      } else {
        console.error('Failed to delete pair:', res.statusText);
        toast.error('Failed to delete pair');
      }
    } catch (error) {
      console.error('Error in handleDeletePair:', error);
    }
  };

  console.log('Current state - pairs:', pairs.length, 'voters:', voters.length);

  return (
    <div className="mx-auto max-w-6xl p-4">
      <Header
        title="Admin Dashboard"
        showAdminLink={false}
        showHomeLink={true}
        showSignOut={true}
        onSignOut={handleSignOut}
      />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <section>
          <Card className="mb-8">
            <CardContent>
              <h2 className="mb-4 text-xl font-medium">Bulk Import Pairs</h2>
              <form onSubmit={handleBulkImport}>
                <div className="mb-4">
                  <p className="mb-2 text-sm text-gray-600">
                    Enter pairs of options, one option per line. Separate
                    different pairs with a blank line.
                  </p>
                  <Textarea
                    value={bulkPairsText}
                    onChange={(e) => setBulkPairsText(e.target.value)}
                    placeholder="Option A\nOption B\n\nOption C\nOption D"
                    className="min-h-[200px] font-mono"
                    required
                  />
                </div>
                {bulkImportError && (
                  <div className="mb-4 text-sm text-red-600">
                    {bulkImportError}
                  </div>
                )}
                <Button type="submit">Import Pairs</Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <h2 className="mb-4 text-xl font-medium">Add a Single Pair</h2>
              <form onSubmit={handleAddPair}>
                <div className="mb-2">
                  <input
                    type="text"
                    placeholder="Option A"
                    value={optionA}
                    onChange={(e) => setOptionA(e.target.value)}
                    className="w-full rounded border p-2"
                    required
                  />
                </div>
                <div className="mb-2">
                  <input
                    type="text"
                    placeholder="Option B"
                    value={optionB}
                    onChange={(e) => setOptionB(e.target.value)}
                    className="w-full rounded border p-2"
                    required
                  />
                </div>
                <Button type="submit">Add Pair</Button>
              </form>
            </CardContent>
          </Card>

          <Card className="mt-8">
            <CardContent>
              <h2 className="mb-4 text-xl font-medium">
                Current Pairs and Votes
              </h2>
              <div className="space-y-4">
                {pairs.map((pair) => (
                  <div key={pair.id} className="rounded border p-4">
                    <div className="mb-2 flex items-start justify-between">
                      <div>
                        <p className="font-medium">
                          {pair.optionA} vs {pair.optionB}
                        </p>
                        <p>
                          {pair.optionA}:{' '}
                          {
                            pair.votes.filter(
                              (v) => v.selection === pair.optionA,
                            ).length
                          }
                        </p>
                        <p>
                          {pair.optionB}:{' '}
                          {
                            pair.votes.filter(
                              (v) => v.selection === pair.optionB,
                            ).length
                          }
                        </p>
                      </div>
                      <Button
                        variant="destructive"
                        onClick={() => handleDeletePair(pair.id)}
                        size="sm"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        <section>
          <Card>
            <CardContent>
              <h2 className="mb-4 text-xl font-medium">Voters</h2>
              <div className="space-y-4">
                {voters.map((voter) => (
                  <div key={voter.id} className="rounded border p-4">
                    <div className="mb-2 flex items-start justify-between">
                      <div>
                        <p className="font-medium">Voter ID: {voter.id}</p>
                        <p className="text-sm text-gray-600">
                          Name: {voter.name}
                        </p>
                        <p className="text-sm text-gray-600">
                          Identifier: {voter.identifier}
                        </p>
                      </div>
                      <Button
                        variant="destructive"
                        onClick={() => handleDeleteVoter(voter.id)}
                      >
                        Delete
                      </Button>
                    </div>
                    <div className="mt-2">
                      <p className="mb-1 text-sm font-medium">Vote History:</p>
                      <ul className="space-y-1 text-sm">
                        {voter.votes.map((vote) => (
                          <li key={vote.id}>
                            Voted for {vote.selection} in "{vote.pair.optionA}{' '}
                            vs {vote.pair.optionB}"
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
