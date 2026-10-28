// Copies the widget source to the versioned CDN paths and prints real sizes.
// Budgets (docs/architecture/architecture.md): loader < 5 KB, bundle < 60 KB
// gzipped target. This script reports actual bytes — it never claims a size
// it did not measure.
import fs from "node:fs"; import path from "node:path"; import zlib from "node:zlib"; import { fileURLToPath } from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const pub = path.join(root, "apps/api/public/widget/v1");
fs.mkdirSync(pub, { recursive: true });
for (const [src, dest] of [
  ["packages/widget-loader/loader.js", "loader.js"],
  ["packages/widget-core/src/widget.js", "widget.js"],
]) {
  const data = fs.readFileSync(path.join(root, src));
  fs.writeFileSync(path.join(pub, dest), data);
  console.log(`${dest}: ${data.length} bytes raw, ${zlib.gzipSync(data).length} bytes gzip`);
}
console.log("Widget build complete. Serve apps/api/public/widget/ or let the API serve packages/ directly (dev).");
