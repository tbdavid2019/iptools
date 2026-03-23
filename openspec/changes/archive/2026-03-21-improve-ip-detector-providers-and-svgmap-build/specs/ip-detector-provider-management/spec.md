## ADDED Requirements

### Requirement: Providers are ranked by successful detector test latency
The system SHALL run an IP detector provider test from the default provider set and order successful providers from lowest measured latency to highest measured latency before rendering provider-driven IP cards.

#### Scenario: Initial detector ranking succeeds
- **WHEN** the application runs a detector test and multiple providers succeed
- **THEN** the system stores the successful providers in ascending latency order
- **THEN** the IP information view renders providers using that stored order

#### Scenario: Cached detector ranking is reused
- **WHEN** a valid cached detector test result exists
- **THEN** the system reuses the cached provider order instead of rerunning the detector test immediately

### Requirement: Failed providers are temporarily hidden for the active cache window
The system SHALL exclude providers that fail the current detector test from the active rendered provider list for the duration of the current cached detector result.

#### Scenario: Provider fails during detector test
- **WHEN** a provider errors or returns no usable result during the detector test
- **THEN** the system marks that provider as failed in the detector result
- **THEN** the IP information view does not render that provider while that cached result remains active

#### Scenario: All providers do not succeed
- **WHEN** one or more providers fail but at least one provider succeeds
- **THEN** the system renders only the successful providers
- **THEN** failed providers remain excluded until the next detector test run or cache expiry

### Requirement: Manual refresh reruns detector testing from the full provider set
The system SHALL provide a refresh action that clears the detector cache and reruns detector testing using the full default provider list.

#### Scenario: User triggers refresh
- **WHEN** the user activates the detector refresh action in Preferences
- **THEN** the system clears the cached detector test result
- **THEN** the system reruns detector testing from the full default provider set

#### Scenario: Failed provider is restored on refresh
- **WHEN** a provider was hidden because it failed in the previous cached detector result
- **THEN** that provider is included again in the next detector test run started by manual refresh

### Requirement: Cache expiry restores failed providers for retesting
The system SHALL treat detector cache expiry as the end of the temporary failure-hiding window and SHALL include all default providers in the next detector test.

#### Scenario: Detector cache expires
- **WHEN** the cached detector result is no longer valid
- **THEN** the next detector test starts from the full default provider list
- **THEN** previously failed providers are eligible to appear again if they succeed
