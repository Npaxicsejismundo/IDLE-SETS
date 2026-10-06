import { get } from "@vercel/blob";
import { isAdmin } from "@/lib/admin-auth";
import { getRegistration } from "@/lib/registrations";

// Streams a private proof-of-payment file to a signed-in admin.

export async function GET(_request: Request, ctx: RouteContext<"/admin/proofs/[id]">) {
  if (!(await isAdmin())) return new Response("Not signed in.", { status: 401 });

  const { id } = await ctx.params;
  const registration = await getRegistration(id);
  if (!registration) return new Response("Not found.", { status: 404 });

  const blob = await get(registration.proofUrl, { access: "private" }).catch(() => null);
  if (!blob || blob.statusCode !== 200) {
    return new Response("Proof file not found.", { status: 404 });
  }

  const ext = registration.proofPathname.split(".").pop() ?? "file";
  const filename = `proof-${registration.id}.${ext.replace(/[^a-z0-9]/gi, "")}`;
  return new Response(blob.stream, {
    headers: {
      "Content-Type": blob.blob.contentType,
      "Content-Length": String(blob.blob.size),
      "Content-Disposition": `inline; filename="${filename}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
