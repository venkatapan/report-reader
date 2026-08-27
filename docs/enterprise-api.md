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
