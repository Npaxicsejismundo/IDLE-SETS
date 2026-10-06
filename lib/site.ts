export const SITE_NAME = "IDLE Sets";
export const SITE_TITLE = "IDLE Sets — Interior Design Board Exam Reviewer";
export const SITE_DESCRIPTION =
  "Structured reviewer sets for the Licensure Examination for Interior Designers — tests and questionnaires built to sharpen your recall, accuracy, and readiness before board day.";

export const INSTAGRAM_HANDLE = "@idlesets";
export const INSTAGRAM_URL = "https://www.instagram.com/idlesets/";

/**
 * The Google Form members fill in to register (shown on /subscribe).
 * Use the link respondents open, ending in /viewform — not the /edit link.
 */
export const MEMBERSHIP_FORM_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLSdMMFBYmEatlqEf16sfQD_8Dsfs1SugDtH8M9JmA9t92-Adng/viewform";
export const MEMBERSHIP_FORM_EMBED_URL = `${MEMBERSHIP_FORM_URL}?embedded=true`;

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
