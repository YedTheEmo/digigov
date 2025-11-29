import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../../__helpers__/test-utils';
import userEvent from '@testing-library/user-event';
import { Button } from '@/components/ui/button';

describe('Button', () => {
  it('renders with children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();
    
    render(<Button onClick={handleClick}>Click me</Button>);
    
    await user.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('is disabled when loading', () => {
    render(<Button loading>Loading</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('renders with different variants', () => {
    const { rerender } = render(<Button variant="primary">Primary</Button>);
    const button = screen.getByRole('button');
    expect(button.className).toContain('bg-[var(--color-primary)]');
    
    rerender(<Button variant="secondary">Secondary</Button>);
    expect(button.className).toContain('bg-[var(--color-bg-tertiary)]');
  });

  it('renders with different sizes', () => {
    const { rerender } = render(<Button size="sm">Small</Button>);
    expect(screen.getByRole('button')).toHaveClass('min-h-[48px]');
    
    rerender(<Button size="lg">Large</Button>);
    expect(screen.getByRole('button')).toHaveClass('min-h-[56px]');
  });

  it('renders left icon', () => {
    const LeftIcon = () => <span data-testid="left-icon">←</span>;
    render(<Button leftIcon={<LeftIcon />}>With Icon</Button>);
    expect(screen.getByTestId('left-icon')).toBeInTheDocument();
  });

  it('renders right icon', () => {
    const RightIcon = () => <span data-testid="right-icon">→</span>;
    render(<Button rightIcon={<RightIcon />}>With Icon</Button>);
    expect(screen.getByTestId('right-icon')).toBeInTheDocument();
  });
});

