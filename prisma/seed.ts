import { PrismaClient, RoleState } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Roles
  const teacherRole = await prisma.role.create({
    data: { description: 'Guru' },
  });

  const studentRole = await prisma.role.create({
    data: { description: 'Siswa' },
  });

  // 2. Teachers (2 Guru)
  const teachers = await Promise.all([
    prisma.user.create({
      data: {
        fullName: 'Budi Santoso, S.Pd.',
        uCredentials: 'budi_guru',
        uPassword: 'password123',
        idRole: teacherRole.id,
      },
    }),
    prisma.user.create({
      data: {
        fullName: 'Siti Aminah, M.Kom.',
        uCredentials: 'siti_guru',
        uPassword: 'password123',
        idRole: teacherRole.id,
      },
    }),
  ]);

  // 3. Students (10 Siswa: 5 untuk Kelas A, 5 untuk Kelas B)
  const studentData = [
    { fullName: 'Anisa Rahmawati', uCredentials: 'anisa_siswa' },
    { fullName: 'Rian Hidayat', uCredentials: 'rian_siswa' },
    { fullName: 'Citra Lestari', uCredentials: 'citra_siswa' },
    { fullName: 'Deni Kurniawan', uCredentials: 'deni_siswa' },
    { fullName: 'Eka Prasetya', uCredentials: 'eka_siswa' },
    { fullName: 'Fajar Nugraha', uCredentials: 'fajar_siswa' },
    { fullName: 'Gita Gutawa', uCredentials: 'gita_siswa' },
    { fullName: 'Hadi Wijaya', uCredentials: 'hadi_siswa' },
    { fullName: 'Indah Permata', uCredentials: 'indah_siswa' },
    { fullName: 'Joko Susilo', uCredentials: 'joko_siswa' },
  ];

  const students = await Promise.all(
    studentData.map((s) =>
      prisma.user.create({
        data: {
          fullName: s.fullName,
          uCredentials: s.uCredentials,
          uPassword: 'password123',
          idRole: studentRole.id,
        },
      })
    )
  );

  const studentsClassA = students.slice(0, 5);
  const studentsClassB = students.slice(5, 10);

  // 4. Classes (2 Kelas, Wali Kelas masing-masing guru)
  const classA = await prisma.class.create({
    data: {
      title: 'Kelas 10 RPL 1',
      waliKelas: teachers[0].fullName,
      countTotal: 5,
    },
  });

  const classB = await prisma.class.create({
    data: {
      title: 'Kelas 10 RPL 2',
      waliKelas: teachers[1].fullName,
      countTotal: 5,
    },
  });

  // 5. Class Assignments (Assign Guru & 5 Siswa ke masing-masing kelas)
  const classAssignments = [
    // Kelas A
    { idUser: teachers[0].id, idClass: classA.id, state: RoleState.GURU },
    ...studentsClassA.map((s) => ({
      idUser: s.id,
      idClass: classA.id,
      state: RoleState.SISWA,
    })),
    // Kelas B
    { idUser: teachers[1].id, idClass: classB.id, state: RoleState.GURU },
    ...studentsClassB.map((s) => ({
      idUser: s.id,
      idClass: classB.id,
      state: RoleState.SISWA,
    })),
  ];

  await prisma.classAssign.createMany({ data: classAssignments });

  // 6. Topics (5 Topik)
  const topicsData = [
    {
      title: 'Dasar Pemrograman Python',
      subject: 'Mengenal variabel, tipe data, dan perulangan.',
    },
    {
      title: 'Struktur Data List & Dictionary',
      subject: 'Memahami manipulasi data koleksi di Python.',
    },
    {
      title: 'Fungsi & Modularisasi',
      subject: 'Pembuatan fungsi, parameter, dan return value.',
    },
    {
      title: 'Object Oriented Programming (OOP)',
      subject: 'Konsep Class, Object, Inheritance, dan Encapsulation.',
    },
    {
      title: 'Penanganan Exception & File I/O',
      subject: 'Try-except block serta membaca/menulis file.',
    },
  ];

  const topics = await Promise.all(
    topicsData.map((t) =>
      prisma.topic.create({
        data: {
          idClass: classA.id,
          title: t.title,
          subject: t.subject,
          isActive: true,
        },
      })
    )
  );

  // 7. Tests (5 Soal/Kuis)
  const testsData = [
    {
      title: 'Kuis 1: Loop and Conditionals',
      question: 'Buatlah fungsi Python yang mencetak angka genap dari 1 sampai 10.',
      expOutput: '2\n4\n6\n8\n10',
      idTopic: topics[0].id,
    },
    {
      title: 'Kuis 2: Manipulasi List',
      question: 'Buatlah program yang mengembalikan nilai terbesar dari daftar angka [3, 7, 2, 9, 5].',
      expOutput: '9',
      idTopic: topics[1].id,
    },
    {
      title: 'Kuis 3: Fungsi Kuadrat',
      question: 'Buat fungsi `kuadrat(x)` yang mengembalikan kuadrat dari parameter x untuk x=5.',
      expOutput: '25',
      idTopic: topics[2].id,
    },
    {
      title: 'Kuis 4: Class Person',
      question: 'Buat class `Person` dengan atribut `nama` = "Budi" lalu cetak nilai atribut tersebut.',
      expOutput: 'Budi',
      idTopic: topics[3].id,
    },
    {
      title: 'Kuis 5: Handling Division Zero',
      question: 'Buat blok try-except untuk menangani pembagian angka 10 dengan 0.',
      expOutput: 'Tidak bisa membagi dengan nol',
      idTopic: topics[4].id,
    },
  ];

  const tests = await Promise.all(
    testsData.map((t) =>
      prisma.test.create({
        data: {
          idTopic: t.idTopic,
          title: t.title,
          question: t.question,
          expOutput: t.expOutput,
          maxTries: 3,
        },
      })
    )
  );

  // 8. Hints (5 Hint, 1 untuk setiap Test)
  const hintsData = [
    {
      idTest: tests[0].id,
      hint1: 'Gunakan perulangan `for` dengan fungsi `range()`.',
      hint2: 'Gunakan operator modulus `%` untuk mengecek bilangan genap.',
      hint3: 'Gunakan sintaks `if i % 2 == 0:` di dalam perulangan.',
    },
    {
      idTest: tests[1].id,
      hint1: 'Anda bisa menggunakan fungsi bawaan `max()`.',
      hint2: 'Atau iterasi setiap elemen dan simpan nilai terbesarnya.',
      hint3: 'Pastikan list terdefinisi dengan benar.',
    },
    {
      idTest: tests[2].id,
      hint1: 'Gunakan kata kunci `def` untuk membuat fungsi.',
      hint2: 'Gunakan operator `**` atau `x * x`.',
      hint3: 'Gunakan `return` untuk mengembalikan nilai.',
    },
    {
      idTest: tests[3].id,
      hint1: 'Definisikan class menggunakan `class Person:`.',
      hint2: 'Gunakan method `__init__` untuk inisialisasi properti.',
      hint3: 'Buat instance object lalu panggil atribut `nama`.',
    },
    {
      idTest: tests[4].id,
      hint1: 'Gunakan kata kunci `try` dan `except`.',
      hint2: 'Tangkap `ZeroDivisionError`.',
      hint3: 'Cetak pesan penanganan di dalam blok `except`.',
    },
  ];

  await Promise.all(hintsData.map((h) => prisma.hint.create({ data: h })));

  // 9. Scores (5 Dummy Score untuk 5 Siswa di Kelas A pada Test 1)
  const scoresData = studentsClassA.map((student, idx) => ({
    idTest: tests[0].id,
    idUser: student.id,
    level: idx % 2 === 0 ? 'Medium' : 'Hard',
    averageScore: 75 + idx * 5,
    flagOverride: idx % 2 === 0,
    aiScore: String(70 + idx * 5),
    aiSuggestion: 'Logika kode sudah baik, perhatikan efisiensi memori.',
    aiFinishTime: `00:0${idx + 1}:30`,
    uCode: 'for i in range(1, 11):\n    if i % 2 == 0:\n        print(i)',
    overrideBy: teachers[0].id,
    teacherScore: String(75 + idx * 5),
    teacherSuggestion: 'Kerja bagus, pertahankan!',
  }));

  await Promise.all(scoresData.map((s) => prisma.score.create({ data: s })));

  // 10. Progress (5 Progress Record untuk 5 Siswa di Kelas A)
  const progressData = studentsClassA.map((student, idx) => ({
    idUser: student.id,
    idTopic: topics[idx].id,
    maxCount: 5,
    progressCount: idx + 1,
  }));

  await prisma.progress.createMany({ data: progressData });

  console.log('✅ Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });