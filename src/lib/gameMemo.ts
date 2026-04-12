/**
 * Game Component Memoization Helpers
 * Optimize game components to prevent unnecessary re-renders
 */

import { memo, FC, useCallback, useMemo } from "react";

/**
 * Create a memoized game component
 * Only re-renders if specified props change
 */
export function createMemoizedGame<P extends { onClose: () => void }>(
  Component: FC<P>,
  displayName: string
) {
  return memo(Component, (prev, next) => {
    // Only re-render if onClose callback changes
    return prev.onClose === next.onClose;
  });
}

/**
 * Create a stable callback that won't change on every render
 * Use when passing callbacks to memoized children
 */
export const useStableCallback = <T extends (...args: any[]) => any>(
  callback: T,
  deps: any[]
) => {
  return useCallback(callback, deps);
};

/**
 * Create stable memoized state selector
 * Prevents child component re-renders due to object creation
 */
export const useMemoizedObject = <T extends Record<string, any>>(obj: T, deps: any[]) => {
  return useMemo(() => obj, deps);
};

/**
 * Prevent game components from updating on parent re-renders
 * Use for expensive computations
 */
export function withGameMemo<P extends { onClose: () => void }>(
  Component: FC<P>
) {
  Component.displayName = `Memo(${Component.displayName || Component.name})`;
  return memo(Component, (prev, next) => {
    // Shallow comparison of all props except functions
    const prevKeys = Object.keys(prev);
    const nextKeys = Object.keys(next);

    if (prevKeys.length !== nextKeys.length) return false;

    return prevKeys.every(key => {
      const prevValue = (prev as any)[key];
      const nextValue = (next as any)[key];

      // For functions, compare reference
      if (typeof prevValue === "function") {
        return prevValue === nextValue;
      }

      // For other values, use shallow comparison
      return prevValue === nextValue;
    });
  });
}
