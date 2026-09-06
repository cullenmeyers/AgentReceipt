import assert from "node:assert/strict";
import test from "node:test";
import { compareUtf16, jcsCanonicalize } from "../src/jcs.js";

test("JCS sorts raw names by UTF-16 and emits numeric-looking keys manually", () => {
  assert.equal(jcsCanonicalize({ 2: 2, 10: 10, 1: 1, 100: 100, "01": 1 }), '{"01":1,"1":1,"10":10,"100":100,"2":2}');
  assert.deepEqual(["\u{1f600}", "\ufffd"].sort(compareUtf16), ["\u{1f600}", "\ufffd"]);
});

test("JCS uses ECMAScript number and string serialization", () => {
  assert.equal(jcsCanonicalize([-0, 1e30, 1e-7, 0.000001, 333333333.33333329]), '[0,1e+30,1e-7,0.000001,333333333.3333333]');
  assert.equal(jcsCanonicalize("quote\" slash\\ line\n tab\t return\r control\u0001 é"), '"quote\\\" slash\\\\ line\\n tab\\t return\\r control\\u0001 é"');
});

test("JCS rejects unsupported values and malformed Unicode", () => {
  const invalid: unknown[] = [undefined, 1n, NaN, Infinity, -Infinity, () => undefined, Symbol("x"), "\ud800", "\udc00"];
  for (const value of invalid) assert.throws(() => jcsCanonicalize(value), TypeError);
  assert.throws(() => jcsCanonicalize([, 1]), /sparse array/);
  const cyclic: Record<string, unknown> = {};
  cyclic.self = cyclic;
  assert.throws(() => jcsCanonicalize(cyclic), /cyclic/);
  assert.throws(() => jcsCanonicalize({ ["\ud800"]: 1 }), /surrogate/);
  assert.throws(() => jcsCanonicalize(new Date()), /object type/);
});
