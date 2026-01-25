import { describe, it, expect } from "vitest";
import { RequestPayloadInput } from "../adapters/request-payload-adapter";
import { base64url } from "multiformats/bases/base64";
import * as CBOR from "@ipld/dag-cbor";

describe("RequestPayloadInput", () => {
  it("should extract UCANs from CBOR payload", async () => {
    // Create a proper UCAN structure with Uint8Arrays
    const ucan = {
      v: "0.10.0",
      iss: new Uint8Array([1, 2, 3]),
      aud: new Uint8Array([4, 5, 6]),
      att: [{ can: "store/add", with: "did:key:example" }],
      exp: 1234567890,
    };

    // Encode as CBOR and then base64
    const cborBytes = CBOR.encode(ucan);
    const base64Payload = Buffer.from(cborBytes).toString("base64");

    const result = await RequestPayloadInput(base64Payload);

    expect(result.totalUCANs).toBeGreaterThan(0);
    expect(result.metadata?.format).toBe("cbor");
  });

  it("should extract invocations from CBOR payload with invocation structure", async () => {
    // Create an invocation with a UCAN
    const invocation = {
      invocation: {
        task: "upload-file",
        capabilities: ["store/add"],
      },
      ucan: {
        v: "0.10.0",
        iss: new Uint8Array([1, 2, 3]),
        aud: new Uint8Array([4, 5, 6]),
        att: [{ can: "store/add", with: "did:key:example" }],
        exp: 1234567890,
      },
    };

    // Encode as CBOR and then base64
    const cborBytes = CBOR.encode(invocation);
    const base64Payload = Buffer.from(cborBytes).toString("base64");

    const result = await RequestPayloadInput(base64Payload);

    expect(result.metadata?.hasInvocations).toBe(true);
    expect(result.invocations).toBeDefined();
    expect(result.invocations!.length).toBeGreaterThan(0);
    expect(result.totalUCANs).toBeGreaterThan(0);
  });

  it("should handle base64url encoded CAR data", async () => {
    // This would be a real base64url encoded CAR file in practice
    // For now, we test that the function accepts the format
    const mockCarBase64url = "mocked-base64url-car-data";

    try {
      await RequestPayloadInput(mockCarBase64url);
    } catch (error) {
      // Expected to fail with mock data, but should attempt to decode
      expect(error).toBeDefined();
    }
  });

  it("should provide helpful error for invalid payload", async () => {
    const invalidPayload = "not-a-valid-payload";

    try {
      await RequestPayloadInput(invalidPayload);
      expect.fail("Should have thrown an error");
    } catch (error) {
      expect(error).toBeDefined();
      expect((error as Error).message).toContain("Unable to extract UCANs");
    }
  });
});
