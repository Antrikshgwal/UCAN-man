import { describe, it, expect } from "vitest";
import { parseEmailUCAN } from "../parser/api.ts";

const EMAIL_UCAN =
  "uOqJlcm9vdHOB2CpYJQABcRIgY1N-zV3--Qi_TVI1AjR2tJjVDZbrQ91BT1v_-um8iFRndmVyc2lvbgGgAwFxEiBjU37NXf75CL9NUjUCNHa0mNUNlutD3UFPW__66byIVKdhc1hE7aEDQCG5_qTH8kJ7sTtaKhWC9F52Uyj2NJ63t_Za6Mic4RHSF6ahAxmgSIyPGzSUHaTwBqL1b8D72Ms7TQRVMo6n5w1hdmUwLjkuMWNhdHSBo2JuYqRjYXR0gaFjY2FuYSpjYXVkeDhkaWQ6a2V5Ono2TWtrRExOVXNReUNzblJoemhLNTRMY040V01Kd1JpV1ZDVjhoVkp4OUF5RTJpVmNpc3N4IWRpZDptYWlsdG86Z21haWwuY29tOmFudHJpa3NoZ3dhbGVjYXVzZdgqWCUAAXESIC5K5VPja4NkODsdOemX24nhJe9N069JN0ahF5dTVl3NY2Nhbm5hY2Nlc3MvY29uZmlybWR3aXRoeBtkaWQ6d2ViOnVwLnN0b3JhY2hhLm5ldHdvcmtjYXVkWBmdGndlYjp1cC5zdG9yYWNoYS5uZXR3b3JrY2V4cBppY-WRY2lzc1gZnRp3ZWI6dXAuc3RvcmFjaGEubmV0d29ya2NwcmaA";

describe("parseEmailUCAN", () => {
  it("parses an email UCAN CAR and resolves causes", async () => {
    try {
      const ucan = await parseEmailUCAN(EMAIL_UCAN);

      console.log("Parsed UCAN:", ucan); // Debug output

      // Core UCAN fields exist
      expect(ucan.iss).toBeInstanceOf(Uint8Array);
      expect(ucan.aud).toBeInstanceOf(Uint8Array);
      expect(Array.isArray(ucan.att)).toBe(true);

      // Capability exists
      expect(ucan.att.length).toBeGreaterThan(0);

      // Cause is resolved (CID → UCAN)
      const cap = ucan.att[0];
      expect(cap.nb?.cause).toBeDefined();
      expect(typeof cap.nb.cause).toBe("object");

      // Signature preserved as bytes
      expect(ucan.s).toBeInstanceOf(Uint8Array);
    } catch (error) {
      console.error("Parse error:", error);
      throw error;
    }
  });
});
