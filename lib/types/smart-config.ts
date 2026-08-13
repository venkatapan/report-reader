export interface SMARTConfiguration {
  authorization_endpoint?: string;
  token_endpoint?: string;
  introspection_endpoint?: string;
  revocation_endpoint?: string;
  scopes_supported?: string[];
  response_types_supported?: string[];
  grant_types_supported?: string[];
  token_endpoint_auth_methods_supported?: string[];
}

export async function discoverSMARTConfiguration(
  fhirBaseUrl: string
): Promise<SMARTConfiguration> {
  const baseUrl = fhirBaseUrl.replace(/\/+$/, "");

  const response = await fetch(
    `${baseUrl}/.well-known/smart-configuration`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      `SMART configuration discovery failed (${response.status}): ${errorText}`
    );
  }

  const configuration =
    (await response.json()) as SMARTConfiguration;

  if (!configuration.token_endpoint) {
    throw new Error(
      "SMART configuration does not provide a token endpoint"
    );
  }

  return configuration;
}
