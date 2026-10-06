import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { MAX_PROOF_BYTES, PROOF_CONTENT_TYPES } from "@/lib/registration-rules";

// Hands the browser a short-lived token so the proof of payment uploads
// straight to Vercel Blob (files up to 10 MB would exceed the size limit for
// requests sent through the site's own server functions).

export async function POST(request: Request): Promise<Response> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return Response.json(
      { error: "Uploads aren't set up yet (BLOB_READ_WRITE_TOKEN is missing)." },
      { status: 503 },
    );
  }

  let body: HandleUploadBody;
  try {
    body = (await request.json()) as HandleUploadBody;
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  try {
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        if (!/^proofs\/[a-z0-9._-]{1,100}$/.test(pathname)) {
          throw new Error("Invalid file name.");
        }
        return {
          allowedContentTypes: PROOF_CONTENT_TYPES,
          maximumSizeInBytes: MAX_PROOF_BYTES,
          addRandomSuffix: true,
          validUntil: Date.now() + 10 * 60 * 1000,
        };
      },
    });
    return Response.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed.";
    return Response.json({ error: message }, { status: 400 });
  }
}
