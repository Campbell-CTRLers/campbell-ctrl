import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import Footer from './Footer';

describe('Footer', () => {
  it('renders without throwing', () => {
    const onToggleAdmin = vi.fn();
    const onNavigate = vi.fn();
    expect(() => {
      render(<Footer onToggleAdmin={onToggleAdmin} onNavigate={onNavigate} />);
    }).not.toThrow();
  });

  it('renders navigation and legal links', () => {
    const onToggleAdmin = vi.fn();
    const onNavigate = vi.fn();
    render(<Footer onToggleAdmin={onToggleAdmin} onNavigate={onNavigate} />);
    expect(screen.getByRole('button', { name: 'Home' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Esports' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Meetings' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Privacy Policy' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Terms of Service' })).toBeInTheDocument();
  });
});
