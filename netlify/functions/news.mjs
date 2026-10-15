import { getStore } from "@netlify/blobs";
const store = () => getStore("khobordekho");
const J = (d, s = 200) => new Response(JSON.stringify(d), { status: s, headers: { "content-type": "application/json", "cache-control": "no-store" } });
const auth = r => process.env.ADMIN_PASSWORD && r.headers.get("x-admin-password") === process.env.ADMIN_PASSWORD;
const load = async () => (await store().get("articles", { type: "json" })) || [];
const save = a => store().setJSON("articles", a);
const FIELDS = ["cat","title","title_en","desc","desc_en","content","content_en","image","featured"];
const pick = b => Object.fromEntries(FIELDS.filter(k => k in b).map(k => [k, b[k]]));

export default async (req) => {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  let all = await load();
  if (req.method === "GET") {
    if (url.searchParams.get("check")) return J({ ok: !!auth(req) });
    if (id) {
      const a = all.find(x => x.id === id);
      if (!a) return J({ error: "not found" }, 404);
      if (!url.searchParams.get("admin")) { a.views = (a.views || 0) + 1; await save(all); }
      return J(a);
    }
    return J(all.map(({ content, content_en, ...r }) => r));
  }
  if (!auth(req)) return J({ error: "Unauthorized" }, 401);
  if (req.method === "POST") {
    const a = { ...pick(await req.json()), id: Date.now().toString(36), date: new Date().toISOString(), views: 0 };
    all.unshift(a); await save(all); return J(a);
  }
  if (req.method === "PUT") {
    const b = await req.json();
    const i = all.findIndex(x => x.id === b.id);
    if (i < 0) return J({ error: "not found" }, 404);
    all[i] = { ...all[i], ...pick(b) }; await save(all); return J(all[i]);
  }
  if (req.method === "DELETE") { all = all.filter(x => x.id !== id); await save(all); return J({ ok: true }); }
  return J({ error: "Method not allowed" }, 405);
};
export const config = { path: "/api/news" };
