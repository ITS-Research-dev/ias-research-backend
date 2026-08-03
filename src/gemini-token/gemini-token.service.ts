import { Injectable, BadRequestException } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as mammoth from 'mammoth';
import { extractText as extractPdfText, getDocumentProxy } from 'unpdf';

const MIME_PDF = 'application/pdf';
const MIME_DOCX =
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

@Injectable()
export class GeminiTokenService {
  private readonly genAI: GoogleGenerativeAI;
  private readonly modelName: string;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY belum diset di environment variable');
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
    this.modelName = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
  }

  private async extractText(file: Express.Multer.File): Promise<string> {
    if (file.mimetype === MIME_PDF) {
      const pdf = await getDocumentProxy(new Uint8Array(file.buffer));
      const { text } = await extractPdfText(pdf, { mergePages: true });
      return text;
    }

    if (file.mimetype === MIME_DOCX) {
      const { value } = await mammoth.extractRawText({ buffer: file.buffer });
      return value;
    }

    throw new BadRequestException(
      `Format file tidak didukung: ${file.mimetype} (hanya PDF atau .docx)`,
    );
  }

  async countTokens(file: Express.Multer.File, markdown = '') {
    if (!file) {
      throw new BadRequestException(
        'File PDF atau Word wajib diupload (field: document)',
      );
    }

    const documentText = await this.extractText(file);
    const combinedContent = [markdown, documentText]
      .filter(Boolean)
      .join('\n\n---\n\n');

    const model = this.genAI.getGenerativeModel({ model: this.modelName });
    const { totalTokens } = await model.countTokens(combinedContent);

    return {
      fileName: file.originalname,
      fileType: file.mimetype,
      markdownCharCount: markdown.length,
      documentCharCount: documentText.length,
      totalTokens,
      model: this.modelName,
    };
  }
}