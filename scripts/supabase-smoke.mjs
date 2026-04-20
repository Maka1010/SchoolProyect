import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function loadDotEnvFile(relPath) {
  const full = path.join(root, relPath);
  if (!fs.existsSync(full)) return;
  const text = fs.readFileSync(full, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (key && process.env[key] === undefined) process.env[key] = val;
  }
}

loadDotEnvFile(".env.local");
loadDotEnvFile(".env");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error("Faltan variables de entorno. Requiere NEXT_PUBLIC_SUPABASE_URL y KEY.");
  process.exit(1);
}

const supabase = createClient(url, key);

function errMsg(e) {
  if (!e) return null;
  if (typeof e === "string") return e;
  if (typeof e.message === "string") return e.message;
  return JSON.stringify(e);
}

const name = `smoke-${Date.now()}`;

const before = await supabase.from("products").select("id,name,description,price").limit(3);
console.log("project_url", url);
console.log("select_before_error", errMsg(before.error));
console.log("select_before_rows", before.data?.length ?? 0);

const ins = await supabase
  .from("products")
  .insert({ name, description: "from-smoke", price: 1.23 })
  .select("id,name,description,price")
  .single();

console.log("insert_error", errMsg(ins.error));
console.log("insert_data", ins.data);

if (ins.data?.id) {
  const after = await supabase.from("products").select("id,name").eq("id", ins.data.id);
  console.log("select_after_error", errMsg(after.error));
  console.log("select_after_rows", after.data?.length ?? 0);
}

