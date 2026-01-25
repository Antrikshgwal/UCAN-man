# 🔐 UCANman V1

<p align="center">
  <img src="https://img.shields.io/badge/version-1.0-blue.svg" alt="Version 1.0">
  <img src="https://img.shields.io/badge/VS%20Code-Extension-blue.svg" alt="VS Code Extension">
  <img src="https://img.shields.io/badge/UCAN-Inspector-green.svg" alt="UCAN Inspector">
</p>

**UCANman** is a powerful VS Code extension that helps developers debug and inspect UCAN (User Controlled Authorization Network) tokens. With an intuitive, Postman-inspired interface, UCANman makes it easy to decode, analyze, and understand UCAN authentication flows directly inside your development environment.

---

## ✨ Features

### 🔍 Core Capabilities
- ✅ **JWT-encoded UCANs** - Decode and inspect JWT-formatted UCAN tokens
- ✅ **CAR File Support** - Upload and decode `.car` files containing UCAN tokens
- ✅ **Request Payload Parsing** - Extract UCANs from HTTP request payloads
- ✅ **Invocation Detection** - Identify and display invocation structures
- ✅ **Multiple Format Support** - CAR, CBOR, JSON, base64, base64url, hex encoding
- ✅ **Proof Chain Resolution** - Automatically resolve and display proof chains
- ✅ **CID Decoding** - Decode and display Content Identifiers (CIDs)
- ✅ **Authorization Headers** - Extract UCANs from HTTP headers

---

## 🚀 Quick Start

### Installation
1. Open VS Code
2. Go to Extensions (`Ctrl+Shift+X` or `Cmd+Shift+X`)
3. Search for "UCANman"
4. Click Install

### Launch UCANman
1. Open the Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P`)
2. Type "UCAN Inspector" and press Enter
3. The UCANman panel will open

---

## 📖 Input Methods

UCANman V1 provides two powerful input methods to analyze UCAN tokens:

### 1. 📦 CAR File Upload

**Best for:** Analyzing UCAN tokens stored in CAR (Content Addressable aRchive) files

**How to use:**
1. Click on the **📦 CAR File** tab
2. Click the upload area or drag & drop your `.car` file
3. Click **🔍 Decode CAR File**
4. View the extracted UCANs with all their details

**Supported:**
- Standard `.car` files containing UCAN tokens
- Multiple UCANs within a single CAR file
- CID resolution and proof chain extraction

---

### 2. 📄 Request Payload

**Best for:** Debugging live API requests and network traffic

**How to use:**
1. Click on the **📄 Request Payload** tab
2. Copy request data from your browser's DevTools:
   - Open DevTools (`F12` or `Cmd+Option+I`)
   - Go to the **Network** tab
   - Find your UCAN-related API request
   - Click on it and navigate to **Payload** or **Request** tab
   - Click "View source" or "Raw" to see the raw data
   - Copy the entire payload
3. Paste the data into the text area
4. Click **🔍 Decode Payload**
5. View extracted UCANs and invocations

**Supported Formats:**
- **Base64-encoded CAR files** - Direct CAR file data in base64
- **Base64/Base64url-encoded CBOR** - Compact binary format
- **Hex-encoded CBOR** - Hexadecimal representation
- **JSON Payloads** - Raw JSON containing UCAN structures
- **Invocation Data** - UCAN invocation requests with task details

**Example Use Cases:**
- Debugging web3.storage API calls
- Analyzing UCAN delegations in IPFS workflows
- Inspecting authorization tokens in decentralized apps
- Validating UCAN chains in service-to-service communication

---

## 🎯 Understanding the Output

When you decode a UCAN token, UCANman displays the following information in an organized, collapsible format:

### 📊 Metadata Section
- **Format Type** - Indicates the detected format (CAR, CBOR, JSON)
- **Invocation Status** - Shows if invocation data is present

### 🔐 UCAN Structure
Each UCAN token is displayed with these key fields:

| Field | Description |
|-------|-------------|
| **Issuer (iss)** | DID of the entity that created the UCAN token |
| **Audience (aud)** | DID of the entity authorized to use the token |
| **Capabilities (att)** | List of authorized actions and resources |
| **Expiration (exp)** | Unix timestamp when the token expires |
| **Not Before (nbf)** | Unix timestamp when the token becomes valid |
| **Proofs (prf)** | Chain of parent UCANs proving authorization |
| **Facts (fct)** | Additional contextual data |
| **Nonce (nnc)** | Unique identifier to prevent replay attacks |

### ⚡ Invocations
When present, invocations show:
- **Task Name** - The action being requested (e.g., `store/add`, `upload/list`)
- **Capabilities** - Specific permissions being used
- **Parameters** - Task-specific data (links, sizes, etc.)
- **Associated UCAN** - The authorization token for the invocation

---

## 💡 Usage Examples

### Example 1: Analyzing a CAR File
```
1. Download a .car file from your IPFS/web3.storage workflow
2. Open UCANman via Command Palette
3. Switch to "📦 CAR File" tab
4. Upload the file
5. Click "Decode CAR File"
6. Expand individual UCAN cards to inspect details
```

### Example 2: Debugging API Requests
```
1. Open your web application
2. Open Browser DevTools (F12)
3. Navigate to Network tab
4. Perform an action that uses UCAN authorization
5. Find the relevant request in the network log
6. Copy the request payload
7. Open UCANman and switch to "📄 Request Payload" tab
8. Paste the payload and click "Decode Payload"
9. Analyze the extracted UCANs and invocations
```

### Example 3: Validating UCAN Chains
```
1. Decode a UCAN token using either method
2. Look for the "prf" (proofs) field
3. Each proof is a parent UCAN in the authorization chain
4. Verify the capabilities flow from parent to child
5. Check expiration times across the chain
```

---

## 🛣️ Roadmap

### 🚧 Upcoming Features
- **UCAN Signature Verification** - Cryptographically verify issuer signatures
- **Proof Chain Visualization** - Interactive graph showing authorization flow
- **UCAN Authorization Validation** - Automatic policy and capability checking
- **Export Capabilities** - Save decoded UCANs as JSON
- **Advanced DAG-CBOR Support** - Enhanced support for complex CBOR structures
- **Multi-file Analysis** - Compare and analyze multiple UCANs side-by-side

---

## 🔧 Technical Details

### Encoding Support
- Base64 (standard)
- Base64url (URL-safe)
- Hexadecimal
- CBOR (Concise Binary Object Representation)
- JWT (JSON Web Token)
- CAR (Content Addressable aRchive)

### Data Formats
- JSON
- CBOR
- DAG-CBOR
- Multibase
- CID (Content Identifier)

---

## 📚 Resources

- **UCAN Specification**: [https://github.com/ucan-wg/spec](https://github.com/ucan-wg/spec)
- **Request Payload Documentation**: See [docs/REQUEST_PAYLOAD.md](docs/REQUEST_PAYLOAD.md)
- **Architecture Documentation**: See [docs/ARCHITECTURE_DIAGRAM.md](docs/ARCHITECTURE_DIAGRAM.md)

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues, pull requests and feature requests.

---

## 🙏 Acknowledgments

UCANman is built with support from the decentralized web community and leverages open-source libraries for CBOR, CID, and CAR file processing.

---

<p align="center">Made with ❤️ for the decentralized web</p>