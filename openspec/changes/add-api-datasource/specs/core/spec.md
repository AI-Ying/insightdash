# Spec: API 数据源支持

## Requirement: API 数据源上传

The system SHALL allow users to create a DataSource by fetching data from a REST API endpoint.

### Scenario: Select built-in template

- GIVEN user is on the Data Sources list page
- WHEN user clicks "Add API" button
- THEN a modal appears with template options

### Scenario: Select template and save

- GIVEN user has opened the API modal
- WHEN user selects "Random User" template
- THEN the URL and responsePath are auto-filled
- WHEN user clicks "Test Connection"
- THEN system shows loading indicator
- THEN system shows success with data preview
- WHEN user clicks "Save"
- THEN a new DataSource is created with type "API"
- AND a Dataset is created with parsed schema
- AND user is redirected to the DataSource detail page

### Scenario: Test connection failure

- GIVEN user has selected a template
- WHEN user clicks "Test Connection"
- AND the API returns an error or times out
- THEN system shows error message: "Failed to connect. Please check the URL or try again later."

### Scenario: Custom URL (Phase 2)

- GIVEN user wants to use their own API
- WHEN user enters a custom URL
- AND user provides optional responsePath
- THEN system validates the URL format
- WHEN user clicks "Test Connection"
- THEN same behavior as template selection

## Requirement: API Data Display

The system SHALL display API-sourced data the same way as CSV data.

- GIVEN a DataSource has type "API"
- WHEN user navigates to its detail page
- THEN the data table shows columns and rows from Dataset.schema
- AND Dataset tabs work the same as CSV datasources

## Requirement: Existing CSV Functionality

The system SHALL NOT break existing CSV upload functionality.

- GIVEN user uploads a CSV file
- WHEN the upload completes
- THEN the CSV is processed the same as before this change

## Requirement: Template List

The system SHALL provide 8 built-in API templates organized by category.

### Weather & Geography
- Global City Weather: Open-Meteo API (no auth required)
- World Countries: RestCountries API (no auth required)

### Statistics & Government
- GitHub Trending: GitHub Search API (public, rate limited)
- GitHub Repo Stats: GitHub Repos API (public, rate limited)

### Utilities
- Random Users: RandomUser API (no auth required)
- Dog Breeds: Dog CEO API (no auth required)
- Cat Facts: Cat Facts API (no auth required)

## AFFECTED AREAS

| Area | Impact | Description |
|------|--------|-------------|
| `src/app/api/workspaces/[...]/datasources/route.ts` | Modified | Handle API type in POST |
| `src/lib/api-parser.ts` | New | Fetch + parse API response |
| `src/lib/constants.ts` | New | Template definitions |
| `src/components/datasource/api-upload-modal.tsx` | New | API configuration UI |
| `src/app/(dashboard)/w/[slug]/datasources/page.tsx` | Modified | Add API button |
