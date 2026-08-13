export interface FHIRPatient {
  resourceType: "Patient";
  id?: string;
  identifier?: Array<{
    system?: string;
    value?: string;
  }>;
  name?: Array<{
    family?: string;
    given?: string[];
  }>;
  gender?: string;
  birthDate?: string;
}

export interface FHIRObservation {
  resourceType: "Observation";
  id?: string;
  status?: string;
  code?: {
    coding?: Array<{
      system?: string;
      code?: string;
      display?: string;
    }>;
    text?: string;
  };
  valueQuantity?: {
    value?: number;
    unit?: string;
    system?: string;
    code?: string;
  };
  referenceRange?: Array<{
    low?: {
      value?: number;
      unit?: string;
    };
    high?: {
      value?: number;
      unit?: string;
    };
  }>;
  effectiveDateTime?: string;
}

export interface FHIRDiagnosticReport {
  resourceType: "DiagnosticReport";
  id?: string;
  status?: string;
  code?: {
    coding?: Array<{
      system?: string;
      code?: string;
      display?: string;
    }>;
    text?: string;
  };
  effectiveDateTime?: string;
  conclusion?: string;
  result?: Array<{
    reference?: string;
    display?: string;
  }>;
}
