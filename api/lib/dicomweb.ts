export interface DicomWebOptions {
  baseUrl: string;
  accessToken?: string;
}

export interface DicomJson {
  [tag: string]: {
    Value?: unknown[];
    vr?: string;
  };
}

function buildHeaders(accessToken?: string): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/dicom+json, application/json",
  };

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  return headers;
}

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/+$/, "");
}

async function ensureSuccess(
  response: Response,
  operation: string
): Promise<void> {
  if (response.ok) {
    return;
  }

  const errorText = await response.text();

  throw new Error(
    `DICOMweb ${operation} failed (${response.status}): ${errorText}`
  );
}

export async function searchStudies(
  options: DicomWebOptions & {
    query?: Record<string, string>;
  }
): Promise<DicomJson[]> {
  const baseUrl = normalizeBaseUrl(options.baseUrl);

  const url = new URL(`${baseUrl}/studies`);

  for (const [key, value] of Object.entries(
    options.query || {}
  )) {
    url.searchParams.set(key, value);
  }

  const response = await fetch(url, {
    method: "GET",
    headers: buildHeaders(options.accessToken),
  });

  await ensureSuccess(
    response,
    "study search"
  );

  return (await response.json()) as DicomJson[];
}

export async function searchSeries(
  options: DicomWebOptions & {
    studyInstanceUid: string;
    query?: Record<string, string>;
  }
): Promise<DicomJson[]> {
  const baseUrl = normalizeBaseUrl(options.baseUrl);

  const url = new URL(
    `${baseUrl}/studies/${encodeURIComponent(
      options.studyInstanceUid
    )}/series`
  );

  for (const [key, value] of Object.entries(
    options.query || {}
  )) {
    url.searchParams.set(key, value);
  }

  const response = await fetch(url, {
    method: "GET",
    headers: buildHeaders(options.accessToken),
  });

  await ensureSuccess(
    response,
    "series search"
  );

  return (await response.json()) as DicomJson[];
}

export async function searchInstances(
  options: DicomWebOptions & {
    studyInstanceUid: string;
    seriesInstanceUid: string;
    query?: Record<string, string>;
  }
): Promise<DicomJson[]> {
  const baseUrl = normalizeBaseUrl(options.baseUrl);

  const url = new URL(
    `${baseUrl}/studies/${encodeURIComponent(
      options.studyInstanceUid
    )}/series/${encodeURIComponent(
      options.seriesInstanceUid
    )}/instances`
  );

  for (const [key, value] of Object.entries(
    options.query || {}
  )) {
    url.searchParams.set(key, value);
  }

  const response = await fetch(url, {
    method: "GET",
    headers: buildHeaders(options.accessToken),
  });

  await ensureSuccess(
    response,
    "instance search"
  );

  return (await response.json()) as DicomJson[];
}

export async function retrieveInstance(
  options: DicomWebOptions & {
    studyInstanceUid: string;
    seriesInstanceUid: string;
    sopInstanceUid: string;
  }
): Promise<Buffer> {
  const baseUrl = normalizeBaseUrl(options.baseUrl);

  const url =
    `${baseUrl}/studies/` +
    `${encodeURIComponent(options.studyInstanceUid)}/series/` +
    `${encodeURIComponent(options.seriesInstanceUid)}/instances/` +
    `${encodeURIComponent(options.sopInstanceUid)}`;

  const headers: Record<string, string> = {
    Accept:
      'multipart/related; type="application/dicom"; transfer-syntax=*',
  };

  if (options.accessToken) {
    headers.Authorization =
      `Bearer ${options.accessToken}`;
  }

  const response = await fetch(url, {
    method: "GET",
    headers,
  });

  await ensureSuccess(
    response,
    "instance retrieval"
  );

  const contentType =
    response.headers.get("content-type") || "";

  const boundaryMatch =
    contentType.match(
      /boundary="?([^";]+)"?/i
    );

  const responseBuffer = Buffer.from(
    await response.arrayBuffer()
  );

  // Some DICOMweb servers may return the DICOM payload
  // directly. Support that case too.
  if (!boundaryMatch) {
    return responseBuffer;
  }

  const boundary =
    Buffer.from(
      `--${boundaryMatch[1]}`
    );

  const firstBoundary =
    responseBuffer.indexOf(boundary);

  if (firstBoundary === -1) {
    throw new Error(
      "DICOMweb multipart boundary was not found"
    );
  }

  const headerStart =
    firstBoundary + boundary.length;

  const headerEnd =
    responseBuffer.indexOf(
      Buffer.from("\r\n\r\n"),
      headerStart
    );

  if (headerEnd === -1) {
    throw new Error(
      "DICOMweb multipart headers could not be parsed"
    );
  }

  const dataStart = headerEnd + 4;

  const nextBoundary =
    responseBuffer.indexOf(
      boundary,
      dataStart
    );

  const dataEnd =
    nextBoundary === -1
      ? responseBuffer.length
      : nextBoundary - 2;

  if (dataEnd <= dataStart) {
    throw new Error(
      "DICOMweb response contained an empty DICOM instance"
    );
  }

  return responseBuffer.subarray(
    dataStart,
    dataEnd
  );
}
