"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Header } from "@/components/ui/header";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Toaster, toast } from "react-hot-toast";
import confetti from "canvas-confetti";

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
  const [voterName, setVoterName] = useState("");
  const [formError, setFormError] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [completedVoterName, setCompletedVoterName] = useState("");
  const [formKey, setFormKey] = useState(Date.now());

  useEffect(() => {
    // Fetch pairs from the public endpoint
    fetch("/api/pairs")
      .then((res) => res.json())
      .then((data) => setPairs(data))
      .catch((err) => console.error(err));
  }, []);

  const resetForm = () => {
    setVotes({});
    setVoterName("");
    setFormError("");
    setShowSuccessModal(false);
    setCompletedVoterName("");
    setFormKey(Date.now());
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleChange = (pairId: number, selection: string) => {
    setVotes((prev) => ({ ...prev, [pairId]: selection }));
    setFormError(""); // Clear error when user makes a selection
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate voter name
    if (!voterName.trim()) {
      setFormError("Please enter your name");
      return;
    }

    // Check if all pairs have been voted on
    const unvotedPairs = pairs.filter((pair) => !votes[pair.id]);
    if (unvotedPairs.length > 0) {
      setFormError("Please vote on all pairs before submitting!");
      return;
    }

    // Build vote objects
    const voteArray = Object.keys(votes).map((pairId) => ({
      pairId: Number(pairId),
      selection: votes[Number(pairId)],
    }));

    const response = await fetch("/api/vote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
        setVoterName("");
        setFormError("");
        setShowSuccessModal(false);
        setCompletedVoterName("");
        window.scrollTo({ top: 0, behavior: "smooth" });
      }, 3000);
    } else {
      toast.error("There was an error submitting your votes.", {
        duration: 4000,
        style: {
          background: "#fee2e2",
          color: "#991b1b",
          padding: "16px",
          borderRadius: "8px",
        },
      });
      setFormError("There was an error submitting your votes.");
    }
  };

  return (
    <>
      <Toaster />
      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div className="relative bg-white rounded-2xl p-8 shadow-2xl transform scale-100 animate-in fade-in zoom-in duration-300 max-w-md w-full mx-4">
            <div className="text-center space-y-4">
              <div className="text-6xl">🎉</div>
              <h2 className="text-3xl font-bold text-purple-800">
                Thanks for voting!
              </h2>
              <p className="text-xl text-gray-600">
                We appreciate your input, {completedVoterName}!
              </p>
              <p className="text-sm text-gray-500 mt-4">
                The form will reset in a moment...
              </p>
            </div>
          </div>
        </div>
      )}

      <div className={showSuccessModal ? "pointer-events-none opacity-50" : ""}>
        <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6">
          <Header title="Vote for Your Favorite Snacks" />

          <form key={formKey} onSubmit={handleSubmit} className="space-y-8">
            {pairs.map((pair, index) => (
              <Card key={pair.id}>
                <CardHeader>
                  <p className="font-medium text-center text-slate-700">
                    <span className="inline-block bg-purple-100 text-purple-800 rounded-full px-3 py-1 text-sm mr-2">
                      {index + 1}/{pairs.length}
                    </span>
                    Pick your favorite snack!
                  </p>
                </CardHeader>

                <CardContent>
                  <ToggleGroup
                    type="single"
                    value={votes[pair.id]}
                    onValueChange={(value) => value && handleChange(pair.id, value)}
                    className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl mx-auto"
                  >
                    <ToggleGroupItem
                      value={pair.optionA}
                      className="w-full h-16 text-lg font-medium border-2 rounded-lg data-[state=on]:bg-gradient-to-r data-[state=on]:from-purple-600 data-[state=on]:to-indigo-600 data-[state=on]:text-white data-[state=on]:border-transparent hover:bg-purple-50 transition-all"
                    >
                      {pair.optionA}
                    </ToggleGroupItem>
                    <ToggleGroupItem
                      value={pair.optionB}
                      className="w-full h-16 text-lg font-medium border-2 rounded-lg data-[state=on]:bg-gradient-to-r data-[state=on]:from-purple-600 data-[state=on]:to-indigo-600 data-[state=on]:text-white data-[state=on]:border-transparent hover:bg-purple-50 transition-all"
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
                      setFormError("");
                    }}
                    className="border border-slate-200 p-3 w-full rounded-lg shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                    required
                    placeholder="Enter your name"
                  />
                </div>
              </CardContent>
            </Card>

            {formError && (
              <div className="text-red-600 text-center font-medium">
                {formError}
              </div>
            )}

            <div className="text-center pt-8">
              <Button
                type="submit"
                size="lg"
                className="px-10 py-6 text-lg font-medium bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all rounded-full"
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
