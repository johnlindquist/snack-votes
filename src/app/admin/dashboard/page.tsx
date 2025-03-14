'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Header } from '@/components/ui/header';
import { Textarea } from '@/components/ui/textarea';

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
  const router = useRouter();
  const [pairs, setPairs] = useState<Pair[]>([]);
  const [voters, setVoters] = useState<Voter[]>([]);
  const [optionA, setOptionA] = useState('');
  const [optionB, setOptionB] = useState('');
  const [bulkPairsText, setBulkPairsText] = useState('');
  const [bulkImportError, setBulkImportError] = useState('');

  const handleSignOut = useCallback(() => {
    sessionStorage.removeItem('adminSession');
    router.push('/admin/login');
  }, [router]);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const sessionData = sessionStorage.getItem('adminSession');
        if (!sessionData) {
          handleSignOut();
          return;
        }
        const { authToken } = JSON.parse(sessionData);
        const response = await fetch('/api/admin/auth', {
          method: 'GET',
          headers: {
            Authorization: authToken,
          },
        });
        if (!response.ok) {
          handleSignOut();
        }
      } catch (_error) {
        handleSignOut();
      }
    };
    checkAuth();
  }, [handleSignOut, router]);

  const fetchPairs = async () => {
    const sessionData = sessionStorage.getItem('adminSession');
    if (!sessionData) return;
    const { authToken } = JSON.parse(sessionData);
    const res = await fetch('/api/admin/pairs', {
      headers: { Authorization: authToken },
    });
    const data = await res.json();
    setPairs(data);
  };

  const fetchVoters = async () => {
    const sessionData = sessionStorage.getItem('adminSession');
    if (!sessionData) return;
    const { authToken } = JSON.parse(sessionData);
    const res = await fetch('/api/admin/voters', {
      headers: { Authorization: authToken },
    });
    const data = await res.json();
    setVoters(data);
  };

  const handleAddPair = async (e: React.FormEvent) => {
    e.preventDefault();
    const sessionData = sessionStorage.getItem('adminSession');
    if (!sessionData) return;
    const { authToken } = JSON.parse(sessionData);
    await fetch('/api/admin/pairs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authToken,
      },
      body: JSON.stringify({ optionA, optionB }),
    });
    setOptionA('');
    setOptionB('');
    fetchPairs();
  };

  const handleDeleteVoter = async (voterId: number) => {
    if (
      !confirm(
        'Are you sure you want to delete this voter and all their votes?',
      )
    ) {
      return;
    }

    const sessionData = sessionStorage.getItem('adminSession');
    if (!sessionData) return;
    const { authToken } = JSON.parse(sessionData);
    const res = await fetch(`/api/admin/voters/${voterId}`, {
      method: 'DELETE',
      headers: { Authorization: authToken },
    });

    if (res.ok) {
      fetchVoters();
      fetchPairs(); // Refresh pairs to update vote counts
    } else {
      alert('Failed to delete voter');
    }
  };

  const handleBulkImport = async (e: React.FormEvent) => {
    e.preventDefault();
    setBulkImportError('');

    try {
      const sessionData = sessionStorage.getItem('adminSession');
      if (!sessionData) return;
      const { authToken } = JSON.parse(sessionData);
      const res = await fetch('/api/admin/pairs/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: authToken,
        },
        body: JSON.stringify({ pairsText: bulkPairsText }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to import pairs');
      }

      setBulkPairsText('');
      fetchPairs();
    } catch (error) {
      setBulkImportError(
        error instanceof Error ? error.message : 'Failed to import pairs',
      );
    }
  };

  const handleDeletePair = async (pairId: number) => {
    if (
      !confirm('Are you sure you want to delete this pair and all its votes?')
    ) {
      return;
    }

    const sessionData = sessionStorage.getItem('adminSession');
    if (!sessionData) return;
    const { authToken } = JSON.parse(sessionData);
    const res = await fetch(`/api/admin/pairs/${pairId}`, {
      method: 'DELETE',
      headers: { Authorization: authToken },
    });

    if (res.ok) {
      fetchPairs();
    } else {
      alert('Failed to delete pair');
    }
  };

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
                          Votes for {pair.optionA}:{' '}
                          {
                            pair.votes.filter(
                              (v) => v.selection === pair.optionA,
                            ).length
                          }
                        </p>
                        <p>
                          Votes for {pair.optionB}:{' '}
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
