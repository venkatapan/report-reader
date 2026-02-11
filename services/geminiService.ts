export const analyzeReport = async (
  text: string,
  file: File | null
): Promise<string> => {

  const formData = new FormData();

  if (file) {
    formData.append("file", file);
  }

  if (text) {
    formData.append("text", text);
  }

  const response = await fetch("/api/analyze", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Failed to analyze report.");
  }

  const data = await response.json();
  return data.result;
};
