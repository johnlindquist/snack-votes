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
    // Check if already logged in
    if (sessionStorage.getItem('adminSession')) {
      router.push('/admin/dashboard');
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Simple check – in a real app this would be an API call
    if (username === 'admin' && password === 'password123') {
      // Store session data with timestamp
      const session = {
        timestamp: new Date().toISOString(),
        isAuthenticated: true
      };
      sessionStorage.setItem('adminSession', JSON.stringify(session));
      router.push('/admin/dashboard');
    } else {
      alert('Invalid credentials');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-16">
      <Card>
        <Header title="Admin" showAdminLink={false} showHomeLink={true} />
        
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">Username</label>
              <input 
                type="text" 
                value={username} 
                onChange={(e) => setUsername(e.target.value)} 
                className="border border-slate-200 p-3 w-full rounded-lg shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">Password</label>
              <input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                className="border border-slate-200 p-3 w-full rounded-lg shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                required
              />
            </div>
            <Button 
              type="submit" 
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 rounded-lg font-medium"
            >
              Log In
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 