"use client";

import { useEffect, useState } from "react";

function getTypeDelay(character: string) {
  if (character === ".") return 240;
  if (character === " ") return 36;
  return 48;
}

export function TypewriterText({ brandText, sloganText }: { brandText: string; sloganText: string }) {
  const [visibleText, setVisibleText] = useState("");

  useEffect(() => {
    let cancelled = false;
    let timeoutId: number | undefined;

    function wait(ms: number) {
      return new Promise<void>((resolve) => {
        timeoutId = window.setTimeout(resolve, ms);
      });
    }

    async function typePhrase(text: string) {
      for (let index = 1; index <= text.length; index += 1) {
        if (cancelled) return;
        setVisibleText(text.slice(0, index));
        await wait(getTypeDelay(text[index - 1] ?? ""));
      }
    }

    async function deletePhrase(text: string) {
      for (let index = text.length - 1; index >= 0; index -= 1) {
        if (cancelled) return;
        setVisibleText(text.slice(0, index));
        await wait(28);
      }
    }

    async function runLoop() {
      while (!cancelled) {
        await typePhrase(brandText);
        await wait(700);
        await deletePhrase(brandText);
        await wait(260);
        await typePhrase(sloganText);
        await wait(5000);
        await deletePhrase(sloganText);
        await wait(420);
      }
    }

    setVisibleText("");
    void runLoop();

    return () => {
      cancelled = true;
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, [brandText, sloganText]);

  return (
    <span className="landing-typewriter" aria-label={`${brandText}. ${sloganText}`}>
      <span>{visibleText}</span>
      <span className="landing-typewriter-caret" aria-hidden="true" />
    </span>
  );
}
