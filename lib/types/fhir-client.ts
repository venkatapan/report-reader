export interface FHIRClientOptions {
  baseUrl: string;
  accessToken?: string;
}

export class FHIRClient {
  private baseUrl: string;
  private accessToken?: string;

  constructor(options: FHIRClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/+$/, "");
    this.accessToken = options.accessToken;
  }

  private async request<T>(
    path: string
  ): Promise<T> {
    const headers: Record<string, string> = {
      Accept: "application/fhir+json",
    };

    if (this.accessToken) {
      headers.Authorization =
        `Bearer ${this.accessToken}`;
    }

    const response = await fetch(
      `${this.baseUrl}/${path}`,
      {
        method: "GET",
        headers,
      }
    );

    if (!response.ok) {
      const errorText =
        await response.text();

      throw new Error(
        `FHIR server returned ${response.status}: ${errorText}`
      );
    }

    return response.json() as Promise<T>;
  }

  async getResource(
    resourceType: string,
    id: string
  ) {
    return this.request(
      `${encodeURIComponent(resourceType)}/${encodeURIComponent(id)}`
    );
  }

  async getPatient(id: string) {
    return this.getResource(
      "Patient",
      id
    );
  }

  async getObservation(id: string) {
    return this.getResource(
      "Observation",
      id
    );
  }

  async getDiagnosticReport(id: string) {
    return this.getResource(
      "DiagnosticReport",
      id
    );
  }

  async getCapabilities() {
    return this.request(
      "metadata"
    );
  }
}
