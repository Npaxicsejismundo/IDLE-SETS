export const SITE_NAME = "IDLE Sets";
export const SITE_TITLE = "IDLE Sets — Interior Design Board Exam Reviewer";
export const SITE_DESCRIPTION =
  "Structured reviewer sets for the Licensure Examination for Interior Designers — tests and questionnaires built to sharpen your recall, accuracy, and readiness before board day.";

export const INSTAGRAM_HANDLE = "@idlesets";
export const INSTAGRAM_URL = "https://www.instagram.com/idlesets/";

/**
 * Absolute site URL for metadata, robots and sitemap.
 * Set NEXT_PUBLIC_SITE_URL once a custom domain exists; on Vercel it falls
 * back to the project's production domain.
 */
export function siteUrl(): URL {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return new URL(process.env.NEXT_PUBLIC_SITE_URL);
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return new URL(`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`);
  }
  return new URL(`http://localhost:${process.env.PORT ?? 3000}`);
}
