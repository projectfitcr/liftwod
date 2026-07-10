"use client";

import { useEffect } from "react";

/** Registers the service worker after load; skipped in dev. */
export function RegisterSW() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    void navigator.serviceWorker.register("/sw.js");
  }, []);
  return null;
}
