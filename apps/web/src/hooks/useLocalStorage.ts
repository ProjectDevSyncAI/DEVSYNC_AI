import {
  useCallback,
  useEffect,
  useState,
} from "react";

export function useLocalStorage<T>(
  key: string,
  initialValue: T,
) {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = window.localStorage.getItem(key);

      if (stored === null) {
        return initialValue;
      }

      return JSON.parse(stored) as T;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(
        key,
        JSON.stringify(value),
      );
    } catch {
      // Storage may be unavailable in restricted environments.
    }
  }, [key, value]);

  const remove = useCallback(() => {
    try {
      window.localStorage.removeItem(key);
    } finally {
      setValue(initialValue);
    }
  }, [key, initialValue]);

  return [value, setValue, remove] as const;
}

export default useLocalStorage;