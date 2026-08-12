import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface NilaiJson {
  fungsionalitas: number;
  logika: number;
  syntax: number;
  code_style: number;
  dokumentasi: number;
  konsep: number;
}

interface ScoreJsonEntry {
  id_soal: number;
  kode_siswa: string;
  level_siswa: string;
  nilai: NilaiJson;
  nilai_avg: number;
  feedback: string;
}

function getRandomElement<T>(arr: T[]): T {
  if (arr.length === 0) {
    throw new Error('Array kosong, tidak ada data untuk dipilih secara random');
  }
  return arr[Math.floor(Math.random() * arr.length)];
}

// generate random Date antara `daysAgo` hari yang lalu sampai sekarang
function getRandomDate(daysAgo: number): Date {
  const now = Date.now();
  const past = now - daysAgo * 24 * 60 * 60 * 1000;
  const randomTime = past + Math.random() * (now - past);
  return new Date(randomTime);
}

export async function seedScore() {
  // 1. Baca dataset/score.json
  const filePath = path.join(process.cwd(), 'dataset', 'score.json');
  const rawData = fs.readFileSync(filePath, 'utf-8');
  const scoreData: ScoreJsonEntry[] = JSON.parse(rawData);

  console.log(`Ditemukan ${scoreData.length} entri di score.json`);

  // 2. Ambil semua Test
  const allTests = await prisma.test.findMany({
    select: { id: true },
  });

  if (allTests.length === 0) {
    throw new Error(
      'Tidak ada data Test di database. Seed Test terlebih dahulu.',
    );
  }

  // 3. Ambil semua User dengan role.description = "Siswa"
  const allSiswa = await prisma.user.findMany({
    where: {
      role: {
        description: 'Siswa',
      },
    },
    select: { id: true },
  });

  if (allSiswa.length === 0) {
    throw new Error('Tidak ada User dengan role "Siswa" di database.');
  }

  console.log(
    `Ditemukan ${allTests.length} Test dan ${allSiswa.length} User Siswa`,
  );

  // 4. Transform & insert satu per satu
  let successCount = 0;
  const DAYS_RANGE = 180; // sebar data 6 bulan terakhir, ubah sesuai kebutuhan

  for (const entry of scoreData) {
    const randomTest = getRandomElement(allTests);
    const randomSiswa = getRandomElement(allSiswa);
    const randomDate = getRandomDate(DAYS_RANGE);
    const randomTime = getRandomTime()

    try {
      await prisma.score.create({
        data: {
          idTest: randomTest.id,
          idUser: randomSiswa.id,
          level: entry.level_siswa,
          averageScore: Math.round(entry.nilai_avg),
          flagOverride: false,
          aiScore: JSON.stringify(entry.nilai),
          aiSuggestion: entry.feedback,
          aiFinishTime: randomTime.toISOString(),
          createdAt: randomDate,
          uCode: entry.kode_siswa,
          // overrideBy, teacherScore, teacherSuggestion dibiarkan null (optional)
        },
      });
      successCount++;
    } catch (err) {
      console.error(`Gagal insert entri id_soal=${entry.id_soal}:`, err);
    }
  }

  console.log(
    `Selesai. ${successCount}/${scoreData.length} data berhasil di-insert.`,
  );
}

function getRandomTime(): Date {
  const minSeconds = 1;
  const maxSeconds = 5 * 60; // 5 menit = 300 detik

  const randomSeconds = Math.random() * (maxSeconds - minSeconds) + minSeconds;

  const ms = Math.round(randomSeconds * 1000);
  const hours = Math.floor(ms / 3_600_000);
  const minutes = Math.floor((ms % 3_600_000) / 60_000);
  const seconds = Math.floor((ms % 60_000) / 1000);
  const millis = ms % 1000;

  const hh = String(hours).padStart(2, '0');
  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');
  const sss = String(millis).padStart(3, '0');

  return new Date(`1970-01-01T${hh}:${mm}:${ss}.${sss}Z`);
}
