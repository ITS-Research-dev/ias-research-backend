import { PrismaClient, RoleState } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // 0. Clean database
  console.log('🧹 Cleaning database...');
  await prisma.progress.deleteMany({});
  await prisma.score.deleteMany({});
  await prisma.hint.deleteMany({});
  await prisma.test.deleteMany({});
  await prisma.topic.deleteMany({});
  await prisma.classAssign.deleteMany({});
  await prisma.class.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.role.deleteMany({});

  // 1. Roles
  const teacherRole = await prisma.role.create({
    data: {
      description: 'Guru',
    },
  });
  const studentRole = await prisma.role.create({
    data: {
      description: 'Siswa',
    },
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

  // 6. Read JSON datasets
  console.log('📖 Loading datasets from JSON...');
  const datasetDir = path.resolve(__dirname, '../dataset');
  const rawSubject = fs.readFileSync(path.join(datasetDir, 'subject.json'), 'utf-8');
  const rawTest = fs.readFileSync(path.join(datasetDir, 'test.json'), 'utf-8');
  const rawHint = fs.readFileSync(path.join(datasetDir, 'hint.json'), 'utf-8');
  const rawScore = fs.readFileSync(path.join(datasetDir, 'score.json'), 'utf-8');

  const subjectJSON = JSON.parse(rawSubject);
  const testJSON = JSON.parse(rawTest);
  const hintJSON = JSON.parse(rawHint);
  const scoreJSON = JSON.parse(rawScore);

  // 7. Seed Topics (from subject.json)
  console.log('📚 Seeding Topics...');
  // We'll create topics for classA
  const topicMap = new Map<string, string>(); // Maps subject title to Topic UUID
  for (const s of subjectJSON) {
    const topic = await prisma.topic.create({
      data: {
        idClass: classA.id,
        title: s.title,
        subject: s.subjects || s.description || '',
        isActive: true,
      },
    });
    topicMap.set(s.title, topic.id);
  }

  // 8. Seed Tests (from test.json)
  console.log('📝 Seeding Tests...');
  const testIdMap = new Map<number, string>(); // Maps JSON integer id to Test UUID
  for (const t of testJSON) {
    // Find matching topic
    const topicId = topicMap.get(t['sub-theme']);
    if (!topicId) {
      console.warn(`⚠️ Warning: Topic not found for sub-theme "${t['sub-theme']}" in test ID ${t.id}`);
      continue;
    }
    const test = await prisma.test.create({
      data: {
        idTopic: topicId,
        title: t.judul,
        question: t.soal,
        expOutput: t.expected_output || '',
        maxTries: 3,
      },
    });
    testIdMap.set(t.id, test.id);
  }

  // 9. Seed Hints (from hint.json)
  console.log('💡 Seeding Hints...');
  const hintsToCreate: any[] = [];
  for (const [key, val] of Object.entries(hintJSON)) {
    // key is like "soal_1"
    const match = key.match(/soal_(\d+)/);
    if (!match) continue;
    const jsonTestId = parseInt(match[1], 10);
    const testUuid = testIdMap.get(jsonTestId);
    if (!testUuid) continue;

    const h = val as any;
    hintsToCreate.push({
      idTest: testUuid,
      hint1: h.hints?.['1'] || '',
      hint2: h.hints?.['2'] || '',
      hint3: h.hints?.['3'] || '',
    });
  }
  if (hintsToCreate.length > 0) {
    await prisma.hint.createMany({ data: hintsToCreate });
  }

  // 10. Seed Scores (from score.json)
  console.log('🏆 Seeding Scores...');
  const scoresToCreate: any[] = [];
  // Use studentsClassA as the target users for these scores
  let studentIdx = 0;
  for (const s of scoreJSON) {
    const testUuid = testIdMap.get(s.id_soal);
    if (!testUuid) continue;

    // Distribute among students in class A
    const student = studentsClassA[studentIdx];
    studentIdx = (studentIdx + 1) % studentsClassA.length;

    scoresToCreate.push({
      idTest: testUuid,
      idUser: student.id,
      level: s.level_siswa || 'Medium',
      averageScore: Math.round(s.nilai_avg) || 0,
      flagOverride: false,
      aiScore: JSON.stringify(s.nilai || {}),
      aiSuggestion: s.feedback || '',
      aiFinishTime: '00:05:00',
      uCode: s.kode_siswa || '',
    });
  }

  // Chunk score insertions to prevent DB packet size limits
  const chunkSize = 1000;
  for (let i = 0; i < scoresToCreate.length; i += chunkSize) {
    const chunk = scoresToCreate.slice(i, i + chunkSize);
    await prisma.score.createMany({ data: chunk });
  }

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