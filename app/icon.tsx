import { ImageResponse } from "next/og";

// ---------------------------------------------------------------------------
// Fallback favicon (dynamically generated). This navy "AIMT" monogram is used
// until a real logo file is added at public/images/aimt-logo.png — the
// <Logo> component already prefers that file when it exists.
// ---------------------------------------------------------------------------

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#0b1f3a",
          color: "#ffffff",
          fontFamily: "Georgia, 'Times New Roman', serif",
        }}
      >
        <div style={{ fontSize: 148, fontWeight: 700, letterSpacing: 10 }}>
          AIMT
        </div>
        <div
          style={{
            marginTop: 18,
            fontSize: 26,
            letterSpacing: 6,
            color: "#e8a020",
          }}
        >
          AMBALIKA INSTITUTE
        </div>
        <div style={{ marginTop: 8, fontSize: 20, color: "#9fb3d1" }}>
          Lucknow, Uttar Pradesh
        </div>
      </div>
    ),
    { ...size },
  );
}
