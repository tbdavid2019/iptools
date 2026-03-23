## 1. Detector state and provider lifecycle

- [ ] 1.1 Update detector test state so each run starts from the full default provider list and records success, failure, and latency in one cacheable result.
- [ ] 1.2 Derive the active detector provider list from successful providers only, sorted by ascending latency.
- [ ] 1.3 Ensure cache expiry triggers a fresh detector test that includes previously failed providers again.

## 2. UI refresh flow

- [ ] 2.1 Wire the Preferences refresh action to clear cached detector results and rerun the detector test pipeline.
- [ ] 2.2 Confirm the IP information view renders from the active detector list so failed providers stay hidden only for the current cache window.

## 3. Docs and build compatibility

- [ ] 3.1 Update `README.md` and `CHANGELOG.md` to describe provider auto-sorting, temporary failure hiding, and manual refresh behavior.
- [ ] 3.2 Update the `svgmap` stylesheet/build import path to the package export supported by the current dependency version.
- [ ] 3.3 Verify the frontend build succeeds after the `svgmap` compatibility fix.
