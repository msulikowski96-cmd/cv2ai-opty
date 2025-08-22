import pdf from 'pdf-parse';

export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  try {
    const data = await pdf(buffer);
    return data.text;
  } catch (error) {
    console.error('PDF extraction error:', error);
    throw new Error('Failed to extract text from PDF. Please ensure the file is a valid PDF document.');
  }
}

export function cleanExtractedText(text: string): string {
  // Clean up common PDF extraction artifacts
  return text
    .replace(/\r\n/g, '\n') // Normalize line endings
    .replace(/\n{3,}/g, '\n\n') // Remove excessive line breaks
    .replace(/\s{2,}/g, ' ') // Replace multiple spaces with single space
    .replace(/[^\S\n]+/g, ' ') // Replace non-newline whitespace with single space
    .trim(); // Remove leading/trailing whitespace
}

export function validatePdfContent(text: string): { isValid: boolean; reason?: string } {
  if (!text || text.trim().length === 0) {
    return { isValid: false, reason: 'PDF appears to be empty or contains no extractable text' };
  }

  if (text.length < 50) {
    return { isValid: false, reason: 'PDF content is too short to be a meaningful CV' };
  }

  // Check for common CV elements
  const cvIndicators = [
    /\b(experience|doświadczenie|praca|zawodowe)\b/i,
    /\b(education|wykształcenie|edukacja|studia)\b/i,
    /\b(skills|umiejętności|kompetencje)\b/i,
    /\b(phone|telefon|email|mail)\b/i,
    /\b(name|nazwisko|imię)\b/i
  ];

  const foundIndicators = cvIndicators.filter(regex => regex.test(text)).length;
  
  if (foundIndicators < 2) {
    return { 
      isValid: false, 
      reason: 'Document does not appear to be a CV. Please upload a proper CV document.' 
    };
  }

  return { isValid: true };
}

export async function processCvFile(buffer: Buffer, filename: string): Promise<string> {
  if (!filename.toLowerCase().endsWith('.pdf')) {
    throw new Error('Only PDF files are currently supported for text extraction');
  }

  const rawText = await extractTextFromPdf(buffer);
  const cleanText = cleanExtractedText(rawText);
  
  const validation = validatePdfContent(cleanText);
  if (!validation.isValid) {
    throw new Error(validation.reason);
  }

  return cleanText;
}
