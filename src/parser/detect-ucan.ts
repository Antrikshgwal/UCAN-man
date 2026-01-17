export function isUCAN(obj: any): boolean {
  return (
    obj &&
    typeof obj === "object" &&
    obj.iss instanceof Uint8Array &&
    obj.aud instanceof Uint8Array &&
    Array.isArray(obj.att)
  );
}
