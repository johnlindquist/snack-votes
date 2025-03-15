'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Header } from '@/components/ui/header';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'react-hot-toast';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type Poll = {
  id: number;
  title: string;
  isActive: boolean;
  isClosed: boolean;
  createdAt: string;
  _count: {
    pairs: number;
    voters: number;
    groups?: number;
  };
};

type Group = {
  id: number;
  title: string;
  pollId: number;
  pairs: Pair[];
  _count?: {
    pairs: number;
  };
};

type Pair = {
  id: number;
  optionA: string;
  optionB: string;
  pollId: number;
  groupId?: number;
  group?: Group;
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
  const [polls, setPolls] = useState<Poll[]>([]);
  const [pairs, setPairs] = useState<Pair[]>([]);
  const [voters, setVoters] = useState<Voter[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [optionA, setOptionA] = useState('');
  const [optionB, setOptionB] = useState('');
  const [pollTitle, setPollTitle] = useState('');
  const [groupTitle, setGroupTitle] = useState('');
  const [selectedPollId, setSelectedPollId] = useState<number | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
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
        await Promise.all([fetchPolls(), fetchPairs(), fetchVoters()]);
        console.log('Data fetch complete');
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchData();
  }, []);

  const fetchPolls = async () => {
    console.log('Fetching polls');
    const sessionData = sessionStorage.getItem('adminSession');
    if (!sessionData) {
      console.log('No session data found when fetching polls');
      return;
    }
    try {
      const { authToken } = JSON.parse(sessionData);
      console.log('Using auth token for polls fetch:', authToken);
      const timestamp = new Date().getTime();
      const res = await fetch(`/api/admin/polls?t=${timestamp}`, {
        headers: {
          Authorization: authToken,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
          'X-Cache-Bust': timestamp.toString(),
        },
      });
      console.log('Polls API response status:', res.status);
      if (!res.ok) {
        console.error('Failed to fetch polls:', res.statusText);
        return;
      }
      const data = await res.json();
      console.log('Polls data received:', data);
      setPolls(data);
      console.log('Polls state updated');
    } catch (error) {
      console.error('Error in fetchPolls:', error);
    }
  };

  const fetchPairs = async (pollId?: number, groupId?: number) => {
    console.log(
      'Fetching pairs',
      pollId ? `for poll ${pollId}` : '',
      groupId ? `for group ${groupId}` : '',
    );
    const sessionData = sessionStorage.getItem('adminSession');
    if (!sessionData) {
      console.log('No session data found when fetching pairs');
      return;
    }
    try {
      const { authToken } = JSON.parse(sessionData);
      console.log('Using auth token for pairs fetch:', authToken);

      let url = '/api/admin/pairs';
      const params = new URLSearchParams();

      if (pollId) {
        params.append('pollId', pollId.toString());
      }

      if (groupId) {
        params.append('groupId', groupId.toString());
      }

      // Add cache-busting parameter
      const timestamp = new Date().getTime();
      params.append('t', timestamp.toString());

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const res = await fetch(url, {
        headers: {
          Authorization: authToken,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
          'X-Cache-Bust': timestamp.toString(),
        },
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
      const timestamp = new Date().getTime();
      const res = await fetch(`/api/admin/voters?t=${timestamp}`, {
        headers: {
          Authorization: authToken,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
          'X-Cache-Bust': timestamp.toString(),
        },
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

  const fetchGroups = async (pollId: number) => {
    console.log(`Fetching groups for poll ${pollId}`);
    const sessionData = sessionStorage.getItem('adminSession');
    if (!sessionData) {
      console.log('No session data found when fetching groups');
      return;
    }
    try {
      const { authToken } = JSON.parse(sessionData);
      console.log('Using auth token for groups fetch:', authToken);
      const timestamp = new Date().getTime();
      const res = await fetch(
        `/api/admin/polls/${pollId}/groups?t=${timestamp}`,
        {
          headers: {
            Authorization: authToken,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            Pragma: 'no-cache',
            Expires: '0',
            'X-Cache-Bust': timestamp.toString(),
          },
        },
      );
      console.log('Groups API response status:', res.status);
      if (!res.ok) {
        console.error('Failed to fetch groups:', res.statusText);
        return;
      }
      const data = await res.json();
      console.log('Groups data received:', data);
      setGroups(data);
      console.log('Groups state updated');
    } catch (error) {
      console.error('Error in fetchGroups:', error);
    }
  };

  const handleCreatePoll = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Creating poll:', { title: pollTitle });
    const sessionData = sessionStorage.getItem('adminSession');
    if (!sessionData) {
      console.log('No session data found when creating poll');
      return;
    }
    try {
      const { authToken } = JSON.parse(sessionData);
      console.log('Using auth token for create poll:', authToken);
      const res = await fetch('/api/admin/polls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: authToken,
        },
        body: JSON.stringify({ title: pollTitle }),
      });
      console.log('Create poll API response status:', res.status);
      if (!res.ok) {
        console.error('Failed to create poll:', res.statusText);
        toast.error('Failed to create poll');
        return;
      }
      setPollTitle('');
      console.log('Poll created successfully, fetching updated polls');
      fetchPolls();
      toast.success('Poll created successfully');
    } catch (error) {
      console.error('Error in handleCreatePoll:', error);
      toast.error('Error creating poll');
    }
  };

  const handleActivatePoll = async (pollId: number) => {
    console.log('Activating poll:', pollId);
    const sessionData = sessionStorage.getItem('adminSession');
    if (!sessionData) {
      console.log('No session data found when activating poll');
      return;
    }
    try {
      const { authToken } = JSON.parse(sessionData);
      console.log('Using auth token for activate poll:', authToken);
      const timestamp = new Date().getTime();
      const res = await fetch(
        `/api/admin/polls/${pollId}/activate?t=${timestamp}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: authToken,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            Pragma: 'no-cache',
            Expires: '0',
            'X-Cache-Bust': timestamp.toString(),
          },
        },
      );
      console.log('Activate poll API response status:', res.status);

      if (res.ok) {
        console.log('Poll activated successfully, refreshing data');
        fetchPolls();
        toast.success('Poll activated successfully');
      } else {
        console.error('Failed to activate poll:', res.statusText);
        toast.error('Failed to activate poll');
      }
    } catch (error) {
      console.error('Error in handleActivatePoll:', error);
      toast.error('Error activating poll');
    }
  };

  const handleClosePoll = async (pollId: number) => {
    console.log('Closing poll:', pollId);
    if (
      !confirm(
        'Are you sure you want to close this poll? This will prevent any new votes from being cast.',
      )
    ) {
      console.log('Poll closure cancelled by user');
      return;
    }

    const sessionData = sessionStorage.getItem('adminSession');
    if (!sessionData) {
      console.log('No session data found when closing poll');
      return;
    }
    try {
      const { authToken } = JSON.parse(sessionData);
      console.log('Using auth token for close poll:', authToken);
      const timestamp = new Date().getTime();
      const res = await fetch(
        `/api/admin/polls/${pollId}/close?t=${timestamp}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: authToken,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            Pragma: 'no-cache',
            Expires: '0',
            'X-Cache-Bust': timestamp.toString(),
          },
        },
      );
      console.log('Close poll API response status:', res.status);

      if (res.ok) {
        console.log('Poll closed successfully, refreshing data');
        fetchPolls();
        toast.success('Poll closed successfully');
      } else {
        console.error('Failed to close poll:', res.statusText);
        toast.error('Failed to close poll');
      }
    } catch (error) {
      console.error('Error in handleClosePoll:', error);
      toast.error('Error closing poll');
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Creating group:', {
      title: groupTitle,
      pollId: selectedPollId,
    });
    if (!selectedPollId) {
      toast.error('Please select a poll first');
      return;
    }

    const sessionData = sessionStorage.getItem('adminSession');
    if (!sessionData) {
      console.log('No session data found when creating group');
      return;
    }
    try {
      const { authToken } = JSON.parse(sessionData);
      console.log('Using auth token for create group:', authToken);
      const res = await fetch(`/api/admin/polls/${selectedPollId}/groups`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: authToken,
        },
        body: JSON.stringify({ title: groupTitle }),
      });
      console.log('Create group API response status:', res.status);
      if (!res.ok) {
        console.error('Failed to create group:', res.statusText);
        toast.error('Failed to create group');
        return;
      }
      setGroupTitle('');
      console.log('Group created successfully, fetching updated groups');
      fetchGroups(selectedPollId);
      toast.success('Group created successfully');
    } catch (error) {
      console.error('Error in handleCreateGroup:', error);
      toast.error('Error creating group');
    }
  };

  const handleAddPair = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Adding pair:', {
      optionA,
      optionB,
      pollId: selectedPollId,
      groupId: selectedGroupId,
    });

    if (!selectedPollId) {
      toast.error('Please select a poll first');
      return;
    }

    const sessionData = sessionStorage.getItem('adminSession');
    if (!sessionData) {
      console.log('No session data found when adding pair');
      return;
    }

    try {
      const { authToken } = JSON.parse(sessionData);
      console.log('Using auth token for add pair:', authToken);

      // Prepare request body
      const requestBody: {
        optionA: string;
        optionB: string;
        pollId: number;
        groupId?: number;
      } = {
        optionA,
        optionB,
        pollId: selectedPollId,
      };

      // Add groupId if selected
      if (selectedGroupId) {
        requestBody.groupId = selectedGroupId;
      }

      const res = await fetch('/api/admin/pairs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: authToken,
        },
        body: JSON.stringify(requestBody),
      });

      console.log('Add pair API response status:', res.status);
      if (!res.ok) {
        console.error('Failed to add pair:', res.statusText);
        toast.error('Failed to add pair');
        return;
      }

      setOptionA('');
      setOptionB('');
      console.log('Pair added successfully, fetching updated pairs');

      // Fetch pairs based on what's selected
      if (selectedGroupId) {
        fetchPairs(undefined, selectedGroupId);
      } else {
        fetchPairs(selectedPollId);
      }

      toast.success('Pair added successfully');
    } catch (error) {
      console.error('Error in handleAddPair:', error);
      toast.error('Error adding pair');
    }
  };

  const handleBulkImport = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Bulk importing pairs:', {
      pollId: selectedPollId,
      groupId: selectedGroupId,
    });

    if (!selectedPollId) {
      setBulkImportError('Please select a poll first');
      return;
    }

    if (!bulkPairsText.trim()) {
      setBulkImportError('Please enter some pairs');
      return;
    }

    const sessionData = sessionStorage.getItem('adminSession');
    if (!sessionData) {
      console.log('No session data found when bulk importing pairs');
      return;
    }

    try {
      const { authToken } = JSON.parse(sessionData);
      console.log('Using auth token for bulk import:', authToken);

      // Prepare request body
      const requestBody: {
        pairsText: string;
        pollId: number;
        groupId?: number;
      } = {
        pairsText: bulkPairsText,
        pollId: selectedPollId,
      };

      // Add groupId if selected
      if (selectedGroupId) {
        requestBody.groupId = selectedGroupId;
      }

      const res = await fetch('/api/admin/pairs/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: authToken,
        },
        body: JSON.stringify(requestBody),
      });

      console.log('Bulk import API response status:', res.status);
      if (!res.ok) {
        const errorData = await res.json();
        console.error('Failed to bulk import pairs:', errorData.error);
        setBulkImportError(errorData.error || 'Failed to bulk import pairs');
        return;
      }

      setBulkPairsText('');
      setBulkImportError('');
      console.log('Pairs bulk imported successfully, fetching updated pairs');

      // Fetch pairs based on what's selected
      if (selectedGroupId) {
        fetchPairs(undefined, selectedGroupId);
      } else {
        fetchPairs(selectedPollId);
      }

      toast.success('Pairs bulk imported successfully');
    } catch (error) {
      console.error('Error in handleBulkImport:', error);
      setBulkImportError('Error bulk importing pairs');
    }
  };

  const handlePollSelect = (pollId: number) => {
    console.log('Poll selected:', pollId);
    setSelectedPollId(pollId);
    setSelectedGroupId(null); // Reset group selection
    fetchPairs(pollId);
    fetchGroups(pollId);
  };

  const handleGroupSelect = (groupId: number | null) => {
    console.log('Group selected:', groupId);
    setSelectedGroupId(groupId);

    if (groupId) {
      fetchPairs(undefined, groupId);
    } else if (selectedPollId) {
      fetchPairs(selectedPollId);
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

  console.log('Current state - pairs:', pairs.length, 'voters:', voters.length);

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <Header />
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <Button onClick={handleSignOut} variant="outline">
          Sign Out
        </Button>
      </div>

      <Tabs defaultValue="polls" className="w-full">
        <TabsList className="mb-6 w-full justify-start">
          <TabsTrigger value="polls">Polls</TabsTrigger>
          <TabsTrigger value="pairs">Pairs & Groups</TabsTrigger>
          <TabsTrigger value="voters">Voters</TabsTrigger>
        </TabsList>

        <TabsContent value="polls">
          <div className="grid gap-8">
            <Card className="shadow-sm">
              <CardContent className="pt-6">
                <h2 className="mb-4 text-xl font-bold">Create New Poll</h2>
                <form onSubmit={handleCreatePoll} className="space-y-4">
                  <div>
                    <label
                      htmlFor="pollTitle"
                      className="mb-1 block text-sm font-medium"
                    >
                      Poll Title
                    </label>
                    <Input
                      id="pollTitle"
                      value={pollTitle}
                      onChange={(e) => setPollTitle(e.target.value)}
                      placeholder="Enter poll title"
                      className="w-full"
                    />
                  </div>
                  <Button type="submit" disabled={!pollTitle.trim()}>
                    Create Poll
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardContent className="pt-6">
                <h2 className="mb-4 text-xl font-bold">Manage Polls</h2>
                {polls.length === 0 ? (
                  <p className="text-gray-500">
                    No polls found. Create one above.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {polls.map((poll) => (
                      <div
                        key={poll.id}
                        className="flex flex-col justify-between gap-4 rounded-lg border p-4 transition-colors hover:bg-gray-50 md:flex-row md:items-center"
                      >
                        <div>
                          <h3 className="font-bold">{poll.title}</h3>
                          <p className="text-sm text-gray-500">
                            {poll.isActive ? (
                              <span className="font-medium text-green-600">
                                Active
                              </span>
                            ) : poll.isClosed ? (
                              <span className="font-medium text-red-600">
                                Closed
                              </span>
                            ) : (
                              <span className="text-gray-600">Inactive</span>
                            )}
                            {' • '}
                            {poll._count.pairs} pairs
                            {' • '}
                            {poll._count.voters} voters
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handlePollSelect(poll.id)}
                          >
                            Manage Pairs
                          </Button>
                          {!poll.isActive && !poll.isClosed && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleActivatePoll(poll.id)}
                            >
                              Activate
                            </Button>
                          )}
                          {!poll.isClosed && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleClosePoll(poll.id)}
                            >
                              Close
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => router.push(`/poll/${poll.id}`)}
                          >
                            View Results
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="pairs">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <Card className="mb-6 shadow-sm">
                <CardContent className="pt-6">
                  <h2 className="mb-4 text-xl font-bold">Select Poll</h2>
                  <select
                    value={selectedPollId || ''}
                    onChange={(e) => handlePollSelect(Number(e.target.value))}
                    className="focus:ring-primary/20 w-full rounded-md border p-2 transition-colors focus:border-primary focus:ring-2"
                  >
                    <option value="">Select a poll</option>
                    {polls.map((poll) => (
                      <option key={poll.id} value={poll.id}>
                        {poll.title} ({poll._count.pairs} pairs)
                      </option>
                    ))}
                  </select>
                </CardContent>
              </Card>

              {selectedPollId && (
                <Card className="mb-6 shadow-sm">
                  <CardContent className="pt-6">
                    <h2 className="mb-4 text-xl font-bold">Create New Group</h2>
                    <form onSubmit={handleCreateGroup} className="space-y-4">
                      <div>
                        <label
                          htmlFor="groupTitle"
                          className="mb-1 block text-sm font-medium"
                        >
                          Group Title
                        </label>
                        <Input
                          id="groupTitle"
                          value={groupTitle}
                          onChange={(e) => setGroupTitle(e.target.value)}
                          placeholder="Enter group title"
                          className="w-full"
                        />
                      </div>
                      <Button type="submit" disabled={!groupTitle.trim()}>
                        Create Group
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              )}

              {selectedPollId && groups.length > 0 && (
                <Card className="mb-6 shadow-sm">
                  <CardContent className="pt-6">
                    <h2 className="mb-4 text-xl font-bold">Select Group</h2>
                    <select
                      value={selectedGroupId || ''}
                      onChange={(e) =>
                        handleGroupSelect(
                          e.target.value ? Number(e.target.value) : null,
                        )
                      }
                      className="focus:ring-primary/20 w-full rounded-md border p-2 transition-colors focus:border-primary focus:ring-2"
                    >
                      <option value="">All groups</option>
                      {groups.map((group) => (
                        <option key={group.id} value={group.id}>
                          {group.title} (
                          {group._count?.pairs || group.pairs.length} pairs)
                        </option>
                      ))}
                    </select>
                  </CardContent>
                </Card>
              )}

              {selectedPollId && (
                <Card className="shadow-sm">
                  <CardContent className="pt-6">
                    <h2 className="mb-4 text-xl font-bold">Add New Pair</h2>
                    <form onSubmit={handleAddPair} className="space-y-4">
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                          <label
                            htmlFor="optionA"
                            className="mb-1 block text-sm font-medium"
                          >
                            Option A
                          </label>
                          <Input
                            id="optionA"
                            value={optionA}
                            onChange={(e) => setOptionA(e.target.value)}
                            placeholder="Enter option A"
                            className="w-full"
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="optionB"
                            className="mb-1 block text-sm font-medium"
                          >
                            Option B
                          </label>
                          <Input
                            id="optionB"
                            value={optionB}
                            onChange={(e) => setOptionB(e.target.value)}
                            placeholder="Enter option B"
                            className="w-full"
                          />
                        </div>
                      </div>
                      <Button
                        type="submit"
                        disabled={!optionA.trim() || !optionB.trim()}
                      >
                        Add Pair
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              )}
            </div>

            <div>
              {selectedPollId && (
                <Card className="mb-6 shadow-sm">
                  <CardContent className="pt-6">
                    <h2 className="mb-4 text-xl font-bold">
                      Bulk Import Pairs
                    </h2>
                    <form onSubmit={handleBulkImport} className="space-y-4">
                      <div>
                        <label
                          htmlFor="bulkPairs"
                          className="mb-1 block text-sm font-medium"
                        >
                          Enter pairs (one option per line, every two lines form
                          a pair)
                        </label>
                        <Textarea
                          id="bulkPairs"
                          value={bulkPairsText}
                          onChange={(e) => setBulkPairsText(e.target.value)}
                          placeholder="Option A&#10;Option B&#10;Option C&#10;Option D"
                          className="h-40 w-full resize-y"
                        />
                      </div>
                      {bulkImportError && (
                        <div className="text-sm text-red-500">
                          {bulkImportError}
                        </div>
                      )}
                      <Button type="submit" disabled={!bulkPairsText.trim()}>
                        Import Pairs
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              )}

              <Card className="shadow-sm">
                <CardContent className="pt-6">
                  <h2 className="mb-4 text-xl font-bold">
                    {selectedGroupId
                      ? `Pairs in ${groups.find((g) => g.id === selectedGroupId)?.title || 'Selected Group'}`
                      : selectedPollId
                        ? 'All Pairs in Selected Poll'
                        : 'All Pairs'}
                  </h2>
                  {pairs.length === 0 ? (
                    <p className="text-gray-500">No pairs found.</p>
                  ) : (
                    <div className="max-h-[600px] space-y-4 overflow-y-auto pr-2">
                      {pairs.map((pair) => (
                        <div
                          key={pair.id}
                          className="flex items-center justify-between rounded-md border p-4 transition-colors hover:bg-gray-50"
                        >
                          <div>
                            <div className="font-medium">A: {pair.optionA}</div>
                            <div className="font-medium">B: {pair.optionB}</div>
                            {pair.group && (
                              <div className="text-sm text-gray-500">
                                Group: {pair.group.title}
                              </div>
                            )}
                            <div className="text-sm text-gray-500">
                              Votes: {pair.votes.length}
                            </div>
                          </div>
                          {/* Add delete button if needed */}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="voters">
          <Card className="shadow-sm">
            <CardContent className="pt-6">
              <h2 className="mb-4 text-xl font-bold">Voters</h2>
              {voters.length === 0 ? (
                <p className="text-gray-500">No voters found.</p>
              ) : (
                <div className="max-h-[600px] space-y-4 overflow-y-auto pr-2">
                  {voters.map((voter) => (
                    <div
                      key={voter.id}
                      className="flex flex-col justify-between rounded-lg border p-4 transition-colors hover:bg-gray-50 md:flex-row md:items-center"
                    >
                      <div>
                        <div className="font-medium">{voter.name}</div>
                        <div className="text-sm text-gray-500">
                          {voter._count?.votes || voter.votes?.length || 0}{' '}
                          votes
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteVoter(voter.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
