## Context

The frontend already contains IP detector state, latency testing, cached detector results, and dynamic provider rendering. This change formalizes the intended behavior so the provider list consistently favors working, low-latency detectors, failed detectors disappear only for the active cache window, users can force a rerun from Preferences, and documentation/build behavior stays aligned with the shipped UI.

The work crosses multiple frontend surfaces: store-level detector orchestration, provider-driven IP info rendering, Preferences controls, user-facing docs, and the `svgmap` import path used during builds. The implementation should preserve the current cache-based optimization so the app does not repeatedly retest providers on every interaction.

## Goals / Non-Goals

**Goals:**
- Define a stable provider lifecycle: test providers, keep successful providers sorted by latency, and suppress failures for the active cache result.
- Ensure failed providers return automatically on the next detector test run or cache expiry.
- Keep a user-triggered refresh path that clears cached detector data and reruns the detector test immediately.
- Document the provider ranking/failure behavior and keep the frontend build working with current `svgmap` package exports.

**Non-Goals:**
- Adding new IP detector providers or changing provider response parsing.
- Introducing per-provider manual enable/disable controls beyond the existing refresh action.
- Building a long-lived failure quarantine across multiple cache cycles.
- Changing unrelated IP database lookup behavior outside detector ordering and visibility.

## Decisions

### Detector cache remains the source of truth for active provider visibility
Successful and failed detector results will be stored together in the cached detector test result. The render path will derive the active provider list from the cached test result by keeping only successful providers, already ordered by latency. This keeps page-load behavior and refresh behavior consistent because both consume the same detector snapshot.

Alternative considered: tracking failure suppression separately from the cache. Rejected because it creates two sources of truth and makes cache expiry behavior harder to reason about.

### Failure hiding is temporary and resets with the next detector test
Providers marked failed in the current test result will be excluded only until the cache is cleared manually or expires naturally. The next test run starts from the full default provider list again, allowing transient outages to recover without user intervention beyond the normal refresh/expiry flow.

Alternative considered: persisting failed providers across multiple runs. Rejected because temporary network problems would hide healthy providers for too long.

### Manual refresh reuses the existing detector-testing pipeline
The Preferences refresh control will clear detector cache and rerun the same detector test logic used for automatic ranking. This avoids a second code path and guarantees that manual refresh restores failed providers for retesting.

Alternative considered: a lightweight resort-only refresh. Rejected because it would not retest failed providers or refresh stale latency data.

### `svgmap` build compatibility is handled as an implementation compatibility fix
The `svgmap` stylesheet import will use the package export path supported by the current dependency version. This is treated as a build compatibility concern rather than a new product capability, so it is documented in proposal/design/tasks and release notes but not modeled as its own user-facing spec capability.

## Risks / Trade-offs

- [Transient detector failures hide a provider for the full cache window] -> Keep the cache window bounded and provide a manual refresh action to rerun checks immediately.
- [Latency-based ordering can fluctuate between runs] -> Accept minor movement because measured responsiveness is the intended ranking signal.
- [Store and UI logic can drift if both apply filtering] -> Centralize active detector derivation in store-backed state and keep rendering logic data-driven.
- [`svgmap` package exports may change again in future releases] -> Use the currently supported import path and document the compatibility assumption in change artifacts.

## Migration Plan

1. Update detector-state logic so cached and fresh runs always start from the default provider list, record success/failure, and expose only successful providers in latency order.
2. Keep or refine the Preferences refresh action so it clears detector cache and reruns detector tests.
3. Update IP info rendering and user-facing docs to match the new provider lifecycle.
4. Update the `svgmap` import/build path and verify the frontend build succeeds.

Rollback is low risk: revert the detector-state changes and `svgmap` import update to return to the previous static provider behavior and prior build configuration.

## Open Questions

- None. The temporary failure-hiding behavior is now fixed to the current cache window, with providers restored on the next test run or cache expiry.
