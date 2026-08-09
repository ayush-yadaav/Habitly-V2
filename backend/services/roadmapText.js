import pdfParse from "pdf-parse";
import mammoth from "mammoth";

const MAX_EXTRACTED_CHARS = 18000;

export async function extractRoadmapText(file) {
  if (!file?.buffer) throw new Error("No roadmap file was uploaded.");

  const mime = file.mimetype || "";
  const name = (file.originalname || "roadmap").toLowerCase();
  let text = "";

  if (mime === "application/pdf" || name.endsWith(".pdf")) {
    const result = await pdfParse(file.buffer);
    text = result.text || "";
  } else if (
    mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    name.endsWith(".docx")
  ) {
    const result = await mammoth.extractRawText({ buffer: file.buffer });
    text = result.value || "";
  } else if (mime.startsWith("text/") || name.endsWith(".txt") || name.endsWith(".md")) {
    text = file.buffer.toString("utf8");
  } else {
    const error = new Error("Unsupported roadmap file. Use PDF, DOCX, TXT, or Markdown.");
    error.code = "ROADMAP_FILE_TYPE";
    throw error;
  }

  text = text.replace(/\u0000/g, "").replace(/\r/g, "").replace(/[ \t]+/g, " ").trim();
  if (!text) {
    const error = new Error("We could not extract readable text from that roadmap.");
    error.code = "ROADMAP_EMPTY";
    throw error;
  }

  return text.slice(0, MAX_EXTRACTED_CHARS);
}
