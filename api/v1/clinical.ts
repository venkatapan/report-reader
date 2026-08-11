import type { VercelRequest, VercelResponse } from "@vercel/node";

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

    // 2. Only POST
    if (req.method !== "POST") {
      return res.status(405).json({
        error: "Method not allowed",
      });
    }

    // 3. Read raw HL7 message
    const chunks: Buffer[] = [];

    for await (const chunk of req) {
      chunks.push(
        Buffer.isBuffer(chunk)
          ? chunk
          : Buffer.from(chunk)
      );
    }

    const hl7Message = Buffer.concat(chunks).toString("utf8");

    if (!hl7Message.trim()) {
      return res.status(400).json({
        error: "HL7 message is required",
      });
    }

    // 4. Split HL7 into segments
    const segments = hl7Message
      .replace(/\r\n/g, "\r")
      .replace(/\n/g, "\r")
      .split("\r")
      .filter(Boolean);

    // 5. Parse each segment
    const parsedSegments = segments.map((segment) => {
      const fields = segment.split("|");

      return {
        type: fields[0],
        fields,
      };
    });

    // 6. Extract useful standard fields
    const msh = parsedSegments.find(
      (segment) => segment.type === "MSH"
    );

    const pid = parsedSegments.find(
      (segment) => segment.type === "PID"
    );

    const obxSegments = parsedSegments.filter(
      (segment) => segment.type === "OBX"
    );

    // 7. Return parsed structure
    return res.status(200).json({
      success: true,

      message: "HL7 message parsed successfully",

      data: {
        message_type: msh?.fields[8] || null,

        patient_id: pid?.fields[3] || null,

        observations: obxSegments.map((obx) => ({
          observation_id: obx.fields[3] || null,
          value: obx.fields[5] || null,
          units: obx.fields[6] || null,
          reference_range: obx.fields[7] || null,
          status: obx.fields[11] || null,
        })),
      },
    });
  } catch (error: any) {
    console.error(error);

    return res.status(500).json({
      error: error.message || "Internal server error",
    });
  }
}
