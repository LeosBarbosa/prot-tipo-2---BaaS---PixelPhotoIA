
import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useEditor, EditorProvider, DEFAULT_LOCAL_FILTERS } from './EditorContext';

// Mock the db module
vi.mock('../utils/db', () => ({
  loadHistory: vi.fn().mockResolvedValue(undefined),
  loadWorkflows: vi.fn().mockResolvedValue([]),
  loadRecentTools: vi.fn().mockResolvedValue([]),
  loadPromptHistory: vi.fn().mockResolvedValue([]),
  saveHistory: vi.fn().mockResolvedValue(undefined),
  saveRecentTools: vi.fn().mockResolvedValue(undefined),
  addWorkflow: vi.fn().mockResolvedValue(undefined),
  savePromptHistory: vi.fn().mockResolvedValue(undefined),
}));

describe('EditorContext', () => {
  it('buildFilterString should return the correct filter string', () => {
    const { result } = renderHook(() => useEditor(), {
      wrapper: EditorProvider,
    });

    // Test with default filters
    const defaultFilterString = result.current.buildFilterString({});
    expect(defaultFilterString).toBe('brightness(100%) contrast(100%) saturate(100%) sepia(0%) invert(0%) grayscale(0%) hue-rotate(0deg) blur(0px)');

    // Test with custom filters
    const customFilters = {
      brightness: 120,
      contrast: 90,
      saturate: 150,
      sepia: 50,
      invert: 10,
      grayscale: 20,
      hueRotate: 180,
      blur: 5,
    };
    const customFilterString = result.current.buildFilterString(customFilters);
    expect(customFilterString).toBe('brightness(120%) contrast(90%) saturate(150%) sepia(50%) invert(10%) grayscale(20%) hue-rotate(180deg) blur(5px)');
  });

  it('should toggle theme between dark and light', () => {
    const { result } = renderHook(() => useEditor(), {
      wrapper: EditorProvider,
    });

    expect(result.current.theme).toBe('dark');

    act(() => {
      result.current.toggleTheme();
    });

    expect(result.current.theme).toBe('light');

    act(() => {
      result.current.toggleTheme();
    });

    expect(result.current.theme).toBe('dark');
  });

  it('should reset local filters to default', () => {
    const { result } = renderHook(() => useEditor(), {
      wrapper: EditorProvider,
    });

    act(() => {
      result.current.setLocalFilters({
        brightness: 150,
        contrast: 50,
        saturate: 200,
        sepia: 100,
        invert: 100,
        grayscale: 100,
        hueRotate: 270,
        blur: 10,
        curve: undefined,
      });
    });

    act(() => {
      result.current.resetLocalFilters();
    });

    expect(result.current.localFilters).toEqual(DEFAULT_LOCAL_FILTERS);
  });

  it('should add prompts to history and handle duplicates', () => {
    const { result } = renderHook(() => useEditor(), {
      wrapper: EditorProvider,
    });

    act(() => {
      result.current.addPromptToHistory('prompt 1');
    });
    expect(result.current.promptHistory).toEqual(['prompt 1']);

    act(() => {
      result.current.addPromptToHistory('prompt 2');
    });
    expect(result.current.promptHistory).toEqual(['prompt 2', 'prompt 1']);

    act(() => {
      result.current.addPromptToHistory('prompt 1');
    });
    expect(result.current.promptHistory).toEqual(['prompt 1', 'prompt 2']);
  });
});
