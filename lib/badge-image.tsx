import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

/**
 * Renders the round "IDLE" badge as a PNG for favicons.
 * `background` fills the square behind the circle (transparent if omitted).
 */
export async function badgeImage({
  size,
  background,
}: {
  size: number;
  background?: string;
}) {
  const anton = await readFile(join(process.cwd(), "assets/Anton-Regular.ttf"));
  const circle = background ? Math.round(size * 0.8) : size;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: background ?? "transparent",
        }}
      >
        <div
          style={{
            width: circle,
            height: circle,
            borderRadius: 999,
            background: "#FFFFFF",
            border: `${Math.max(2, Math.round(circle / 24))}px solid #161412`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "Anton",
            fontSize: Math.round(circle * 0.36),
            color: "#161412",
          }}
        >
          IDLE
        </div>
      </div>
    ),
    {
      width: size,
      height: size,
      fonts: [{ name: "Anton", data: anton, style: "normal", weight: 400 }],
    },
  );
}
