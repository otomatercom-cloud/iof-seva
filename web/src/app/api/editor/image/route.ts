import { revalidatePath } from "next/cache";
import { type NextRequest } from "next/server";
import { editorCall, EDITOR_COOKIE } from "@/public/lib/editor-auth";
import { json, readJson, sameOrigin } from "@/public/lib/guard";

export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return json(403, { ok: false, error: "forbidden" });
  const sid = req.cookies.get(EDITOR_COOKIE)?.value;
  if (!sid) return json(401, { ok: false, error: "not_signed_in" });
  const { body, tooLarge } = await readJson(req, 12_000_000);
  if (tooLarge) return json(413, { ok: false, error: "too_large" });
  if (!body) return json(400, { ok: false, error: "invalid" });
  const r = await editorCall("image", sid, body);
  if (r.status === 200) revalidatePath("/", "layout");
  return json(r.status, r.data);
}
