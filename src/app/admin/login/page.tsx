'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/ui/header';
import { Card, CardContent } from '@/components/ui/card';

export default function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  useEffect(() => {
    const session = sessionStorage.getItem('adminSession');
    if (session) {
      router.push('/admin/dashboard');
    }
  }, [router]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Simple check – in a real app this would be an API call
    if (username === 'admin' && password === 'password123') {
      // Store session data with timestamp and auth token
      const session = {
        timestamp: new Date().toISOString(),
        isAuthenticated: true,
        authToken: 'Basic myplainTextAdminCreds',
      };
      sessionStorage.setItem('adminSession', JSON.stringify(session));
      router.push('/admin/dashboard');
    } else {
      alert('Invalid credentials');
    }
  };

  return (
    <div className="mx-auto mt-16 max-w-md">
      <Card>
        <Header title="Admin" showAdminLink={false} showHomeLink={true} />

        <CardContent>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-lg border border-slate-200 p-3 shadow-sm outline-none focus:border-transparent focus:ring-2 focus:ring-purple-500"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-200 p-3 shadow-sm outline-none focus:border-transparent focus:ring-2 focus:ring-purple-500"
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 py-3 font-medium hover:from-purple-700 hover:to-indigo-700"
            >
              Log In
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
