import { describe, it, expect } from 'vitest';
import { render, screen } from '../../__helpers__/test-utils';
import { CaseHeader } from '@/components/app/CaseHeader';

describe('CaseHeader', () => {
  it('renders case title', () => {
    render(<CaseHeader title="Test Case" currentState="DRAFT" />);
    expect(screen.getByText('Test Case')).toBeInTheDocument();
  });

  it('renders case details label', () => {
    render(<CaseHeader title="Test Case" currentState="DRAFT" />);
    expect(screen.getByText('Case Details')).toBeInTheDocument();
  });

  it('renders current state badge', () => {
    render(<CaseHeader title="Test Case" currentState="POSTING" />);
    const stateBadge = screen.getByTestId('case-current-state');
    expect(stateBadge).toBeInTheDocument();
    expect(stateBadge).toHaveTextContent('POSTING');
  });

  it('renders method badge when provided', () => {
    render(
      <CaseHeader
        title="Test Case"
        method="SMALL_VALUE_RFQ"
        currentState="DRAFT"
      />,
    );
    expect(screen.getByText('Small Value RFQ')).toBeInTheDocument();
  });

  it('formats SMALL_VALUE_RFQ method correctly', () => {
    render(
      <CaseHeader
        title="Test Case"
        method="SMALL_VALUE_RFQ"
        currentState="DRAFT"
      />,
    );
    expect(screen.getByText('Small Value RFQ')).toBeInTheDocument();
  });

  it('formats INFRASTRUCTURE method correctly', () => {
    render(
      <CaseHeader
        title="Test Case"
        method="INFRASTRUCTURE"
        currentState="DRAFT"
      />,
    );
    expect(screen.getByText('Infrastructure')).toBeInTheDocument();
  });

  it('formats PUBLIC_BIDDING method correctly', () => {
    render(
      <CaseHeader
        title="Test Case"
        method="PUBLIC_BIDDING"
        currentState="DRAFT"
      />,
    );
    expect(screen.getByText('Public Bidding')).toBeInTheDocument();
  });

  it('does not render method badge when method is not provided', () => {
    render(<CaseHeader title="Test Case" currentState="DRAFT" />);
    expect(screen.queryByText('Small Value RFQ')).not.toBeInTheDocument();
    expect(screen.queryByText('Infrastructure')).not.toBeInTheDocument();
    expect(screen.queryByText('Public Bidding')).not.toBeInTheDocument();
  });

  it('renders owner badge when owner is provided', () => {
    render(
      <CaseHeader
        title="Test Case"
        currentState="ORS"
        owner={{ module: 'Budget', roleHint: 'Budget Manager' }}
      />,
    );
    expect(screen.getByText(/Budget · Budget Manager/)).toBeInTheDocument();
  });

  it('renders owner badge with default role hint when not provided', () => {
    render(
      <CaseHeader
        title="Test Case"
        currentState="ORS"
        owner={{ module: 'Budget' }}
      />,
    );
    expect(screen.getByText(/Budget · Team Member/)).toBeInTheDocument();
  });

  it('renders back link when backHref is provided', () => {
    render(
      <CaseHeader
        title="Test Case"
        currentState="DRAFT"
        backHref="/procurement"
      />,
    );
    const backLink = screen.getByRole('link');
    expect(backLink).toHaveAttribute('href', '/procurement');
  });

  it('does not render back link when backHref is not provided', () => {
    render(<CaseHeader title="Test Case" currentState="DRAFT" />);
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('renders all badges together', () => {
    render(
      <CaseHeader
        title="Test Case"
        method="SMALL_VALUE_RFQ"
        currentState="POSTING"
        owner={{ module: 'Procurement', roleHint: 'Procurement Manager' }}
        backHref="/procurement"
      />,
    );
    
    expect(screen.getByText('Test Case')).toBeInTheDocument();
    expect(screen.getByText('Small Value RFQ')).toBeInTheDocument();
    expect(screen.getByTestId('case-current-state')).toHaveTextContent('POSTING');
    expect(screen.getByText(/Procurement · Procurement Manager/)).toBeInTheDocument();
    expect(screen.getByRole('link')).toHaveAttribute('href', '/procurement');
  });

  it('handles unknown method gracefully', () => {
    render(
      <CaseHeader
        title="Test Case"
        method="UNKNOWN_METHOD"
        currentState="DRAFT"
      />,
    );
    expect(screen.getByText('UNKNOWN_METHOD')).toBeInTheDocument();
  });

  it('handles null method', () => {
    render(
      <CaseHeader
        title="Test Case"
        method={null}
        currentState="DRAFT"
      />,
    );
    expect(screen.queryByText(/Small Value|Infrastructure|Public Bidding/)).not.toBeInTheDocument();
  });
});

