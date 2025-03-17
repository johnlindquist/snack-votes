'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Header } from '@/components/ui/header';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

type Vote = {
  id: number;
  selection: string;
};

type Pair = {
  id: number;
  optionA: string;
  optionB: string;
  votes: Vote[];
};

type Poll = {
  id: number;
  title: string;
  isActive: boolean;
  isClosed: boolean;
  createdAt: string;
  pairs: Pair[];
};

export default function PollResults() {
  const params = useParams();
  const [poll, setPoll] = useState<Poll | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPoll = async () => {
      try {
        setLoading(true);
        setError(null);

        const pollId = params.id;
        const response = await fetch(`/api/polls/${pollId}`);

        if (!response.ok) {
          throw new Error(`Failed to fetch poll: ${response.statusText}`);
        }

        const data = await response.json();
        setPoll(data);
      } catch (err) {
        console.error('Error fetching poll:', err);
        setError('Failed to load poll results. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchPoll();
  }, [params.id]);

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <Header />
        <div className="flex h-64 items-center justify-center">
          <div className="text-xl">Loading poll results...</div>
        </div>
      </div>
    );
  }

  if (error || !poll) {
    return (
      <div className="container mx-auto py-8">
        <Header />
        <div className="flex h-64 items-center justify-center">
          <div className="text-xl text-red-500">
            {error || 'Poll not found'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Header title={`${poll.title} Results`} />

      <div className="mx-auto max-w-4xl">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-3xl font-bold">{poll.title}</h1>
          <p className="text-gray-500">
            {poll.isClosed
              ? 'This poll is closed'
              : poll.isActive
                ? 'This poll is active'
                : 'This poll is inactive'}
          </p>
        </div>

        <div className="grid gap-6">
          {poll.pairs.map((pair) => {
            const votesForA = pair.votes.filter(
              (v) => v.selection === pair.optionA,
            ).length;
            const votesForB = pair.votes.filter(
              (v) => v.selection === pair.optionB,
            ).length;
            const totalVotes = votesForA + votesForB;
            const percentA =
              totalVotes > 0 ? Math.round((votesForA / totalVotes) * 100) : 0;
            const percentB =
              totalVotes > 0 ? Math.round((votesForB / totalVotes) * 100) : 0;

            // Pie chart data
            const chartData = {
              labels: [
                `${pair.optionA} (${votesForA} votes, ${percentA}%)`,
                `${pair.optionB} (${votesForB} votes, ${percentB}%)`,
              ],
              datasets: [
                {
                  data: [votesForA, votesForB],
                  backgroundColor: [
                    'rgba(99, 102, 241, 0.8)',
                    'rgba(34, 197, 94, 0.8)',
                  ],
                  borderColor: [
                    'rgba(99, 102, 241, 1)',
                    'rgba(34, 197, 94, 1)',
                  ],
                  borderWidth: 1,
                },
              ],
            };

            // Chart options
            const chartOptions = {
              responsive: true,
              maintainAspectRatio: true,
              plugins: {
                legend: {
                  display: true,
                  position: 'bottom' as const,
                  labels: {
                    padding: 20,
                    usePointStyle: true,
                    pointStyle: 'circle',
                    font: {
                      size: 12,
                    },
                  },
                },
                tooltip: {
                  callbacks: {
                    label: function (tooltipItem: {
                      dataIndex: number;
                      dataset: { data: number[] };
                      raw: number;
                    }) {
                      const value = tooltipItem.raw || 0;
                      const percentage =
                        totalVotes > 0
                          ? Math.round((value / totalVotes) * 100)
                          : 0;
                      return `${value} votes (${percentage}%)`;
                    },
                  },
                },
              },
            } as ChartOptions<'pie'>;

            return (
              <Card key={pair.id} className="overflow-hidden">
                <CardHeader className="bg-gray-50 p-4">
                  <h3 className="text-lg font-medium">
                    {pair.optionA} vs {pair.optionB}
                  </h3>
                </CardHeader>
                <CardContent className="p-6">
                  {totalVotes > 0 ? (
                    <div className="mx-auto max-w-md">
                      <div className="mx-auto mb-4 aspect-square w-full max-w-[300px]">
                        <Pie data={chartData} options={chartOptions} />
                      </div>

                      <div className="mt-4 text-center text-sm text-gray-500">
                        Total votes: {totalVotes}
                      </div>
                    </div>
                  ) : (
                    <div className="py-8 text-center text-gray-500">
                      No votes yet
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
