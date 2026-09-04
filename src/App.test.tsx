import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './auth/AuthContext';

test('renders the login screen when signed out', async () => {
  localStorage.clear();
  const queryClient = new QueryClient();
  render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider><App /></AuthProvider>
    </QueryClientProvider>
  );
  expect(await screen.findByRole('button', { name: /sign in/i })).toBeInTheDocument();
});
