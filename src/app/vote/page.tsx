'use client';

import { useState, useEffect } from 'react';
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

  useEffect(() => {
    // Fetch pairs from the public endpoint
    fetch('/api/pairs')
      .then((res) => res.json())
      .then((data) => setPairs(data))
      .catch((err) => console.error(err));
  }, []);

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
        </div>
      </div>
    </>
  );
}
