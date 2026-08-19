import type {
  VercelRequest,
  VercelResponse,
} from "@vercel/node";

import {
  retrieveInstance,
} from "../lib/dicomweb.js";

import type {
  HealthcareResponse,
} from "../../lib/healthcare";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  try {
    // 1. API authentication
    const authHeader =
      req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        error: "Authorization header required",
      });
    }

    const [scheme, token] =
      authHeader.split(" ");

    if (
      scheme !== "Bearer" ||
      !token ||
      token !==
        process.env.AIREPORTREADER_API_KEY
    ) {
      return res.status(401).json({
        error: "Invalid API key",
      });
    }

    // 2. POST only
    if (req.method !== "POST") {
      return res.status(405).json({
        error: "Method not allowed",
      });
    }

    // 3. Read PACS configuration
    const baseUrl =
      process.env.DICOMWEB_BASE_URL;

    if (!baseUrl) {
      return res.status(500).json({
        error:
          "DICOMweb configuration is incomplete",
      });
    }

    // 4. Read requested DICOM instance
    const {
      studyInstanceUid,
      seriesInstanceUid,
      sopInstanceUid,
    } = req.body || {};

    if (
      !studyInstanceUid ||
      !seriesInstanceUid ||
      !sopInstanceUid
    ) {
      return res.status(400).json({
        error:
          "studyInstanceUid, seriesInstanceUid and sopInstanceUid are required",
      });
    }

    // 5. Retrieve one DICOM instance
    const fileBuffer =
      await retrieveInstance({
        baseUrl,
        studyInstanceUid,
        seriesInstanceUid,
        sopInstanceUid,
      });

    // 6. Load DICOM parser
    const dicomParserModule: any =
      await import("dicom-parser");

    const dicomParser =
      dicomParserModule.default ??
      dicomParserModule;

    // 7. Parse DICOM
    const dataSet =
      dicomParser.parseDicom(
        new Uint8Array(fileBuffer)
      );

    // 8. Extract basic metadata
    const metadata = {
      patient_id:
        dataSet.string("x00100020") || null,

      patient_name:
        dataSet.string("x00100010") || null,

      patient_birth_date:
        dataSet.string("x00100030") || null,

      patient_sex:
        dataSet.string("x00100040") || null,

      modality:
        dataSet.string("x00080060") || null,

      study_description:
        dataSet.string("x00081030") || null,

      series_description:
        dataSet.string("x0008103e") || null,

      study_instance_uid:
        dataSet.string("x0020000d") ||
        studyInstanceUid,

      series_instance_uid:
        dataSet.string("x0020000e") ||
        seriesInstanceUid,

      sop_instance_uid:
        dataSet.string("x00080018") ||
        sopInstanceUid,

      rows:
        dataSet.uint16("x00280010") || null,

      columns:
        dataSet.uint16("x00280011") || null,

      photometric_interpretation:
        dataSet.string("x00280004") || null,
    };

    // 9. Common healthcare response
    const response: HealthcareResponse = {
      success: true,
      api_version: "v1",
      source: "DICOM",

      data: {
        patient: {
          id: metadata.patient_id,
          name: metadata.patient_name,
          date_of_birth:
            metadata.patient_birth_date,
          gender: metadata.patient_sex,
        },

        encounter: {},

        clinical: {},

        observations: [],

        document: {
          type: "DICOM",
          title:
            metadata.study_description ||
            "DICOM Imaging Study",
          date: null,
        },

        metadata: {
          ...metadata,

          source: "PACS/DICOMweb",

          file: {
            size_bytes: fileBuffer.length,
            content_type:
              "application/dicom",
          },
        },
      },
    };

    return res.status(200).json(
      response
    );
  } catch (error: any) {
    console.error(
      "PACS/DICOMweb error:",
      error
    );

    return res.status(502).json({
      error:
        error.message ||
        "PACS/DICOMweb request failed",
    });
  }
}
