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

    // 2. Only accept POST requests
    if (req.method !== "POST") {
      return res.status(405).json({
        error: "Method not allowed",
      });
    }

    // 3. Read raw HL7 body
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

    // 4. Temporary response
    return res.status(200).json({
      success: true,
      message: "HL7 message received successfully",
      length: hl7Message.length,
    });
  } catch (error: any) {
    console.error(error);

    return res.status(500).json({
      error: error.message || "Internal server error",
    });
  }
}
