export type HealthcareSource =
  | "HL7"
  | "FHIR"
  | "DICOM"
  | "LAB_REPORT"
  | "CLINICAL_TEXT";

export interface HealthcareResponse {
  success: boolean;
  api_version: "v1";
  source: HealthcareSource;

  data: {
    patient: {
      id?: string | null;
      name?: string | null;
      date_of_birth?: string | null;
      gender?: string | null;
    };

    encounter: {
      id?: string | null;
      type?: string | null;
      date?: string | null;
      location?: string | null;
    };

    clinical: {
      diagnosis?: string[];
      procedures?: string[];
      medications?: string[];
      allergies?: string[];
    };

    observations: Array<{
      code?: string | null;
      name?: string | null;
      value?: string | number | null;
      unit?: string | null;
      reference_range?: string | null;
      status?: string | null;
    }>;

    document: {
      type?: string | null;
      title?: string | null;
      date?: string | null;
    };

    metadata: Record<string, unknown>;
  };
}
