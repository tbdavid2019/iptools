# Changelog

All notable changes to this project will be documented in this file.

## [2026-08-10]

### Added
- **Browser Info Homepage Placement**: Embedded the `BrowserInfo` (瀏覽器資訊) component directly beneath `IPCheck` on the homepage for immediate access to User Agent, OS, GPU, CPU cores, and browser fingerprint.
- **Invisibility Test Free Access**: Removed login restrictions from `InvisibilityTest` so visitors can run proxy/VPN threat detection without logging in, with fast local environment fallback.
- **Surfshark DNS Leak Integration**: Replaced legacy `edns.ip-api.com` in `DnsLeaksTest` with Surfshark DNS resolvers across all 4 leak test cards.
- **Rule Test Fallback**: Added `/cdn-cgi/trace` fallback in `RuleTest` so unconfigured `ptest-*.ip.david888.com` subdomains degrade gracefully instead of throwing DNS errors.
- **AI Agent Discovery (`llms.txt`)**: Added `public/llms.txt` and `public/llms-full.txt` compliant with `llmstxt.org` standards, providing AI agents with structured API indexes.

### Changed
- **Reactive Auto-Hide Failed IP Cards**: Updated `hideUnavailableIPStack` default to `true` in `store.js` and added `visibleCards` reactive filter in `IpInfos.vue` so failed cards hide immediately on first page load without requiring a page refresh.
- **IPify IPv4 & Provider Reliability**: Replaced `CN Source` (`cnsource`) with `IPify IPv4` (`ipify_v4`) with multi-tier fallbacks (`api4.ipify.org` -> `api.ipify.org` -> `/api/ip`).
- **Connectivity Test Reordering**: Reordered connectivity target sites so international services (Google, Cloudflare, YouTube, GitHub, ChatGPT) appear first, and Mainland China services (Taobao, Baidu, WeChat) are placed at the bottom.
- **Footer Technical Provider Link**: Updated Footer copyright to always display `技術提供： david888.com` pointing to `https://david888.com`.
- **Serverless Cloudflare Worker Architecture**: Migrated backend infrastructure from VPS/Express to 100% serverless Cloudflare Workers with Static Assets (`@cloudflare/kv-asset-handler`).

### Fixed
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
