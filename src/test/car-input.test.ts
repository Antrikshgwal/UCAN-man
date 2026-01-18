import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { CarInput } from "../adapters/car-adapter"; // adjust path if needed
import { serializeUCANForDisplay } from "../shared/utils"; // add this
import type { UCAN } from "../shared/types"; // adjust path if needed

describe("CAR input pipeline", () => {
  it("extracts a valid UCAN from a .car file", async () => {
    // Arrange: load real CAR file
    const carPath = path.join(__dirname, "./", "test-request.car");

    const carBytes = fs.readFileSync(carPath);

    // Act: run CAR input pipeline
    const result = await CarInput(new Uint8Array(carBytes));
    const ucan: UCAN = result.ucans[0];

    console.log("Parsed UCAN:", ucan);
    console.log("\nTotal UCANs found:", result.totalUCANs);

    // Serialize for display (like the UI does)
    const serialized = serializeUCANForDisplay(ucan);
    console.log("\nSerialized UCAN for UI:");
    console.log(JSON.stringify(serialized, null, 2));

    // Assert: minimal UCAN invariants
    expect(ucan).toBeDefined();

    expect(ucan.iss).toBeDefined();
    expect(ucan.aud).toBeDefined();
    expect(Array.isArray(ucan.att)).toBe(true);

    // UCAN must have at least one capability
    expect(ucan.att.length).toBeGreaterThan(0);

    // Verify serialization preserves key fields
    expect(serialized.att).toBeDefined();
    expect(serialized.exp).toBeDefined();
    if (ucan.att[0] && typeof ucan.att[0] === "object") {
      // If nb exists in raw UCAN, it should be in serialized version
      expect(serialized.att[0]).toBeDefined();
    }
  });
});
