import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as mammoth from 'mammoth';
import { extractText as extractPdfText, getDocumentProxy } from 'unpdf';
import { CountTokensDto } from './count-tokens.dto';
import { calculateCost, formatIDR } from './gemini-pricing.constant';

const MIME_PDF = 'application/pdf';
const MIME_DOCX =
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

// Polyfill Math.sumPrecise for Node.js environments lacking ES2024 Math.sumPrecise
if (typeof (Math as any).sumPrecise !== 'function') {
  (Math as any).sumPrecise = function (numbers: Iterable<number>) {
    let sum = 0;
    for (const n of numbers) {
      sum += Number(n) || 0;
    }
    return sum;
  };
}

@Injectable()
export class GeminiTokenService {
  private genAI: GoogleGenerativeAI | null = null;
  private readonly defaultModelName: string;
  private readonly PROMPT = `
Kamu adalah AI Assistant yang bertugas memproses dokumen (PDF) berisi materi pembelajaran dan menghasilkan output terstruktur dalam format JSON. Ikuti alur instruksi berikut secara berurutan dan JANGAN menyimpang dari alur ini.

=== ALUR INSTRUKSI ===

LANGKAH 1 — FILTERISASI
Baca seluruh isi dokumen yang diberikan, lalu lakukan filterisasi: ambil HANYA bagian/materi yang secara spesifik membahas Python (sintaks, konsep, contoh kode, latihan, maupun soal yang berkaitan dengan Python). Abaikan seluruh materi di luar topik Python.

LANGKAH 2 — PENGECEKAN
Cek apakah setelah difilter masih terdapat materi Python di dalam dokumen.
- Jika TIDAK ADA materi Python sama sekali, hentikan proses dan kembalikan HANYA objek berikut (tanpa field lain):
{
  "status": "no_data",
  "message": "Tidak ada data yang mengandung materi Python"
}
- Jika ADA, lanjutkan ke Langkah 3.

LANGKAH 3 — MENYIMPAN LIST MATERI
Susun daftar seluruh materi Python yang ditemukan pada dokumen, satu entri untuk setiap topik/subbab materi yang berdiri sendiri (misalnya: "Variabel & Tipe Data", "Struktur Kontrol (if/else)", "Looping", "Fungsi", "List & Dictionary", dst).

LANGKAH 4 — PROSES SETIAP MATERI (looping untuk setiap 1 materi dalam list)
Untuk SETIAP materi pada daftar hasil Langkah 3, lakukan 3 hal berikut secara paralel/berurutan:

  4a. GENERATE MATERI
      Tulis ulang penjelasan materi tersebut dalam format Markdown yang rapi dan mudah dipahami (gunakan heading, contoh kode dalam code block python, dan penjelasan analogi jika membantu pemahaman). Hasil Markdown ini WAJIB di-flatten menjadi SATU BARIS STRING (ganti setiap baris baru dengan literal "\\n", jangan gunakan baris baru sungguhan di dalam JSON).

  4b. AMBIL SOAL DARI PDF
      Cari dan ambil soal/latihan yang SUDAH ADA di dalam dokumen PDF yang berkaitan dengan materi tersebut (jika ada). Sertakan referensi halaman/lokasi soal tersebut di PDF serta berikan 3 tingkatan hint (hint1: pseudocode/alur, hint2: cloze code/kode rumpang, hint3: basic code/solusi dasar).

  4c. GENERATE SOAL BARU
      Buat SATU soal latihan BARU (orisinal, tidak menyalin dari PDF) yang relevan dengan materi tersebut, lengkap dengan expected output yang bisa diverifikasi dan 3 tingkatan hint (hint1: pseudocode, hint2: cloze code, hint3: basic code).

LANGKAH 5 — LOOP SELESAI & RETURN
Setelah seluruh materi pada daftar diproses, gabungkan seluruh hasil menjadi satu response JSON akhir sesuai format output di bawah, lalu kembalikan (return) sebagai hasil akhir ke pemanggil.

=== FORMAT OUTPUT (WAJIB, JSON MURNI) ===
Kembalikan HANYA JSON valid, tanpa markdown code fence, tanpa teks tambahan di luar JSON, dengan struktur PERSIS seperti berikut:

{
  "status": "success",
  "total_materi": <jumlah materi Python yang ditemukan>,
  "data": [
    {
      "id": 1,
      "title": "<judul singkat materi>",
      "description": "<deskripsi singkat 1-2 kalimat tentang materi ini>",
      "subjects": "<isi materi lengkap dalam format Markdown, di-flatten menjadi satu baris string dengan \\n sebagai pemisah baris>",
      "existing_questions": [
        {
          "reference": "<PDF> Halaman <nomor halaman>",
          "sub-theme": "<judul materi terkait>",
          "judul": "<judul singkat soal>",
          "soal": "<isi soal apa adanya dari PDF>",
          "expected_output": "<contoh output/jawaban yang diharapkan>",
          "hint1": "<hint 1: pseudocode/alur penyelesaian>",
          "hint2": "<hint 2: cloze code / kode rumpang>",
          "hint3": "<hint 3: basic code / kode solusi dasar>"
        }
      ],
      "generated_questions": [
        {
          "reference": "AI Generated",
          "sub-theme": "<judul materi terkait>",
          "judul": "<judul singkat soal>",
          "soal": "<isi soal baru hasil generate>",
          "expected_output": "<contoh output/jawaban yang diharapkan>",
          "hint1": "<hint 1: pseudocode/alur penyelesaian>",
          "hint2": "<hint 2: cloze code / kode rumpang>",
          "hint3": "<hint 3: basic code / kode solusi dasar>"
        }
      ]
    }
  ]
}

=== ATURAN TAMBAHAN ===
- Jika sebuah materi tidak memiliki soal existing di PDF, kembalikan "existing_questions" sebagai array kosong [].
- "generated_questions" WAJIB selalu berisi minimal 1 soal untuk setiap materi.
- Pastikan setiap soal memiliki "hint1", "hint2", dan "hint3" yang jelas dan mendidik.
- Gunakan bahasa Indonesia untuk seluruh judul, deskripsi, dan soal, kecuali istilah teknis pemrograman.
- Field "subjects" harus valid sebagai string JSON (escape karakter khusus dengan benar) dan tidak boleh mengandung baris baru literal.
- Jangan menambahkan penjelasan, catatan, atau teks apapun di luar struktur JSON di atas.
- Jangan membungkus JSON dalam \`\`\`json atau backtick apapun.
`;

  constructor(private readonly configService: ConfigService) {
    const apiKey =
      this.configService?.get<string>('GEMINI_API_KEY') ||
      process.env.GEMINI_API_KEY;
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
    }
    this.defaultModelName =
      this.configService?.get<string>('GEMINI_MODEL') ||
      process.env.GEMINI_MODEL ||
      'gemini-2.5-flash';
  }

  private getGenAI(): GoogleGenerativeAI {
    if (this.genAI) return this.genAI;
    const apiKey =
      this.configService?.get<string>('GEMINI_API_KEY') ||
      process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new BadRequestException(
        'GEMINI_API_KEY belum diset di environment variable backend.',
      );
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
    return this.genAI;
  }

  private async extractText(file: Express.Multer.File): Promise<string> {
    if (file.mimetype === MIME_PDF) {
      const originalWarn = console.warn;
      try {
        console.warn = (...args: any[]) => {
          const msg = args[0] ? String(args[0]) : '';
          if (
            msg.includes('TT: undefined function') ||
            msg.includes('Cannot substitute the font') ||
            msg.includes('Math.sumPrecise')
          ) {
            return;
          }
          originalWarn(...args);
        };

        const pdf = await getDocumentProxy(new Uint8Array(file.buffer));
        const { text } = await extractPdfText(pdf, { mergePages: true });
        return text;
      } finally {
        console.warn = originalWarn;
      }
    }

    if (file.mimetype === MIME_DOCX) {
      const { value } = await mammoth.extractRawText({ buffer: file.buffer });
      return value;
    }

    throw new BadRequestException(
      `Format file tidak didukung: ${file.mimetype} (hanya PDF atau .docx)`,
    );
  }

  async countTokens(file: Express.Multer.File, body: CountTokensDto) {
    if (!file) {
      throw new BadRequestException(
        'File PDF atau Word wajib diupload (field: document)',
      );
    }

    const usedModel = body?.model || this.defaultModelName;
    const documentText = await this.extractText(file);
    const combinedContent = [this.PROMPT, documentText]
      .filter(Boolean)
      .join('\n\n---\n\n');

    const genAI = this.getGenAI();
    const model = genAI.getGenerativeModel({ model: usedModel });
    const { totalTokens } = await model.countTokens(combinedContent);

    return {
      fileName: file.originalname,
      fileType: file.mimetype,
      promptCharCount: this.PROMPT.length,
      documentCharCount: documentText.length,
      totalTokens,
      model: usedModel,
    };
  }

  async generateMateri(file: Express.Multer.File, body: CountTokensDto) {
    if (!file) {
      throw new BadRequestException(
        'File PDF atau Word wajib diupload (field: document)',
      );
    }

    const usedModel = body?.model || this.defaultModelName;
    const documentText = await this.extractText(file);
    const combinedContent = [this.PROMPT, documentText]
      .filter(Boolean)
      .join('\n\n---\n\n');

    const genAI = this.getGenAI();
    const model = genAI.getGenerativeModel({ model: usedModel });

    const result = await model.generateContent(combinedContent);
    const response = result.response;
    const rawText = response.text();

    let cleanedText = rawText.trim();
    if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();
    }

    let parsedResult: any;
    try {
      parsedResult = JSON.parse(cleanedText);
    } catch (err) {
      throw new BadRequestException(
        'Gagal parsing response AI sebagai JSON: ' + (err as Error).message,
      );
    }

    const usage = response.usageMetadata;
    const inputTokens = usage?.promptTokenCount ?? 0;
    const outputTokens = usage?.candidatesTokenCount ?? 0;
    const totalTokens = usage?.totalTokenCount ?? inputTokens + outputTokens;
    const thinkingTokens = (usage as any)?.thoughtsTokenCount ?? 0;

    const cost = calculateCost(usedModel, inputTokens, outputTokens);

    return {
      fileName: file.originalname,
      fileType: file.mimetype,
      model: usedModel,
      usage: {
        inputTokens,
        outputTokens,
        thinkingTokens,
        totalTokens,
      },
      cost: cost.pricingFound
        ? {
            usd: {
              input: Number(cost.inputCostUSD.toFixed(6)),
              output: Number(cost.outputCostUSD.toFixed(6)),
              total: Number(cost.totalCostUSD.toFixed(6)),
            },
            idr: {
              input: Math.round(cost.inputCostIDR),
              output: Math.round(cost.outputCostIDR),
              total: Math.round(cost.totalCostIDR),
              formatted: formatIDR(cost.totalCostIDR),
            },
            exchangeRate: `1 USD = Rp ${cost.exchangeRate.toLocaleString('id-ID')}`,
          }
        : {
            note: `Harga untuk model "${usedModel}" belum terdaftar di pricing map, tidak bisa hitung cost.`,
          },
      result: parsedResult,
    };
  }
}
