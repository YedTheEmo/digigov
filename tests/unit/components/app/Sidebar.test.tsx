import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '../../__helpers__/test-utils';
import userEvent from '@testing-library/user-event';
import { Sidebar } from '@/components/app/Sidebar';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from '@/hooks/useTheme';

vi.mock('next/navigation', () => ({
  usePathname: vi.fn(),
  useRouter: vi.fn(),
}));

vi.mock('@/hooks/useTheme', () => ({
  useTheme: vi.fn(),
}));

describe('Sidebar', () => {
  const mockPush = vi.fn();
  const mockSetSidebarCollapsedByDefault = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue({
      push: mockPush,
    } as any);
    vi.mocked(usePathname).mockReturnValue('/cases');
    vi.mocked(useTheme).mockReturnValue({
      visualTheme: 'modern-hub',
      sidebarCollapsedByDefault: false,
      setSidebarCollapsedByDefault: mockSetSidebarCollapsedByDefault,
    } as any);
  });

  it('renders sidebar with navigation groups', () => {
    render(<Sidebar />);
    expect(screen.getByLabelText('Main navigation')).toBeInTheDocument();
  });

  it('renders DigiGov logo when expanded', () => {
    render(<Sidebar />);
    expect(screen.getByText('DigiGov')).toBeInTheDocument();
  });

  it('shows collapse button', () => {
    render(<Sidebar />);
    const collapseButton = screen.getByLabelText('Collapse sidebar');
    expect(collapseButton).toBeInTheDocument();
  });

  it('toggles sidebar collapse state', async () => {
    const user = userEvent.setup();
    render(<Sidebar />);
    
    const collapseButton = screen.getByLabelText('Collapse sidebar');
    await user.click(collapseButton);
    
    expect(mockSetSidebarCollapsedByDefault).toHaveBeenCalledWith(true);
  });

  it('navigates when clicking on navigation group', async () => {
    const user = userEvent.setup();
    render(<Sidebar />);
    
    // Find and click on a navigation group
    const procurementButton = screen.getByLabelText('Procurement');
    await user.click(procurementButton);
    
    expect(mockPush).toHaveBeenCalledWith('/procurement');
  });

  it('highlights active group based on pathname', () => {
    vi.mocked(usePathname).mockReturnValue('/procurement');
    render(<Sidebar />);
    
    const procurementButton = screen.getByLabelText('Procurement');
    expect(procurementButton).toHaveClass('bg-[var(--color-primary-light)]');
  });

  it('filters navigation items based on role', () => {
    render(<Sidebar role="BUDGET_MANAGER" />);
    
    // Budget Manager should see Budget but not Procurement
    expect(screen.getByLabelText('Finance')).toBeInTheDocument();
    // Should not see Procurement-specific items
  });

  it('shows all navigation for ADMIN role', () => {
    render(<Sidebar role="ADMIN" />);
    
    expect(screen.getByLabelText('Cases')).toBeInTheDocument();
    expect(screen.getByLabelText('Procurement')).toBeInTheDocument();
    expect(screen.getByLabelText('Finance')).toBeInTheDocument();
    expect(screen.getByLabelText('Insights')).toBeInTheDocument();
    expect(screen.getByLabelText('Admin')).toBeInTheDocument();
  });

  it('filters items for PROCUREMENT_MANAGER role', () => {
    render(<Sidebar role="PROCUREMENT_MANAGER" />);
    
    // Should see Cases and Procurement
    expect(screen.getByLabelText('Cases')).toBeInTheDocument();
    expect(screen.getByLabelText('Procurement')).toBeInTheDocument();
  });

  it('renders collapsed sidebar when sidebarCollapsedByDefault is true', () => {
    vi.mocked(useTheme).mockReturnValue({
      visualTheme: 'modern-hub',
      sidebarCollapsedByDefault: true,
      setSidebarCollapsedByDefault: mockSetSidebarCollapsedByDefault,
    } as any);
    
    render(<Sidebar />);
    
    const sidebar = screen.getByLabelText('Main navigation').closest('aside');
    expect(sidebar).toHaveClass('w-20'); // Collapsed width
  });

  it('renders expanded sidebar when sidebarCollapsedByDefault is false', () => {
    vi.mocked(useTheme).mockReturnValue({
      visualTheme: 'modern-hub',
      sidebarCollapsedByDefault: false,
      setSidebarCollapsedByDefault: mockSetSidebarCollapsedByDefault,
    } as any);
    
    render(<Sidebar />);
    
    const sidebar = screen.getByLabelText('Main navigation').closest('aside');
    expect(sidebar).toHaveClass('w-64'); // Expanded width
  });

  it('handles pathname matching with sub-routes', () => {
    vi.mocked(usePathname).mockReturnValue('/procurement/123');
    render(<Sidebar />);
    
    const procurementButton = screen.getByLabelText('Procurement');
    expect(procurementButton).toHaveClass('bg-[var(--color-primary-light)]');
  });

  it('shows pin button when collapsed', async () => {
    vi.mocked(useTheme).mockReturnValue({
      visualTheme: 'modern-hub',
      sidebarCollapsedByDefault: true,
      setSidebarCollapsedByDefault: mockSetSidebarCollapsedByDefault,
    } as any);
    
    render(<Sidebar />);
    
    const pinButton = screen.getByLabelText('Pin sidebar open');
    expect(pinButton).toBeInTheDocument();
  });
});

