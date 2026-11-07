"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { isAutoRefreshPaused } from "./refresh-lock";

const REFRESH_EVERY_MS = 30_000; // every 30 seconds
const MIN_GAP_MS = 10_000; // when the tab comes back: only if the last refresh was 10+ seconds ago

// Shows nothing. It only refreshes the server data of the current admin page.
export function AutoRefresh() {
  const router = useRouter();
  const lastRefresh = useRef(0);

  useEffect(() => {
    lastRefresh.current = Date.now();

    function refresh(minGapMs: number) {
      if (document.visibilityState !== "visible") return; // tab is hidden
      if (!navigator.onLine) return; // no internet
      if (isAutoRefreshPaused()) return; // a button is working
      if (Date.now() - lastRefresh.current < minGapMs) return; // too soon

      lastRefresh.current = Date.now();
      router.refresh();
    }

    const timer = window.setInterval(() => refresh(0), REFRESH_EVERY_MS);

    function handleVisibility() {
      if (document.visibilityState === "visible") refresh(MIN_GAP_MS);
    }
    function handleOnline() {
      refresh(MIN_GAP_MS);
    }

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("online", handleOnline);

    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("online", handleOnline);
    };
  }, [router]);

  return null;
}