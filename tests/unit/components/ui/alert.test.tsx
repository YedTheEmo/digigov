import { describe, it, expect } from 'vitest';
import { render, screen } from '../../__helpers__/test-utils';
import userEvent from '@testing-library/user-event';
import { Alert } from '@/components/ui/alert';

describe('Alert', () => {
  it('renders with title and children', () => {
    render(
      <Alert title="Alert Title" variant="info">
        Alert message
      </Alert>,
    );
    expect(screen.getByText('Alert Title')).toBeInTheDocument();
    expect(screen.getByText('Alert message')).toBeInTheDocument();
  });

  it('renders different variants', () => {
    const { rerender } = render(<Alert variant="info">Info</Alert>);
    expect(screen.getByRole('alert')).toHaveClass('bg-[var(--color-info-light)]');
    
    rerender(<Alert variant="success">Success</Alert>);
    expect(screen.getByRole('alert')).toHaveClass('bg-[var(--color-success-light)]');
    
    rerender(<Alert variant="warning">Warning</Alert>);
    expect(screen.getByRole('alert')).toHaveClass('bg-[var(--color-warning-light)]');
    
    rerender(<Alert variant="error">Error</Alert>);
    expect(screen.getByRole('alert')).toHaveClass('bg-[var(--color-error-light)]');
  });

  it('can be dismissed when dismissible', async () => {
    const user = userEvent.setup();
    const onDismiss = vi.fn();
    
    render(
      <Alert dismissible onDismiss={onDismiss}>
        Dismissible alert
      </Alert>,
    );
    
    const dismissButton = screen.getByLabelText('Dismiss');
    await user.click(dismissButton);
    
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('does not show dismiss button when not dismissible', () => {
    render(<Alert>Not dismissible</Alert>);
    expect(screen.queryByLabelText('Dismiss')).not.toBeInTheDocument();
  });

  it('renders without title', () => {
    render(<Alert variant="info">Message only</Alert>);
    expect(screen.getByText('Message only')).toBeInTheDocument();
    expect(screen.queryByText(/title/i)).not.toBeInTheDocument();
  });
});

