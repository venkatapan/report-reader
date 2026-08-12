import type { VercelRequest, VercelResponse } from "@vercel/node";
import formidable from "formidable";
import fs from "fs";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  try {
    // 1. API authentication
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        error: "Authorization header required",
      });
    }

    const [scheme, token] = authHeader.split(" ");

    if (
      scheme !== "Bearer" ||
      !token ||
      token !== process.env.AIREPORTREADER_API_KEY
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

    // 3. Receive uploaded DICOM file
    const form = formidable({
      multiples: false,
    });

    const [, files] = await form.parse(req);

    const uploadedFile = Array.isArray(files.file)
      ? files.file[0]
      : files.file;

    if (!uploadedFile) {
      return res.status(400).json({
        error: "DICOM file is required",
      });
    }

    // 4. Read file
    const fileBuffer = fs.readFileSync(
      uploadedFile.filepath
    );

    // 5. Basic DICOM validation
    const dicomSignature =
      fileBuffer.length >= 132
        ? fileBuffer
            .subarray(128, 132)
            .toString("ascii")
        : "";

    const looksLikeDicom =
      dicomSignature === "DICM" ||
      uploadedFile.mimetype === "application/dicom" ||
      uploadedFile.originalFilename
        ?.toLowerCase()
        .endsWith(".dcm");

    if (!looksLikeDicom) {
      return res.status(400).json({
        error:
          "Uploaded file does not appear to be a valid DICOM file",
      });
    }

    // 6. Load DICOM parser only after a file has been received
    let dicomParser: any;

    try {
      dicomParser = require("dicom-parser");
    } catch (error: any) {
      console.error(
        "dicom-parser loading failed:",
        error
      );

      return res.status(500).json({
        error: "DICOM parser could not be loaded",
        details:
          error.message || "Parser loading failed",
      });
    }

    // 7. Parse DICOM file
    let dataSet: any;

    try {
      dataSet = dicomParser.parseDicom(
        new Uint8Array(fileBuffer)
      );
    } catch (error: any) {
      console.error(
        "DICOM parsing failed:",
        error
      );

      return res.status(400).json({
        error: "DICOM file could not be parsed",
        details:
          error.message || "Invalid DICOM data",
      });
    }

    // 8. Extract technical metadata
    // Patient-identifying information is intentionally
    // not returned.
    const metadata = {
      modality:
        dataSet.string("x00080060") || null,

      study_description:
        dataSet.string("x00081030") || null,

      series_description:
        dataSet.string("x0008103e") || null,

      study_date:
        dataSet.string("x00080020") || null,

      rows:
        dataSet.uint16("x00280010") || null,

      columns:
        dataSet.uint16("x00280011") || null,

      number_of_frames:
        dataSet.string("x00280008") || null,

      photometric_interpretation:
        dataSet.string("x00280004") || null,
    };

    // 9. Return structured response
    return res.status(200).json({
      success: true,
      api_version: "v1",
      source: "DICOM",
      message:
        "DICOM metadata extracted successfully",
      data: {
        metadata,
        file: {
          filename:
            uploadedFile.originalFilename || null,
          size_bytes: fileBuffer.length,
          content_type:
            uploadedFile.mimetype ||
            "application/dicom",
        },
      },
    });
  } catch (error: any) {
    console.error(error);

    return res.status(500).json({
      error:
        error.message || "Internal server error",
    });
  }
}
