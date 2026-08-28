# AIReportReader Enterprise API

## Overview

AIReportReader provides versioned healthcare integration APIs for enterprise and hospital workflows.

The enterprise API surface is located under:

`/api/v1/`

The existing consumer report-analysis flow remains separate at:

`/api/analyze`

## Authentication

Enterprise API routes require a Bearer token.

Example:

```http
Authorization: Bearer YOUR_API_KEY

## **Canonical Healthcare Contract**

AIReportReader uses `HealthcareResponse` as the canonical normalized healthcare data contract across enterprise integrations.

### Supported Sources

The `source` field identifies the healthcare data source:

- HL7
- FHIR
- DICOM
- LAB_REPORT
- CLINICAL_TEXT

### Response Structure

Every normalized healthcare response follows this structure:

```json
{
  "success": true,
  "api_version": "v1",
  "source": "FHIR",
  "data": {
    "patient": {},
    "encounter": {},
    "clinical": {},
    "observations": [],
    "document": {},
    "metadata": {}
  }
}
