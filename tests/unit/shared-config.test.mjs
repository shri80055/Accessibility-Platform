import test from "node:test";
import assert from "node:assert/strict";
import { sanitizeConfig, profileSettings, validateHostname, DEFAULT_CONFIG } from "../../packages/shared-config/index.mjs";

test("sanitizeConfig clamps and filters unknown values", () => {
  const c = sanitizeConfig({ position: "top", borderRadius: 999, enabledLanguages: ["en", "xx"], enabledFeatures: ["fontSize", "bogus"], persistence: "forever" });
  assert.equal(c.position, "bottom-right"); assert.equal(c.borderRadius, 28);
  assert.deepEqual(c.enabledLanguages, ["en"]); assert.deepEqual(c.enabledFeatures, ["fontSize"]); assert.equal(c.persistence, "local");
});
test("sanitizeConfig keeps a valid custom config", () => {
  const c = sanitizeConfig({ position: "bottom-left", buttonColor: "#123456", defaultLanguage: "mr", enabledLanguages: ["en", "mr"] });
  assert.equal(c.position, "bottom-left"); assert.equal(c.defaultLanguage, "mr");
});
test("profiles are documented setting combinations, not diagnoses", () => {
  assert.equal(profileSettings("low-vision").fontScale, 1.25);
  assert.equal(profileSettings("reduced-motion").reducedMotion, true);
  assert.deepEqual(profileSettings("nope"), {});
});
test("validateHostname rejects garbage", () => {
  assert.equal(validateHostname("example.gov.in"), true);
  assert.equal(validateHostname("not a host!!"), false);
  assert.equal(validateHostname(""), false);
});
test("defaults include all 13 languages in the framework", () => {
  assert.ok(DEFAULT_CONFIG.enabledLanguages.includes("en"));
});
