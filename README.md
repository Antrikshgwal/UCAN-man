UCANman helps developers debug UCAN authentication by inspecting and explaining UCAN tokens directly inside VS Code

## Features

✅ **JWT-encoded UCANs** - Decode and inspect JWT-formatted UCAN tokens
✅ **Authorization headers** - Extract UCANs from HTTP headers
✅ **CAR file support** - Upload and decode .car files containing UCANs
✅ **Request payload parsing** - Extract UCANs from HTTP request payloads
✅ **Invocation detection** - Identify and display invocation structures
✅ **Multiple formats** - Support for CAR, CBOR, JSON, base64, hex encoding
✅ **Proof chain resolution** - Automatically resolve and display proof chains
✅ **CID decoding** - Decode and display Content Identifiers

## Quick Start

1. Open VS Code Command Palette (`Cmd/Ctrl+Shift+P`)
2. Run "UCAN Inspector"
3. Choose an input method:
   - **Upload CAR file**: Browse and select a .car file
   - **Paste Request Payload**: Paste raw HTTP request body

### Request Payload Input (NEW!)

The request payload input method supports extracting UCANs and invocations from:
- CAR files (base64/base64url encoded)
- CBOR data (base64/base64url/hex)
- JSON payloads with UCAN structures

**Example workflow:**
1. Open browser DevTools (F12)
2. Go to Network tab
3. Find your UCAN-related request
4. Copy the raw request body
5. Paste into UCAN Inspector
6. View extracted UCANs and invocations

See [Request Payload Documentation](docs/REQUEST_PAYLOAD.md) for detailed usage.

## Roadmap

**Feat 1**: ✅ Extract UCAN from URLs and HTTP headers
**Feat 2**: Verify UCAN signatures using issuer's public key
**Feat 3**: UCAN authorization validation (signature, expiration, proof chain)
**Feat 4**: ✅ User-friendly UCAN visualization
**Feat 5**: ✅ CID decoding
**Feat 6**: ✅ CAR file UCAN extraction
**Feat 7**: Proof-chain visualization
**Feat 8**: ✅ Request payload UCAN extraction with invocation detection

## UCANman v2 (Planned)

- Enhanced invocation UCAN support
- Advanced DAG-CBOR decoding
- Proof chain visualization graph
- UCAN signature verification
- Authorization policy validation