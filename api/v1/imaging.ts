import type { VercelRequest, VercelResponse } from "@vercel/node";
import formidable from "formidable";
import fs from "fs";
import * as dcmjs from "dcmjs";

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

    // 3. Receive DICOM file
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

    // 4. Read DICOM file
    const fileBuffer = fs.readFileSync(
      uploadedFile.filepath
    );

    // 5. Parse DICOM
    const dicomData =
      dcmjs.data.DicomMessage.readFile(
        fileBuffer.buffer.slice(
          fileBuffer.byteOffset,
          fileBuffer.byteOffset + fileBuffer.byteLength
        )
      );

    const dataset =
      dcmjs.data.DicomMetaDictionary.naturalizeDataset(
        dicomData.dict
      );

    // 6. Extract only useful technical metadata
    const metadata = {
      modality: dataset.Modality || null,
      study_description:
        dataset.StudyDescription || null,
      series_description:
        dataset.SeriesDescription || null,
      study_date:
        dataset.StudyDate || null,
      rows: dataset.Rows || null,
      columns: dataset.Columns || null,
      number_of_frames:
        dataset.NumberOfFrames || null,
      photometric_interpretation:
        dataset.PhotometricInterpretation || null,
    };

    // 7. Return metadata
    return res.status(200).json({
      success: true,
      source: "DICOM",
      message: "DICOM metadata extracted successfully",
      data: {
        metadata,
        file: {
          filename:
            uploadedFile.originalFilename || null,
          size_bytes: fileBuffer.length,
        },
      },
    });
  } catch (error: any) {
    console.error(error);

    return res.status(500).json({
      error:
        error.message ||
        "Failed to parse DICOM file",
    });
  }
}
