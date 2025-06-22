import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders navigation buttons', () => {
  render(<App />);
  expect(screen.getByRole('button', { name: /shop/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /cart/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /about/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /account/i })).toBeInTheDocument();
});
