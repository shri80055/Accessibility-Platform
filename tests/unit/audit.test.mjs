import test from "node:test";
import assert from "node:assert/strict";
import { runAudit } from "../../apps/api/src/audit.js";

test("audit finds missing alt, missing lang and skipped headings", () => {
  const html = `<html><head><title>t</title></head><body><img src="x.png"><h1>A</h1><h3>Skipped</h3><a href="#">click here</a></body></html>`;
  const r = runAudit(html, "http://example.test/");
  const ids = r.findings.map((f) => f.ruleId);
  assert.ok(ids.includes("img-alt")); assert.ok(ids.includes("html-lang"));
  assert.ok(ids.includes("heading-order")); assert.ok(ids.includes("link-text"));
  assert.equal(r.summary.automatedOnly, true);
});
test("audit passes a clean page and still disclaims certification", () => {
  const html = `<html lang="en"><head><title>Clean page</title></head><body><h1>Hi</h1><h2>Sub</h2><img src="x.png" alt="A building"><label for="n">Name</label><input id="n"><button>Send</button></body></html>`;
  const r = runAudit(html, "http://example.test/");
  assert.equal(r.summary.total, 0);
  assert.match(r.summary.disclaimer, /NOT a WCAG/);
});
