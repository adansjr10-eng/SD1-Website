import { test } from "node:test";
import assert from "node:assert/strict";
import {
  demoEntries,
  filterTesters,
  displaySpec,
  comparisonCsv,
  validateFile,
} from "../lib/data";
test("search includes organization, tags, and specifications; unknown capacities do not match minimums", () => {
  assert.equal(
    filterTesters(demoEntries, "axlebox", "", "", "", "name").length,
    1,
  );
  assert.equal(filterTesters(demoEntries, "", "", "1", "", "recent").length, 0);
  const real = { ...demoEntries[0], specs: { load: 20, speed: 150, rpm: 500 } };
  assert.equal(filterTesters([real], "", "", "20", "150", "load").length, 1);
  assert.equal(filterTesters([real], "", "", "21", "", "load").length, 0);
  assert.equal(
    filterTesters(demoEntries, "", "System testing", "", "", "name")[0].id,
    "demo-3",
  );
});
test("unit conversions preserve unknown values and zero", () => {
  assert.equal(displaySpec("load", undefined, true), "Not documented");
  assert.equal(displaySpec("load", 0, false), "0 kN");
  assert.equal(displaySpec("speed", 160.9344, true), "100 mph");
  assert.equal(displaySpec("load", 1, true), "224.8 lbf");
});
test("CSV quotes titles, labels demonstration data, and neutralizes spreadsheet formulas", () => {
  const csv = comparisonCsv(
    [
      {
        ...demoEntries[0],
        title: "=SUM(1,2)",
        organization: 'A "quoted" name',
      },
    ],
    false,
  );
  assert.ok(csv.includes('"\'=SUM(1,2)"'));
  assert.ok(csv.includes('A ""quoted"" name'));
  assert.ok(csv.includes("Demonstration — unverified"));
  assert.ok(csv.includes("Not documented"));
});
test("upload validation rejects unsupported, spoofed, oversized, and empty files", () => {
  assert.equal(
    validateFile({ name: "drawing.pdf", type: "application/pdf", size: 500 }),
    null,
  );
  assert.equal(validateFile({ name: "part.step", type: "", size: 500 }), null);
  assert.ok(validateFile({ name: "code.html", type: "text/html", size: 500 }));
  assert.ok(validateFile({ name: "image.png", type: "text/html", size: 500 }));
  assert.ok(
    validateFile({
      name: "paper.pdf",
      type: "application/pdf",
      size: 26 * 1024 * 1024,
    }),
  );
  assert.ok(validateFile({ name: "empty.txt", type: "text/plain", size: 0 }));
});
