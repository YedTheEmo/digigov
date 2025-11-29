import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useKeybinds } from '@/hooks/useKeybinds';
import { useRouter } from 'next/navigation';

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

describe('useKeybinds', () => {
  const mockPush = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue({
      push: mockPush,
    } as any);
    
    // Clear localStorage
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('returns default keybinds', () => {
    const { result } = renderHook(() => useKeybinds());
    
    expect(result.current.keybinds).toBeDefined();
    expect(result.current.keybinds.length).toBeGreaterThan(0);
    expect(result.current.keybinds[0]).toHaveProperty('action');
    expect(result.current.keybinds[0]).toHaveProperty('defaultKey');
  });

  it('loads custom keybinds from localStorage', () => {
    const customKeybinds = { search: 'ctrl+s' };
    localStorage.setItem('digigov-keybinds', JSON.stringify(customKeybinds));
    
    const { result } = renderHook(() => useKeybinds());
    
    const searchKeybind = result.current.keybinds.find((kb) => kb.action === 'search');
    expect(searchKeybind?.customKey).toBe('ctrl+s');
  });

  it('updates keybind and saves to localStorage', () => {
    const { result } = renderHook(() => useKeybinds());
    
    act(() => {
      result.current.updateKeybind('search', 'ctrl+s');
    });
    
    const stored = JSON.parse(localStorage.getItem('digigov-keybinds') || '{}');
    expect(stored.search).toBe('ctrl+s');
    
    const searchKeybind = result.current.keybinds.find((kb) => kb.action === 'search');
    expect(searchKeybind?.customKey).toBe('ctrl+s');
  });

  it('resets keybind to default', () => {
    const { result } = renderHook(() => useKeybinds());
    
    // Set custom keybind first
    act(() => {
      result.current.updateKeybind('search', 'ctrl+s');
    });
    
    // Reset it
    act(() => {
      result.current.resetKeybind('search');
    });
    
    const searchKeybind = result.current.keybinds.find((kb) => kb.action === 'search');
    expect(searchKeybind?.customKey).toBeUndefined();
  });

  it('resets all keybinds', () => {
    const { result } = renderHook(() => useKeybinds());
    
    // Set multiple custom keybinds
    act(() => {
      result.current.updateKeybind('search', 'ctrl+s');
      result.current.updateKeybind('goto_cases', 'ctrl+c');
    });
    
    // Reset all
    act(() => {
      result.current.resetAllKeybinds();
    });
    
    expect(localStorage.getItem('digigov-keybinds')).toBeNull();
    result.current.keybinds.forEach((kb) => {
      expect(kb.customKey).toBeUndefined();
    });
  });

  it('returns active key (custom or default)', () => {
    const { result } = renderHook(() => useKeybinds());
    
    const keybind = result.current.keybinds[0];
    const activeKey = result.current.getActiveKey(keybind);
    
    expect(activeKey).toBe(keybind.defaultKey);
    
    // Set custom key
    act(() => {
      result.current.updateKeybind(keybind.action, 'custom-key');
    });
    
    const updatedKeybind = result.current.keybinds.find((kb) => kb.action === keybind.action);
    expect(result.current.getActiveKey(updatedKeybind!)).toBe('custom-key');
  });

  it('executes navigation action', () => {
    const { result } = renderHook(() => useKeybinds());
    
    act(() => {
      result.current.executeAction('goto_cases');
    });
    
    expect(mockPush).toHaveBeenCalledWith('/cases');
  });

  it('executes procurement navigation', () => {
    const { result } = renderHook(() => useKeybinds());
    
    act(() => {
      result.current.executeAction('goto_procurement');
    });
    
    expect(mockPush).toHaveBeenCalledWith('/procurement');
  });

  it('handles invalid localStorage data gracefully', () => {
    localStorage.setItem('digigov-keybinds', 'invalid-json');
    
    const { result } = renderHook(() => useKeybinds());
    
    // Should not throw and should use defaults
    expect(result.current.keybinds).toBeDefined();
  });
});

