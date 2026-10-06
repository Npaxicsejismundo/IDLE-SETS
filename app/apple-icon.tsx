import { badgeImage } from "@/lib/badge-image";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return badgeImage({ size: size.width, background: "#F3F0EA" });
}
