import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from './ErrorBoundary';

const Throw = () => {
  throw new Error('test error');
};

describe('ErrorBoundary', () => {
  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <span>Child content</span>
      </ErrorBoundary>
    );
    expect(screen.getByText('Child content')).toBeInTheDocument();
  });

  it('renders fallback when a child throws', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <ErrorBoundary>
        <Throw />
      </ErrorBoundary>
    );
    expect(screen.getByText(/Something went wrong/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Reload/ })).toBeInTheDocument();
    console.error.mockRestore();
  });
});
