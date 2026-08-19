import type { HealthcareResponse } from "../v1/healthcare";

export interface HospitalWorkflowInput {
  fhir?: HealthcareResponse;
  pacs?: HealthcareResponse;
}

export interface HospitalWorkflowResult {
  success: true;
  api_version: "v1";
  sources: string[];
  data: {
    patient: HealthcareResponse["data"]["patient"];
    encounter: HealthcareResponse["data"]["encounter"];
    clinical: HealthcareResponse["data"]["clinical"];
    observations: HealthcareResponse["data"]["observations"];
    documents: HealthcareResponse["data"]["document"][];
    metadata: Record<string, unknown>;
  };
}

export function buildHospitalWorkflow(
  input: HospitalWorkflowInput
): HospitalWorkflowResult {
  const responses = [
    input.fhir,
    input.pacs,
  ].filter(
    (response): response is HealthcareResponse =>
      Boolean(
        response &&
        response.success &&
        response.data
      )
  );

  if (responses.length === 0) {
    throw new Error(
      "At least one valid hospital data source is required"
    );
  }

  const primary =
    input.fhir ?? input.pacs!;

  const documents = responses
    .map((response) => response.data.document)
    .filter(
      (document) =>
        document &&
        (
          document.type ||
          document.title ||
          document.date
        )
    );

  const mergedMetadata: Record<string, unknown> =
    {};

  for (const response of responses) {
    Object.assign(
      mergedMetadata,
      response.data.metadata
    );
  }

  mergedMetadata.sources =
    responses.map(
      (response) => response.source
    );

  return {
    success: true,
    api_version: "v1",
    sources: responses.map(
      (response) => response.source
    ),

    data: {
      patient:
        input.fhir?.data.patient ??
        input.pacs?.data.patient ??
        primary.data.patient,

      encounter:
        input.fhir?.data.encounter ??
        input.pacs?.data.encounter ??
        primary.data.encounter,

      clinical: {
        diagnosis: [
          ...(input.fhir?.data.clinical.diagnosis ?? []),
          ...(input.pacs?.data.clinical.diagnosis ?? []),
        ],

        procedures: [
          ...(input.fhir?.data.clinical.procedures ?? []),
          ...(input.pacs?.data.clinical.procedures ?? []),
        ],

        medications: [
          ...(input.fhir?.data.clinical.medications ?? []),
          ...(input.pacs?.data.clinical.medications ?? []),
        ],

        allergies: [
          ...(input.fhir?.data.clinical.allergies ?? []),
          ...(input.pacs?.data.clinical.allergies ?? []),
        ],
      },

      observations: [
        ...(input.fhir?.data.observations ?? []),
        ...(input.pacs?.data.observations ?? []),
      ],

      documents,

      metadata: mergedMetadata,
    },
  };
}
