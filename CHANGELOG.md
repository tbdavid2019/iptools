# Changelog

All notable changes to this project will be documented in this file.

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
