# Changelog

All notable changes to this project will be documented in this file.

## [2026-08-23]

### Added
- **WebMCP (Web Model Context Protocol) Support**:
  - Implemented the Chrome WebMCP standard (`document.modelContext.registerTool`, `getTools`, `executeTool`, and `toolchange` events) with backward compatibility for `navigator.modelContext` and fallback Polyfill.
  - Registered 10 structured tools for browser AI agents (Chrome AI, Gemini Auto-Browse, Model Context Tool Inspector):
    1. `get_my_ip`: Retrieve current public IPv4/IPv6, geolocation, ISP, ASN, and detection node data.
    2. `lookup_ip`: Query geolocation, ASN, ISP, proxy/VPN detection, and risk scores for any IP or domain.
    3. `whois_lookup`: Query domain/IP WHOIS registration, status, dates, and nameservers.
    4. `resolve_dns`: Resolve DNS records (A, AAAA, CNAME, MX, TXT, NS) via global public DNS and DoH resolvers.
    5. `mac_vendor_lookup`: Query MAC address OUI to identify hardware vendor and specs.
    6. `check_censorship`: Test domain accessibility and censorship across global nodes (GFW, etc.).
    7. `test_connectivity`: Test network latency and availability to major global services (Google, Cloudflare, YouTube, GitHub, etc.).
    8. `get_browser_info`: Inspect client browser environment, User-Agent, GPU/WebGL, screen, and network connection.
    9. `navigate_to`: Navigate web application to specific tool routes (`/pingtest`, `/whois`, `/dnsresolver`, etc.).
    10. `toggle_dark_mode`: Toggle or set dark mode / light mode theme.
  - **Declarative WebMCP Forms**: Annotated search and tool forms (`QueryIP`, `Whois`, `DnsResolver`, `MacChecker`, `CensorshipCheck`) with `toolname`, `tooldescription`, `toolparamdescription`, `toolautosubmit`, handling `SubmitEvent.agentInvoked` and `event.respondWith()`.
  - **Agent Focus Indicators**: Added `:tool-form-active` and `:tool-submit-active` CSS styles in `frontend/style/webmcp.css`.
  - **DevTools & Extension Bridge**: Exposed `window.__webmcp` for testing in developer console and with Chrome Model Context Tool Inspector.

## [2026-08-19]

### Added
- **Model Context Protocol (MCP) Server Endpoint**: Added `/mcp` and `/api/mcp` endpoints supporting JSON-RPC 2.0 (`initialize`, `ping`, `tools/list`, `tools/call`) for AI agents like Claude Desktop, Cursor, and CLI tools.
- **WebMCP Browser Standard Support**: Implemented `frontend/utils/webmcp.js` to register 8888IP diagnostic tools directly with `document.modelContext.registerTool` for Chrome 146+ and WebMCP-compatible browser AI agents.
- **Core MCP Toolset**: Packaged 6 essential network diagnostics into MCP tool definitions (`common/mcp.js`):
  1. `get_client_ip`: Retrieves caller public IP, geolocation, user agent, and timestamp.
  2. `lookup_ip_geo`: Performs detailed IP geolocation, ASN, ISP, datacenter, and proxy lookups.
  3. `resolve_dns`: Executes cross-provider DoH DNS resolution (Google, Cloudflare, AdGuard, AliDNS).
  4. `whois_lookup`: Inspects RDAP / WHOIS domain and IP registration data.
  5. `mac_lookup`: Looks up MAC OUI vendor and hardware manufacturer details.
  6. `cf_radar_lookup`: Fetches Cloudflare Radar ASN intelligence statistics.
- **Cloudflare WebMCP Edge Compatibility**: Enabled `/mcp` compatibility with Cloudflare's `Site MCP Server` edge bridge (`/.webmcp/bridge.js`).
- **MCP Documentation**: Updated `README.md`, `public/llms.txt`, and `public/llms-full.txt` with MCP endpoint specifications and sample payloads.

## [2026-08-10]

### Added
- **Social Preview Image (`og:image`)**: Generated and added high-resolution 1200x630 social preview image (`public/og-image.jpg`) for Open Graph and Twitter cards.
- **Structured Data (JSON-LD)**: Added Schema.org `WebApplication` structured data script in `index.html` to enable rich search snippets.
- **Accessibility & SEO H1 Heading**: Added semantic `<h1 class="visually-hidden">` heading to static HTML for search engine crawlers and screen readers.
- **Browser Info Homepage Placement**: Embedded the `BrowserInfo` (瀏覽器資訊) component directly beneath `IPCheck` on the homepage for immediate access to User Agent, OS, GPU, CPU cores, and browser fingerprint.
- **Invisibility Test Free Access**: Removed login restrictions from `InvisibilityTest` so visitors can run proxy/VPN threat detection without logging in, with fast local environment fallback.
- **Surfshark DNS Leak Integration**: Replaced legacy `edns.ip-api.com` in `DnsLeaksTest` with Surfshark DNS resolvers across all 4 leak test cards.
- **Rule Test Fallback**: Added `/cdn-cgi/trace` fallback in `RuleTest` so unconfigured `ptest-*.ip.david888.com` subdomains degrade gracefully instead of throwing DNS errors.
- **AI Agent Discovery (`llms.txt`)**: Added `public/llms.txt` and `public/llms-full.txt` compliant with `llmstxt.org` standards, providing AI agents with structured API indexes.

### Changed
- **SEO Title & Description Optimization**: Optimized `<title>` to 51 characters (`8888IP - Check My IP Address, DNS Leak & Speed Test`) and meta description to 144 characters (`An open-source IP toolbox to check your IP address, IP geolocation, DNS leaks, WebRTC connections, domain WHOIS, and global network latency.`).
- **Reactive Auto-Hide Failed IP Cards**: Updated `hideUnavailableIPStack` default to `true` in `store.js` and added `visibleCards` reactive filter in `IpInfos.vue` so failed cards hide immediately on first page load without requiring a page refresh.
- **IPify IPv4 & Provider Reliability**: Replaced `CN Source` (`cnsource`) with `IPify IPv4` (`ipify_v4`) with multi-tier fallbacks (`api4.ipify.org` -> `api.ipify.org` -> `/api/ip`).
- **Connectivity Test Reordering**: Reordered connectivity target sites so international services (Google, Cloudflare, YouTube, GitHub, ChatGPT) appear first, and Mainland China services (Taobao, Baidu, WeChat) are placed at the bottom.
- **Footer Technical Provider Link**: Updated Footer copyright to always display `技術提供： david888.com` pointing to `https://david888.com`.
- **Serverless Cloudflare Worker Architecture**: Migrated backend infrastructure from VPS/Express to 100% serverless Cloudflare Workers with Static Assets (`@cloudflare/kv-asset-handler`).

### Fixed
- **Open Graph & Twitter Meta Tags**: Added missing `og:url`, `og:site_name`, `og:locale`, `twitter:card` (`summary_large_image`), `twitter:site` (`@tbdavid2019`), `twitter:image`, and `canonical` URL link.
- **Apple Touch Icon Link**: Fixed `apple-touch-icon` to correctly reference PNG logo (`/logos/ios-logo-192.png`) instead of SVG.
- **Viewport Meta Tag Duplication**: Removed duplicate `<meta name="viewport">` declaration in `index.html`.
- **Invisibility Test Button UI**: Fixed missing button text during testing by replacing raw Bootstrap `spinner-grow` with `[spinner] 檢測中...` text label.
- **Traditional Chinese (zh-TW) i18n**: Fixed Simplified Chinese vocabulary in `zh.json` and PWA installation dialogs (`PWA.vue`, `index.html`).
- **UTF-8 Charset for `llms.txt`**: Added explicit route handlers in `worker.js` ensuring `/llms.txt` and `/llms-full.txt` serve raw markdown with `Content-Type: text/markdown; charset=utf-8`.

## [Unreleased]

### Added
- Auto speed-testing for IP detection providers on page load.
- Automatic provider reordering based on measured latency.
- Automatic hiding of failed IP detection providers.
- Manual "refresh detector test" action in Preferences to clear cache and rerun provider checks.

### Changed
- IP detection cards now render from the active detector list instead of a fixed provider order.
- Cached provider speed-test results are reused to avoid repeating checks on every interaction.

### Fixed
- Updated `svgmap` stylesheet import to use the package export path required by current versions.
- Exported detector cache loader from `frontend/store.js` so the IP info view can reuse cached detector data.
