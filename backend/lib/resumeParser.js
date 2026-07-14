import { PDFParse } from 'pdf-parse';
import mammoth from 'mammoth';

/** Extracts plain text from a PDF or DOCX buffer. */
export async function extractText(fileBuffer, fileType) {
  if (fileType === 'application/pdf') {
    const parser = new PDFParse({ data: fileBuffer });
    const result = await parser.getText();
    return result.text;
  }
  if (fileType.includes('wordprocessingml') || fileType === 'application/msword') {
    const result = await mammoth.extractRawText({ buffer: fileBuffer });
    return result.value;
  }
  throw new Error('Unsupported file type. Please upload a PDF or DOCX.');
}
