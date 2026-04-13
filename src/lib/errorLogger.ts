import { supabase } from "@/integrations/supabase/client";

const MAX_LOGS_PER_SESSION = 50;
const DEDUP_WINDOW_MS = 10_000;

let logCount = 0;
const recentMessages = new Map<string, number>();

function shouldLog(message: string): boolean {
  if (logCount >= MAX_LOGS_PER_SESSION) return false;
  const now = Date.now();
  const last = recentMessages.get(message);
  if (last && now - last < DEDUP_WINDOW_MS) return false;
  recentMessages.set(message, now);
  logCount++;
  return true;
}

async function logError(errorMessage: string, errorStack?: string, componentName?: string, metadata?: Record<string, unknown>) {
  if (!shouldLog(errorMessage)) return;
  try {
    const userId = (await supabase.auth.getUser()).data.user?.id ?? null;
    await (supabase.from("client_error_log" as any).insert({
      user_id: userId,
      error_message: errorMessage.slice(0, 2000),
      error_stack: errorStack?.slice(0, 5000) ?? null,
      component_name: componentName ?? null,
      page_url: window.location.href,
      user_agent: navigator.userAgent,
      metadata: metadata ?? null,
    }) as any);
  } catch {
    // fire-and-forget
  }
}

export function logComponentError(error: Error, componentName: string) {
  logError(error.message, error.stack, componentName);
}

export function initErrorLogger() {
  window.onerror = (_msg, source, lineno, colno, error) => {
    const message = error?.message || String(_msg);
    logError(message, error?.stack, undefined, { source, lineno, colno });
  };

  window.onunhandledrejection = (event: PromiseRejectionEvent) => {
    const reason = event.reason;
    const message = reason instanceof Error ? reason.message : String(reason);
    const stack = reason instanceof Error ? reason.stack : undefined;
    logError(message, stack, undefined, { type: "unhandledrejection" });
  };
}
