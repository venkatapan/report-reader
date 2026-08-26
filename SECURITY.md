# Security & Compliance Readiness

## Scope

This document describes the current technical security controls implemented in AI Medical Report Reader.

This document is a technical readiness record. It does not constitute legal advice, HIPAA certification, or a claim of regulatory compliance.

## Authentication and Access Control

Hospital-facing API routes under `/api/v1/*` require a Bearer authorization token validated against the server-side `AIREPORTREADER_API_KEY` environment variable.

Authentication credentials are not intentionally exposed to the browser client.

## Secrets Management

Sensitive credentials are stored as server-side environment variables.

Examples include:

- Gemini API credentials
- AIREPORTREADER API credentials
- FHIR client credentials
- FHIR private JWK material
- DICOMweb configuration

Private key and credential files are excluded from Git tracking through `.gitignore`.

## Frontend Secret Protection

The frontend does not directly access Gemini API credentials.

The ReportReader client sends report input to `/api/analyze`, while Gemini credentials remain server-side.

The Vite frontend configuration was hardened to remove Gemini credential injection into the frontend build.

## PHI / Medical Data Handling

The application processes uploaded reports and healthcare data for analysis.

The application does not intentionally maintain a permanent application-managed database of user medical reports.

No browser persistence mechanism was found for medical report content.

The only identified browser local-storage usage is the disclaimer acknowledgement.

## Healthcare Data Integration

The system supports healthcare data flows involving:

- FHIR / EHR
- PACS / DICOM
- Combined FHIR and PACS healthcare workflows

Healthcare information is normalized into a common healthcare response structure before analysis.

## Audit Logging

Healthcare analysis requests use structured audit events containing operational metadata such as:

- timestamp
- request ID
- event name
- route
- HTTP method
- HTTP status
- success/failure state
- healthcare source

Audit events are designed not to include:

- API keys
- Authorization headers
- patient records
- FHIR payloads
- DICOM payloads

## Error Handling

Internal server errors returned to clients use generic error messages rather than exposing internal exception details.

Detailed server-side diagnostic logging may be retained for operational troubleshooting.

## Transmission Security

Healthcare API integrations are intended to use HTTPS endpoints.

No hardcoded HTTP endpoints were identified in the application source during the Phase 4 security review.

## Data Retention

The application does not intentionally provide permanent application-managed storage for uploaded medical reports.

Temporary processing of uploaded files may occur during request handling.

Third-party service processing and retention terms must be reviewed separately before claiming a specific regulatory retention posture.

## Privacy Policy

A privacy policy is present in the application.

The privacy policy describes report processing, third-party AI processing, data retention, deletion, and medical disclaimer practices.

The privacy policy should be reviewed periodically to ensure that its statements remain consistent with the deployed architecture and third-party service agreements.

## Incident Response

Security incidents should be investigated using available deployment logs, audit events, request IDs, and provider logs.

Compromised credentials should be revoked and rotated.

Affected services should be redeployed after remediation.

## Compliance Readiness Limitations

The project does not currently include documented evidence of:

- a formal HIPAA risk assessment
- a formal incident response policy
- a formal contingency and disaster recovery policy
- vendor Business Associate Agreements
- a completed regulatory compliance audit

These items require organizational, contractual, and/or legal review where applicable.

## Review

This document should be reviewed whenever significant changes are made to:

- healthcare integrations
- authentication
- data storage
- third-party AI processing
- deployment infrastructure
- privacy practices
