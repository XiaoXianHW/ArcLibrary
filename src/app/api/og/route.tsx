import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

export const runtime = "edge";

const WIDTH = 1200;
const HEIGHT = 630;

const BG = "#0e0e10";
const FG = "#ededed";
const FG_MUTED = "#9b9ba3";
const FG_SUBTLE = "#6c6c75";
const BORDER = "#25252a";
const ACCENT = "#FFD55C";

function clamp(input: string | null, max: number, fallback = ""): string {
  if (!input) return fallback;
  const trimmed = input.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1).trimEnd()}…`;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const title = clamp(searchParams.get("title"), 110, "ArcLibrary");
  const description = clamp(searchParams.get("description"), 220);
  const kicker = clamp(searchParams.get("kicker"), 80);

  const titleSize = title.length > 60 ? 64 : title.length > 30 ? 80 : 96;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: BG,
          color: FG,
          fontFamily: "Inter, system-ui, sans-serif",
          padding: "72px 88px",
          position: "relative",
        }}
      >
        {/* Top hairline accent */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 6,
            display: "flex",
          }}
        >
          <div style={{ width: 96, background: ACCENT }} />
          <div style={{ flex: 1, background: BORDER }} />
        </div>

        {/* Brand row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            color: FG_SUBTLE,
            fontFamily: "JetBrains Mono, ui-monospace, monospace",
            fontSize: 18,
            letterSpacing: "0.32em",
            textTransform: "uppercase",
          }}
        >
          <span>arc::library</span>
          {kicker ? <span style={{ color: FG_MUTED }}>{kicker}</span> : null}
        </div>

        {/* Title block */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            flex: 1,
            paddingTop: 48,
            paddingBottom: 24,
          }}
        >
          <div
            style={{
              fontSize: titleSize,
              fontWeight: 600,
              letterSpacing: "-0.02em",
              lineHeight: 1.05,
              color: FG,
              display: "flex",
            }}
          >
            {title}
          </div>
          {description ? (
            <div
              style={{
                marginTop: 28,
                maxWidth: 980,
                fontSize: 30,
                lineHeight: 1.4,
                color: FG_MUTED,
                display: "flex",
              }}
            >
              {description}
            </div>
          ) : null}
        </div>

        {/* Bottom rule + footer */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 18,
          }}
        >
          <div style={{ height: 1, background: BORDER }} />
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              color: FG_SUBTLE,
              fontFamily: "JetBrains Mono, ui-monospace, monospace",
              fontSize: 18,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
            }}
          >
            <span>Personal knowledge · AI-augmented</span>
            <span style={{ color: FG_MUTED }}>read · search · ask</span>
          </div>
        </div>
      </div>
    ),
    {
      width: WIDTH,
      height: HEIGHT,
      headers: {
        // Cached at the edge for an hour, allow stale for a day.
        "Cache-Control":
          "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
      },
    },
  );
}
