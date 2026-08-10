import type { VercelRequest, VercelResponse } from "@vercel/node";

export default function handler(
  req: VercelRequest,
  res: VercelResponse
) {
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

  return res.status(200).json({
    success: true,
    message: "AIReportReader API authentication successful",
  });
}
