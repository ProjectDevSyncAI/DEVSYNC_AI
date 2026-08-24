import { useEffect } from "react";

interface KeyboardShortcutOptions {
  enabled?: boolean;
  preventDefault?: boolean;
}

export function useKeyboardShortcut(
  keys: string[],
  callback: (event: KeyboardEvent) => void,
  options: KeyboardShortcutOptions = {},
) {
  const {
    enabled = true,
    preventDefault = true,
  } = options;

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const handler = (event: KeyboardEvent) => {
      const pressed = new Set<string>();

      if (event.ctrlKey) pressed.add("ctrl");
      if (event.metaKey) pressed.add("meta");
      if (event.shiftKey) pressed.add("shift");
      if (event.altKey) pressed.add("alt");

      pressed.add(event.key.toLowerCase());

      const required = keys.map((key) =>
        key.toLowerCase(),
      );

      const matches = required.every((key) =>
        pressed.has(key),
      );

      if (!matches) {
        return;
      }

      if (preventDefault) {
        event.preventDefault();
      }

      callback(event);
    };

    window.addEventListener("keydown", handler);

    return () => {
      window.removeEventListener("keydown", handler);
    };
  }, [keys, callback, enabled, preventDefault]);
}

export default useKeyboardShortcut;