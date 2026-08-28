# AIReportReader Sandbox

This directory contains synthetic healthcare test data for validating AIReportReader enterprise integrations.

## Purpose

The sandbox allows integration testing without using real patient medical data.

## Contents

### FHIR

`fhir/fhir-test.json`

Synthetic FHIR Observation resource.

`fhir/healthcare-test.json`

Synthetic normalized healthcare response.

### PACS / DICOM

`pacs/pacs-request.json`

Synthetic DICOM study, series, and SOP instance identifiers used for PACS testing.

`pacs/synthetic-test.dcm`

Synthetic 1x1 DICOM test image generated for integration testing.

### Combined Workflow

`workflows/hospital-workflow-test.json`

Synthetic FHIR + DICOM healthcare workflow used to test the combined analysis endpoint.

## Test Data Notice

All files in this directory are intended for development, integration testing, and demonstration purposes.

Do not place real patient information, production credentials, API keys, private keys, or other sensitive healthcare data in this directory.

## Enterprise Workflow

The synthetic workflow represents:

```text
FHIR / EHR
    +
PACS / DICOM
    ↓
HealthcareResponse
    ↓
AIReportReader
    ↓
AI analysis
