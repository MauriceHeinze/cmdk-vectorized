import { useEffect } from "react";

import { useLatest } from "./use-latest";

export function useGlobalShortcut(
  key: "k" | "m" | false,
  handler: () => void,
) {
  const handlerRef = useLatest(handler);

  useEffect(() => {
    if (key === false) return;

    function onKeyDown(event: KeyboardEvent) {
      const matches =
        !event.defaultPrevented &&
        event.key.toLowerCase() === key &&
        (event.metaKey || event.ctrlKey) &&
        !event.altKey &&
        !event.shiftKey;
      if (!matches) return;

      event.preventDefault();
      handlerRef.current();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handlerRef, key]);
}
