// gemini-pricing.constant.ts

export interface ModelPricing {
  input: number;   // USD per 1M token input
  output: number;  // USD per 1M token output (termasuk thinking tokens)
  inputAbove200k?: number;
  outputAbove200k?: number;
}

// Harga per 1 Juta token (Standard tier, USD) — cek ulang berkala di
// https://ai.google.dev/gemini-api/docs/pricing
export const GEMINI_PRICING: Record<string, ModelPricing> = {
  'gemini-2.5-flash-lite': { input: 0.10, output: 0.40 },
  'gemini-2.5-flash': { input: 0.30, output: 2.50 },
  'gemini-2.5-pro': {
    input: 1.25, output: 10.00,
    inputAbove200k: 2.50, outputAbove200k: 15.00,
  },
  'gemini-3.1-flash-lite': { input: 0.25, output: 1.50 },
  'gemini-3.5-flash': { input: 1.50, output: 9.00 },
  'gemini-3.6-flash': { input: 0.75, output: 3.75 }, // promo s.d. 31 Des 2026
  'gemini-3.7-flash': { input: 0.75, output: 3.75 }, // promo s.d. 31 Des 2026
  'gemini-3.1-pro-preview': {
    input: 2.00, output: 12.00,
    inputAbove200k: 4.00, outputAbove200k: 18.00,
  },
};

// Kurs USD -> IDR. Sebaiknya ambil dari env var / API kurs live,
// jangan hardcode permanen karena kurs berubah tiap hari.
// Nilai default di bawah adalah kurs referensi per 18 Agustus 2026 (~Rp 17.800/USD).
export const USD_TO_IDR_RATE = Number(process.env.USD_TO_IDR_RATE) || 17800;

export interface CostResult {
  inputCostUSD: number;
  outputCostUSD: number;
  totalCostUSD: number;
  inputCostIDR: number;
  outputCostIDR: number;
  totalCostIDR: number;
  exchangeRate: number;
  pricingFound: boolean;
}

export function calculateCost(
  modelName: string,
  inputTokens: number,
  outputTokens: number,
): CostResult {
  const pricing = GEMINI_PRICING[modelName];

  if (!pricing) {
    return {
      inputCostUSD: 0, outputCostUSD: 0, totalCostUSD: 0,
      inputCostIDR: 0, outputCostIDR: 0, totalCostIDR: 0,
      exchangeRate: USD_TO_IDR_RATE,
      pricingFound: false,
    };
  }

  const isAbove200k = inputTokens > 200_000 && pricing.inputAbove200k !== undefined;
  const inputRate = isAbove200k ? pricing.inputAbove200k! : pricing.input;
  const outputRate = isAbove200k ? pricing.outputAbove200k! : pricing.output;

  const inputCostUSD = (inputTokens / 1_000_000) * inputRate;
  const outputCostUSD = (outputTokens / 1_000_000) * outputRate;
  const totalCostUSD = inputCostUSD + outputCostUSD;

  return {
    inputCostUSD,
    outputCostUSD,
    totalCostUSD,
    inputCostIDR: inputCostUSD * USD_TO_IDR_RATE,
    outputCostIDR: outputCostUSD * USD_TO_IDR_RATE,
    totalCostIDR: totalCostUSD * USD_TO_IDR_RATE,
    exchangeRate: USD_TO_IDR_RATE,
    pricingFound: true,
  };
}

// Helper format Rupiah, contoh: 15230.5 -> "Rp 15.231"
export function formatIDR(value: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}