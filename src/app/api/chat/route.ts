import { NextResponse } from "next/server";
import { runChat, streamChat } from "@/ai/server";
import { consume, getClientIp } from "@/lib/rate-limit";
import {
  getOriginHost,
  logAiAudit,
  truncate,
  type AiAuditOutcome,
  type AiAuditRecord,
} from "@/lib/ai-audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Hard caps. These exist to keep the upstream LLM bill bounded and to make
// the endpoint useless as an "open proxy" for someone else's chat client.
const MAX_MESSAGES = 24;
const MAX_MESSAGE_CHARS = 4000;
const MAX_TOTAL_CHARS = 16_000;

export async function POST(req: Request) {
  const startedAt = Date.now();
  const ip = getClientIp(req);
  const ua = truncate(req.headers.get("user-agent"));
  const host = req.headers.get("host") ?? undefined;
  const origin = getOriginHost(req);

  // Helper closure so every error path emits an audit record with shared
  // request metadata.
  const audit = (
    outcome: AiAuditOutcome,
    extra: Partial<AiAuditRecord> = {},
  ) => {
    logAiAudit({
      outcome,
      ip,
      ua,
      host,
      origin,
      latencyMs: Date.now() - startedAt,
      ...extra,
    });
  };

  // 1. Same-origin check — protect against being used as an unauthenticated
  //    proxy from arbitrary websites. We allow:
  //      - requests with no Origin/Referer (server-to-server, curl from CLI
  //        with a matching Host) ONLY in dev or when explicitly allowed via
  //        ARC_AI_ALLOW_NO_ORIGIN=1
  //      - requests whose Origin / Referer host matches the request Host or
  //        any of the allow-listed hosts in ARC_AI_ALLOWED_ORIGINS.
  const originCheck = checkOrigin(req);
  if (!originCheck.ok) {
    audit("forbidden", { status: 403, reason: originCheck.reason });
    return NextResponse.json(
      { ok: false, code: "forbidden", error: originCheck.reason },
      { status: 403 },
    );
  }

  // 2. Rate limit per client IP (token bucket).
  const rl = consume(`chat:${ip}`);
  if (!rl.ok) {
    audit("rate_limited", {
      status: 429,
      rateLimit: { limit: rl.limit, remaining: rl.remaining },
    });
    return NextResponse.json(
      {
        ok: false,
        code: "rate_limited",
        error: `Too many requests. Try again in ${Math.ceil(rl.resetMs / 1000)}s.`,
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil(rl.resetMs / 1000)),
          "X-RateLimit-Limit": String(rl.limit),
          "X-RateLimit-Remaining": String(rl.remaining),
        },
      },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    audit("bad_request", { status: 400, reason: "invalid json" });
    return NextResponse.json(
      { ok: false, code: "bad_request", error: "invalid json" },
      { status: 400 },
    );
  }

  // 3. Schema / size validation.
  const validated = validateBody(body);
  if (!validated.ok) {
    audit("bad_request", { status: 400, reason: validated.reason });
    return NextResponse.json(
      { ok: false, code: "bad_request", error: validated.reason },
      { status: 400 },
    );
  }
  const validBody = validated.body;
  const totalChars = validBody.messages.reduce(
    (acc, m) => acc + m.content.length,
    0,
  );

  const wantsStream =
    validBody.stream === true ||
    req.headers.get("accept")?.includes("text/event-stream");

  if (wantsStream) {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        // Track aggregated stats from the in-flight `usage` event so we
        // can write a single audit line when the stream closes.
        let auditModel: string | undefined;
        let auditToolCalls = 0;
        let auditUsage:
          | { promptTokens?: number; completionTokens?: number; totalTokens?: number }
          | undefined;
        let outcome: AiAuditOutcome = "ok";
        let errorReason: string | undefined;

        const send = (obj: unknown) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
        };
        try {
          for await (const evt of streamChat(validBody)) {
            if (evt.type === "usage") {
              // Capture for the audit log but DO NOT forward to the
              // browser — there is no reason for the client to see raw
              // token counts and we want to keep the public SSE schema
              // unchanged.
              auditModel = evt.model;
              auditToolCalls = evt.toolCalls;
              auditUsage = evt.usage;
              continue;
            }
            if (evt.type === "error") {
              outcome = (evt.code as AiAuditOutcome) ?? "error";
              errorReason = evt.error;
            }
            send(evt);
          }
        } catch (e) {
          outcome = "error";
          errorReason = e instanceof Error ? e.message : String(e);
          send({ type: "error", error: errorReason });
        } finally {
          controller.close();
          audit(outcome, {
            status: 200,
            stream: true,
            locale: validBody.locale,
            messages: validBody.messages.length,
            chars: totalChars,
            model: auditModel,
            toolCalls: auditToolCalls,
            usage: auditUsage,
            reason: errorReason,
            rateLimit: { limit: rl.limit, remaining: rl.remaining },
          });
        }
      },
    });
    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
        "X-RateLimit-Limit": String(rl.limit),
        "X-RateLimit-Remaining": String(rl.remaining),
      },
    });
  }

  const result = await runChat(validBody);
  if (!result.ok) {
    audit(result.code, {
      status: result.code === "bad_request" ? 400 : 200,
      stream: false,
      locale: validBody.locale,
      messages: validBody.messages.length,
      chars: totalChars,
      reason: result.error,
      rateLimit: { limit: rl.limit, remaining: rl.remaining },
    });
    if (result.code === "bad_request") {
      return NextResponse.json(result, { status: 400 });
    }
    return NextResponse.json(result);
  }

  audit("ok", {
    status: 200,
    stream: false,
    locale: validBody.locale,
    messages: validBody.messages.length,
    chars: totalChars,
    model: result.audit?.model,
    toolCalls: result.audit?.toolCalls,
    usage: result.audit?.usage,
    rateLimit: { limit: rl.limit, remaining: rl.remaining },
  });

  // Strip the audit field before returning to the client — it is intended
  // for server-side logging only.
  const { audit: _audit, ...publicResult } = result;
  void _audit;
  return NextResponse.json(publicResult);
}

export function GET() {
  return NextResponse.json({
    configured: !!process.env.OPENAI_API_KEY,
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
  });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function checkOrigin(req: Request):
  | { ok: true }
  | { ok: false; reason: string } {
  const host = req.headers.get("host");
  if (!host) return { ok: false, reason: "missing host" };

  const origin = req.headers.get("origin");
  const referer = req.headers.get("referer");

  // No Origin/Referer at all. Browsers always send Origin for cross-site
  // POSTs, so this almost always means a same-origin request from a script
  // tag, a server-to-server call, or a curl. Allow only in dev or when
  // explicitly opted-in via env (e.g. for local CLI scripting).
  if (!origin && !referer) {
    if (
      process.env.NODE_ENV !== "production" ||
      process.env.ARC_AI_ALLOW_NO_ORIGIN === "1"
    ) {
      return { ok: true };
    }
    return { ok: false, reason: "missing origin" };
  }

  const allowedHosts = new Set<string>([host.toLowerCase()]);
  // Accept the bare hostname even if the Host header includes a port.
  const bareHost = host.split(":")[0]?.toLowerCase();
  if (bareHost) allowedHosts.add(bareHost);
  for (const extra of (process.env.ARC_AI_ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)) {
    allowedHosts.add(extra);
    try {
      allowedHosts.add(new URL(extra).host.toLowerCase());
    } catch {}
  }

  for (const candidate of [origin, referer]) {
    if (!candidate) continue;
    let parsedHost: string;
    try {
      parsedHost = new URL(candidate).host.toLowerCase();
    } catch {
      continue;
    }
    if (allowedHosts.has(parsedHost)) return { ok: true };
    // strip port and try again
    const bare = parsedHost.split(":")[0];
    if (bare && allowedHosts.has(bare)) return { ok: true };
  }
  return { ok: false, reason: "cross-site request blocked" };
}

type ChatRole = "user" | "assistant";
type IncomingChatBody = {
  messages: Array<{ role: ChatRole; content: string }>;
  locale?: "zh" | "en";
  stream?: boolean;
};

function validateBody(body: unknown):
  | { ok: true; body: IncomingChatBody }
  | { ok: false; reason: string } {
  if (!body || typeof body !== "object") {
    return { ok: false, reason: "expected JSON object" };
  }
  const obj = body as Record<string, unknown>;
  if (!Array.isArray(obj.messages)) {
    return { ok: false, reason: "messages must be an array" };
  }
  if (obj.messages.length === 0) {
    return { ok: false, reason: "messages is empty" };
  }
  if (obj.messages.length > MAX_MESSAGES) {
    return {
      ok: false,
      reason: `too many messages (max ${MAX_MESSAGES})`,
    };
  }
  let total = 0;
  const cleaned: IncomingChatBody["messages"] = [];
  for (const raw of obj.messages) {
    if (!raw || typeof raw !== "object") {
      return { ok: false, reason: "messages[*] must be an object" };
    }
    const m = raw as Record<string, unknown>;
    const role = m.role;
    const content = m.content;
    if (role !== "user" && role !== "assistant") {
      return { ok: false, reason: "messages[*].role must be user|assistant" };
    }
    if (typeof content !== "string") {
      return { ok: false, reason: "messages[*].content must be a string" };
    }
    if (content.length > MAX_MESSAGE_CHARS) {
      return {
        ok: false,
        reason: `messages[*].content too long (max ${MAX_MESSAGE_CHARS} chars)`,
      };
    }
    total += content.length;
    cleaned.push({ role, content });
  }
  if (total > MAX_TOTAL_CHARS) {
    return {
      ok: false,
      reason: `total prompt too long (max ${MAX_TOTAL_CHARS} chars)`,
    };
  }
  const locale =
    obj.locale === "en" || obj.locale === "zh" ? obj.locale : undefined;
  return {
    ok: true,
    body: {
      messages: cleaned,
      locale,
      stream: obj.stream === true,
    },
  };
}
