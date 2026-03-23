## Why

IP detector providers currently need a more resilient selection flow so the fastest working sources appear first while temporarily failing sources do not clutter the UI. This change also captures the need for a manual refresh path and a build compatibility fix for `svgmap`, which is now required to keep the frontend build stable on current dependency versions.

## What Changes

- Automatically speed-test IP detector providers and sort successful providers from lowest latency to highest latency before rendering provider-driven IP cards.
- Automatically hide providers that fail during the current cached detector test window so only working providers are shown.
- Add a manual refresh action that clears the cached detector test result and reruns provider checks immediately.
- Restore failed providers on the next detector test run or when the detector cache expires.
- Update user-facing documentation to describe provider auto-sorting, temporary failure hiding, and the manual refresh flow.
- Fix the `svgmap` stylesheet import/build path so production builds succeed with the current package export behavior.

## Capabilities

### New Capabilities
- `ip-detector-provider-management`: Automatically rank IP detector providers by measured latency, temporarily suppress failed providers within the active cache window, and allow users to rerun detector checks manually.

### Modified Capabilities

## Impact

- Affected frontend state and rendering paths for IP detector provider ordering, caching, and visibility.
- Affected Preferences UI for the detector refresh action.
- Affected documentation in `README.md` and release notes in `CHANGELOG.md`.
- Affected frontend build configuration or imports related to `svgmap` package assets.
