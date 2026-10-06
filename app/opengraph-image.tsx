import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const alt = "IDLE Sets — Train for board-level thinking.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Satori can't read woff2, so TTF copies of the brand fonts live in /assets.
const anton = readFile(join(process.cwd(), "assets/Anton-Regular.ttf"));
const archivoBold = readFile(join(process.cwd(), "assets/Archivo-Bold.ttf"));

const INK = "#161412";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "#F3F0EA",
          color: INK,
          fontFamily: "Archivo",
        }}
      >
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "56px 72px 48px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: 999,
                background: "#FFFFFF",
                border: `3px solid ${INK}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "Anton",
                fontSize: 27,
              }}
            >
              IDLE
            </div>
            <div style={{ fontSize: 22, letterSpacing: "0.1em" }}>
              IDLE SETS
            </div>
            <div
              style={{
                marginLeft: "auto",
                fontSize: 20,
                letterSpacing: "0.14em",
                color: "#C24000",
              }}
            >
              INTERIOR DESIGN BOARD EXAM REVIEWER · LEID 2027
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              fontFamily: "Anton",
              fontSize: 128,
              lineHeight: 0.95,
            }}
          >
            <div style={{ display: "flex" }}>TRAIN FOR</div>
            <div style={{ display: "flex", color: "#E84E00" }}>BOARD-LEVEL</div>
            <div style={{ display: "flex" }}>THINKING.</div>
          </div>

          <div style={{ display: "flex", alignItems: "baseline", gap: 16 }}>
            <div style={{ fontFamily: "Anton", fontSize: 44 }}>89.77%</div>
            <div style={{ fontSize: 22, color: "#57524B" }}>
              of our members passed LEID 2026
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 28,
            height: 84,
            padding: "0 72px",
            background: "#FF5B0A",
            borderTop: `3px solid ${INK}`,
            fontFamily: "Anton",
            fontSize: 36,
          }}
        >
          {["DESIGN TODAY", "INSPIRE TOMORROW", "FOCUS", "TRUST", "CREATE"].map(
            (word, i) => (
              <div
                key={word}
                style={{ display: "flex", alignItems: "center", gap: 28 }}
              >
                {i > 0 && (
                  <div
                    style={{
                      width: 14,
                      height: 14,
                      borderRadius: 999,
                      background: INK,
                    }}
                  />
                )}
                {word}
              </div>
            ),
          )}
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Anton", data: await anton, style: "normal", weight: 400 },
        {
          name: "Archivo",
          data: await archivoBold,
          style: "normal",
          weight: 700,
        },
      ],
    },
  );
}
