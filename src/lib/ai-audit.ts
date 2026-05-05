/**
 * AI request audit logging.
 *
 * Emits structured JSON-line records to stdout for every `/api/chat` hit.
 * Vercel / Fly / Docker / `next start` all stream stdout into the platform
 * log pipeline, so this requires zero infra: just `vercel logs`,
 * `docker logs`, `journalctl`, etc.
 *
 * Each line is prefixed with `[arc-ai-audit]` so it is trivially greppable
 * and easy to filter into a separate logging sink (Logflare / Datadog /
 * Loki / etc.) via a tail-based forwarder.
 *
 * We deliberately do NOT log message contents — only metadata, token
 * usage, and identity-adjacent signals (IP, UA, origin host). That keeps
 * the audit record useful for abuse / cost monitoring while staying out
 * of PII / prompt-leak territory.
 */
export type AiAuditOutcome =
  | "ok"
  | "rate_limited"
  | "forbidden"
  | "bad_request"
  | "not_configured"
  | "upstream_error"
  | "error";

export type AiAuditUsage = {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
};

export type AiAuditRecord = {
  outcome: AiAuditOutcome;
  /** HTTP status code returned to the caller (when applicable). */
  status?: number;
  /** Best-effort client IP — same source the rate limiter buckets on. */
  ip?: string;
  /** Truncated User-Agent (max 200 chars) for fingerprinting only. */
  ua?: string;
  /** Host header of the inbound request. */
  host?: string;
  /** Origin / Referer host of the inbound request, if any. */
  origin?: string;
  /** Locale the client requested (zh | en). */
  locale?: string;
  /** Configured upstream model name. */
  model?: string;
  /** Whether the request used SSE streaming. */
  stream?: boolean;
  /** Number of messages sent in the request body. */
  messages?: number;
  /** Total characters across all message contents. */
  chars?: number;
  /** Number of tool calls the model made during this exchange. */
  toolCalls?: number;
  /** Token usage reported by the upstream provider. */
  usage?: AiAuditUsage;
  /** Wall-clock latency from receiving the request to flushing the response. */
  latencyMs?: number;
  /** Optional reason string for non-ok outcomes. */
  reason?: string;
  /** Rate-limiter snapshot for this request. */
  rateLimit?: { limit: number; remaining: number };
};

/**
 * Best-effort extraction of the request Origin host. Falls back to the
 * Referer host. Returns `undefined` if neither is present or parseable.
 */
export function getOriginHost(req: Request): string | undefined {
  const origin = req.headers.get("origin");
  const referer = req.headers.get("referer");
  for (const candidate of [origin, referer]) {
    if (!candidate) continue;
    try {
      return new URL(candidate).host.toLowerCase();
    } catch {
      // ignore
    }
  }
  return undefined;
}

/** Truncate a free-form header string so we never blow up our log lines. */
export function truncate(value: string | null | undefined, max = 200): string | undefined {
  if (!value) return undefined;
  return value.length > max ? `${value.slice(0, max)}…` : value;
}

/**
 * Emit one structured audit record to stdout. Safe to call from any
 * request path — it never throws and never blocks on I/O.
 */
export function logAiAudit(record: AiAuditRecord): void {
  try {
    const payload = {
      ts: new Date().toISOString(),
      kind: "ai.chat",
      ...record,
    };
    console.log(`[arc-ai-audit] ${JSON.stringify(payload)}`);
  } catch {
    // Logging must never crash a request path.
  }
}
