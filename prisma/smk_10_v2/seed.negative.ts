import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Generate akun "negative" untuk keperluan testing negatif
 * (misal: cek behavior sistem saat akun tidak terhubung ke kelas/data apapun).
 *
 * Hanya membuat akun (User), tidak melakukan ClassAssign atau seeding data lain.
 * Dipanggil setelah Role 'Guru' dan 'Siswa' sudah di-seed di seed utama.
 */
export async function seedNegative() {
  console.log('🚫 Seeding Negative Accounts...');

  const teacherRole = await prisma.role.findFirst({
    where: { description: 'Guru' },
  });
  const studentRole = await prisma.role.findFirst({
    where: { description: 'Siswa' },
  });

  if (!teacherRole || !studentRole) {
    throw new Error(
      '❌ Role "Guru" / "Siswa" belum ditemukan. Pastikan roles sudah di-seed sebelum generateNegative() dijalankan.'
    );
  }

  await prisma.user.create({
    data: {
      fullName: 'Siswa Negative',
      uCredentials: 'negative_siswa',
      uPassword: 'password123',
      idRole: studentRole.id,
    },
  });

  await prisma.user.create({
    data: {
      fullName: 'Guru Negative',
      uCredentials: 'negative_guru',
      uPassword: 'password123',
      idRole: teacherRole.id,
    },
  });

  console.log('✅ Negative accounts seeded (negative_siswa, negative_guru).');
}