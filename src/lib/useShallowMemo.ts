import { useRef } from 'react';

/**
 * Returns a referentially stable version of `value`: rebuilt on every render,
 * but callers receive the previous reference whenever all top-level entries
 * are shallow-equal. Safe against stale closures because the input object is
 * freshly constructed each render.
 */
export function useShallowMemo<T extends Record<string, unknown>>(value: T): T {
  const ref = useRef<T>(value);
  const prev = ref.current;

  if (prev !== value) {
    const prevKeys = Object.keys(prev);
    const nextKeys = Object.keys(value);
    const identical =
      prevKeys.length === nextKeys.length &&
      prevKeys.every((k) => k in value && prev[k] === value[k]);
    if (!identical) {
      ref.current = value;
    }
  }

  return ref.current;
}
