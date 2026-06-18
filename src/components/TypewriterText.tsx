"use client";

import { useEffect, useState } from "react";

export function TypewriterText({ text }: { text: string }) {
  const [visibleText, setVisibleText] = useState("");

  useEffect(() => {
    let index = 0;
    let timeoutId: number | undefined;

    function typeNextCharacter() {
      index += 1;
      setVisibleText(text.slice(0, index));

      if (index >= text.length) return;

      const current = text[index - 1];
      const pause = current === "." ? 220 : current === " " ? 34 : 46;
      timeoutId = window.setTimeout(typeNextCharacter, pause);
    }

    setVisibleText("");
    timeoutId = window.setTimeout(typeNextCharacter, 220);

    return () => {
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, [text]);

  return (
    <span className="landing-typewriter" aria-label={text}>
      {visibleText}
    </span>
  );
}
