import { PrismaClient, CompileStatus, ExecutionStatus, ProgressStatus, User } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
console.log('🌱 Seeding database...');

// ==========================
// ROLE
// ==========================
const teacherRole = await prisma.role.create({
data: {
    rCode: 'TCHR',
    description: 'Teacher',
},
});

const studentRole = await prisma.role.create({
data: {
    rCode: 'STDT',
    description: 'Student',
},
});

// ==========================
// CLASS
// ==========================
const classA = await prisma.class.create({
data: {
    title: 'Kelas Python Dasar',
    countTotal: 5,
},
});

// ==========================
// TOPIC
// ==========================
const topic = await prisma.topic.create({
data: {
    title: 'Percabangan',
    description: 'Materi IF ELSE',
    orderNo: 1,
},
});

// ==========================
// MATERIAL
// ==========================
await prisma.material.create({
data: {
    idTopic: topic.id,
    title: 'Belajar IF ELSE',
    cp: 'Memahami Percabangan',
    concept: 'if else digunakan untuk pengambilan keputusan',
    example1: 'if nilai > 70',
    example2: 'else',
    summary: 'Gunakan if ketika kondisi benar',
},
});

// ==========================
// RUBRIC
// ==========================
const rubric = await prisma.rubric.create({
data: {
    title: 'Rubrik Python Dasar',
    description: 'Penilaian AI',
    prompt: 'Nilai berdasarkan logika, efisiensi dan output.',
    maxScore: 100,
},
});

// ==========================
// TEST
// ==========================
const test = await prisma.test.create({
data: {
    idClass: classA.id,
    idTopic: topic.id,
    idRubric: rubric.id,
    title: 'Soal Percabangan',
    question: 'Buat program menentukan bilangan ganjil atau genap.',
    expOutput: 'Genap',
    maxTries: 3,
},
});

// ==========================
// TEST CASE
// ==========================
await prisma.testCase.createMany({
data: [
    {
    idTest: test.id,
    input: '2',
    expectedOutput: 'Genap',
    weight: 40,
    },
    {
    idTest: test.id,
    input: '7',
    expectedOutput: 'Ganjil',
    weight: 60,
    },
],
});

// ==========================
// HINT
// ==========================
await prisma.hint.create({
data: {
    idQuestion: test.id,
    hint1: 'Gunakan operator modulo',
    hint2: 'Cek sisa pembagian',
    hint3: 'Gunakan if else',
},
});

// ==========================
// TEACHER
// ==========================
const teacher = await prisma.user.create({
data: {
    idRole: teacherRole.id,
    fullName: 'Budi Santoso',
    uCredentials: 'guru01',
    uPassword: '123456',
},
});

// ==========================
// STUDENTS (5 DATA)
// ==========================
const students: User[] = [];

for (let i = 1; i <= 5; i++) {
const student = await prisma.user.create({
    data: {
    idRole: studentRole.id,
    idClass: classA.id,
    fullName: `Siswa ${i}`,
    uCredentials: `student${i}`,
    uPassword: '123456',
    },
});

students.push(student);
}

// ==========================
// SUBMISSION
// ==========================
for (const student of students) {
const submission = await prisma.submission.create({
    data: {
    idUser: student.id,
    idTest: test.id,
    sourceCode: `
angka=int(input())
if angka%2==0:
print("Genap")
else:
print("Ganjil")
`,
    compileStatus: CompileStatus.SUCCESS,
    executionStatus: ExecutionStatus.PASSED,
    executionTime: 120,
    },
});

const score = await prisma.score.create({
    data: {
    idSubmission: submission.id,
    level: 'Easy',
    overallScore: 90,
    aiScore: 90,
    aiSuggestion: 'Kode sudah benar.',
    teacherScore: 95,
    teacherSuggestion: 'Penulisan sudah baik.',
    },
});

await prisma.verification.create({
    data: {
    idScore: score.id,
    verifiedBy: teacher.id,
    oldScore: 90,
    newScore: 95,
    note: 'Ditambahkan karena clean code.',
    },
});

await prisma.progress.create({
    data: {
    idUser: student.id,
    idTopic: topic.id,
    progress: 100,
    status: ProgressStatus.COMPLETED,
    },
});

await prisma.activityLog.create({
    data: {
    idUser: student.id,
    activity: 'Submit Test',
    description: 'Mengerjakan soal percabangan',
    },
});
}

console.log('✅ Database seeded successfully!');
}

main()
.catch((e) => {
console.error(e);
process.exit(1);
})
.finally(async () => {
await prisma.$disconnect();
});