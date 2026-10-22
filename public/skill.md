# 888IP Network & IP Toolbox (888-ip) Agent Skill

---
name: 888-ip
description: Comprehensive network diagnostic toolbox. Check caller's public IPv4/IPv6, query IP geolocation (country, city, coordinates, ASN, ISP), test DNS leaks, WebRTC connections, query domain WHOIS, resolve DNS over HTTPS (DoH), and inspect global network latency. Supports Chrome WebMCP, Model Context Protocol (MCP JSON-RPC 2.0), and REST APIs.
---

## Overview
888IP (https://ip.david888.com) is an open-source, privacy-friendly network and IP diagnostic toolbox. It enables developers, LLMs, and AI Agents to inspect public IP addresses, query ASN/BGP routing, analyze DNS records, examine WHOIS ownership, and interact with the webpage via the Web Model Context Protocol (WebMCP).

Server Base URL: https://ip.david888.com

---

## Chrome WebMCP (Web Model Context Protocol) Support
888IP natively implements Google Chrome's WebMCP specification (`https://developer.chrome.com/docs/ai/webmcp`). When loaded in Chrome, AI assistants (Gemini in Chrome, Chrome built-in Prompt API, or AI extensions) can directly discover and invoke tools registered on `navigator.modelContext`, `document.modelContext`, and `window.modelContext`.

### Registered In-Browser Tools

| Tool Name | Parameters | Description |
| :--- | :--- | :--- |
| `get_my_ip` | `{}` | Retrieve the user's public IPv4 and IPv6 addresses, location, ISP, and ASN. |
| `lookup_ip` | `{ ip: string, lang?: string }` | Query geolocation, ASN, company, and organization for any specified IPv4/IPv6. |
| `whois_lookup` | `{ query: string }` | Perform WHOIS / RDAP lookup for domains (e.g. `google.com`) or IP addresses. |
| `resolve_dns` | `{ hostname: string, type?: string }` | Query DNS records via DoH (`A`, `AAAA`, `CNAME`, `MX`, `TXT`, `NS`). |
| `mac_vendor_lookup` | `{ mac: string }` | Look up hardware manufacturer from MAC address or OUI prefix. |
| `check_censorship` | `{ url?: string }` | Test website reachability from multiple global geographic vantage points. |
| `test_connectivity` | `{}` | Measure real-time latency to major internet backbones (Google, Cloudflare, GitHub). |
| `get_browser_info` | `{}` | Extract client browser fingerprint, platform, GPU renderer, and WebRTC leak state. |
| `navigate_to` | `{ section: string }` | Programmatically scroll the UI to `IPInfo`, `Connectivity`, `WebRTC`, `SpeedTest`, etc. |
| `toggle_dark_mode` | `{ mode?: string }` | Toggle interface theme (`light`, `dark`, or `auto`). |

### Testing Bridge
Inspect registered WebMCP tools in the DevTools console:
```javascript
// List all active tools
await window.__webmcp.getTools();

// Execute a tool
await window.__webmcp.executeTool('get_my_ip');
```

---

## Agent Installation & Setup Instructions
If you are an LLM or AI Agent accessing 888IP via HTTP/API:
1. Use **GET `/api/ip`** or `curl https://ip.david888.com/api/ip` to retrieve the caller's public IP (plain text or JSON).
2. Use **GET `/api/ipinfo?ip=<IP>`** to retrieve detailed geolocation, ISP, and ASN data.
3. Use **GET `/api/dnsresolver?hostname=<DOMAIN>&type=<TYPE>`** to perform DoH DNS queries.
4. Use **GET `/api/whois?query=<DOMAIN_OR_IP>`** to query WHOIS registration data.
5. Use **POST `/mcp` or `/api/mcp`** to send standard Model Context Protocol (JSON-RPC 2.0) messages.

---

## API Endpoints & Usage

### 1. Caller Public IP
- **GET Request**: `https://ip.david888.com/api/ip`
- **Curl**: `curl https://ip.david888.com/api/ip`
- **JSON Response** (with `Accept: application/json`):
```json
{
  "ip": "1.163.194.10",
  "status": "success"
}
```

### 2. IP Geolocation Lookup
- **GET Request**: `https://ip.david888.com/api/ipinfo?ip=1.1.1.1`
- **Response**:
```json
{
  "ip": "1.1.1.1",
  "country_name": "Australia",
  "country_code": "AU",
  "region": "Queensland",
  "city": "Brisbane",
  "latitude": "-27.4698",
  "longitude": "153.0251",
  "asn": "AS13335",
  "org": "Cloudflare, Inc."
}
```

### 3. DNS-over-HTTPS (DoH) Resolver
- **GET Request**: `https://ip.david888.com/api/dnsresolver?hostname=google.com&type=A`
- **Response**:
```json
{
  "hostname": "google.com",
  "type": "A",
  "answers": [
    { "name": "google.com", "type": 1, "TTL": 300, "data": "142.250.198.46" }
  ]
}
```

### 4. WHOIS Query
- **GET Request**: `https://ip.david888.com/api/whois?query=github.com`

### 5. Model Context Protocol (MCP) Endpoint
- **URL**: `https://ip.david888.com/mcp`
- **Method**: `POST`
- **Headers**: `Content-Type: application/json`
- **Example Payload**:
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "lookup_ip_geo",
    "arguments": {
      "ip": "8.8.8.8"
    }
  }
}
```
