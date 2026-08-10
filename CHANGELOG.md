# Changelog

All notable changes to this project will be documented in this file.

## [2026-08-10]

### Added
- **AI Agent Discovery (`llms.txt`)**: Added `public/llms.txt` and `public/llms-full.txt` compliant with the `llmstxt.org` standard, providing AI agents and LLMs with a clean, structured index of API endpoints, architecture, and maintainer details.
- **Serverless Cloudflare Worker Architecture**: Migrated backend infrastructure from VPS/Express to 100% serverless Cloudflare Workers with Static Assets (`@cloudflare/kv-asset-handler`).
- **Cloudflare Radar Endpoint**: Added `/api/cfradar` in `worker.js` to query Cloudflare Radar v4 ASN threat intelligence using `CLOUDFLARE_API`.
- **Serverless API Routes**: Integrated `/api/ip`, `/api/configs`, `/api/ipinfo`, `/api/ipapicom`, `/api/ipapiis`, `/api/dnsresolver`, `/api/whois`, `/api/macchecker`, and `/api/cfradar` into edge worker handlers.

### Changed
- **Rebranding & Cleanup**: Rebranded the product as **8888IP**, replacing all legacy Vercel/VPS references with Cloudflare Worker configuration.
- **Default IP Detector Cards**: Updated default `ipCardsToShow` to 6 in `frontend/store.js` so Cloudflare IPv4 and Cloudflare IPv6 cards display by default.
- **Command-Line API Modal**: Added fallback domain (`ip.david888.com`) for `curl` commands in `frontend/store.js` so the Command-Line API modal displays actionable `curl ip.david888.com` examples.

### Fixed
- **Traditional Chinese (zh-TW) i18n**: Fixed Simplified Chinese vocabulary in `zh.json` and PWA installation dialogs (`PWA.vue`, `index.html`).
- **UTF-8 Charset for `llms.txt`**: Added custom response headers in `worker.js` ensuring `/llms.txt` and `/llms-full.txt` serve with `content-type: text/markdown; charset=utf-8` and Link headers.

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
