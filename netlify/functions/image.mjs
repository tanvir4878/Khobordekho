import { getStore } from "@netlify/blobs";
const store = () => getStore("khobordekho-images");
export default async (req) => {
  const url = new URL(req.url);
  if (req.method === "GET") {
    const f = await store().get(url.searchParams.get("id") || "x", { type: "arrayBuffer" });
    if (!f) return new Response("Not found", { status: 404 });
    return new Response(f, { headers: { "content-type": "image/jpeg", "cache-control": "public, max-age=31536000" } });
  }
  if (req.method === "POST") {
    if (!process.env.ADMIN_PASSWORD || req.headers.get("x-admin-password") !== process.env.ADMIN_PASSWORD)
      return new Response("Unauthorized", { status: 401 });
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    await store().set(id, await req.arrayBuffer());
    return Response.json({ url: "/api/image?id=" + id });
  }
  return new Response("Method not allowed", { status: 405 });
};
export const config = { path: "/api/image" };
