import { useEffect, useState } from "react";

// Simple typed localStorage hook with JSON serialization
export function useLocalStorage<T>(key: string | undefined, initialValue: T) {
  const isStorageEnabled = typeof window !== "undefined" && !!key;

  const [storedValue, setStoredValue] = useState<T>(() => {
    if (!isStorageEnabled) return initialValue;
    try {
      const item = window.localStorage.getItem(key!);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch (_e) {
      return initialValue;
    }
  });

  useEffect(() => {
    if (!isStorageEnabled) return;
    try {
      window.localStorage.setItem(key!, JSON.stringify(storedValue));
    } catch (_e) {
      // ignore write errors
    }
  }, [key, isStorageEnabled, storedValue]);

  return [storedValue, setStoredValue] as const;
}
