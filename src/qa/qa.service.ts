import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../general/user/entities/user.entity';
import { Class } from '../general/class/entities/class.entity';
import { ClassAssign } from '../general/class-assign/entities/class-assign.entity';
import { RoleState } from '../general/class-assign/entities/role-state.enum';
import { Test } from '../general/test/entities/test.entity';
import { Score } from '../general/score/entities/score.entity';
import { Topic } from '../general/topic/entities/topic.entity';
import { Progress } from '../general/progress/entities/progress.entity';

@Injectable()
export class QaService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Class) private classRepo: Repository<Class>,
    @InjectRepository(ClassAssign) private classAssignRepo: Repository<ClassAssign>,
    @InjectRepository(Test) private testRepo: Repository<Test>,
    @InjectRepository(Score) private scoreRepo: Repository<Score>,
    @InjectRepository(Topic) private topicRepo: Repository<Topic>,
    @InjectRepository(Progress) private progressRepo: Repository<Progress>,
  ) {}
  private readonly DUMMY_NEW_CLASS_TITLE = 'Kelas Baru - Negative Test';
  
  // ===== Happy path (sudah ada sebelumnya) =====

  async giveClassSiswa() {
    return this.assignDummyClass('negative_siswa', RoleState.ACTIVE);
  }

  async giveClassGuru() {
    return this.assignDummyClass('negative_guru', RoleState.INACTIVE);
  }

    private async getUserOrThrow(uCredentials: string): Promise<User> {
    const user = await this.userRepo.findOne({ where: { uCredentials } });
    if (!user) {
      throw new NotFoundException(
        `User dengan credential "${uCredentials}" tidak ditemukan.`,
      );
    }
    return user;
  }

  // Buat class baru dari nol, lalu assign ke negative_guru.
  async createAndAssignClassGuru() {
    const guru = await this.getUserOrThrow('negative_guru');

    const newClass = this.classRepo.create({
      title: this.DUMMY_NEW_CLASS_TITLE,
      waliKelas: guru.fullName,
      countTotal: 0,
    });
    const savedClass = await this.classRepo.save(newClass);

    const assign = this.classAssignRepo.create({
      idClass: savedClass.id,
      idUser: guru.id,
      state: RoleState.INACTIVE,
    });
    const savedAssign = await this.classAssignRepo.save(assign);

    return { class: savedClass, assignment: savedAssign };
  }

  // Assign negative_siswa ke class yang dibuat oleh createAndAssignClassGuru().
  // Dicari lewat title dummy yang sama, karena Class tidak punya timestamp
  // buat nentuin "yang paling baru dibuat".
  async addSiswaToNewClass() {
    const siswa = await this.getUserOrThrow('negative_siswa');

    const newClass = await this.classRepo.findOne({
      where: { title: this.DUMMY_NEW_CLASS_TITLE },
    });

    if (!newClass) {
      throw new NotFoundException(
        `Class dengan title "${this.DUMMY_NEW_CLASS_TITLE}" belum ada. Panggil /qa/guru/create-and-assign-class dulu.`,
      );
    }

    const assign = this.classAssignRepo.create({
      idClass: newClass.id,
      idUser: siswa.id,
      state: RoleState.ACTIVE,
    });

    return this.classAssignRepo.save(assign);
  }

  async giveScoreSiswa() {
    const user = await this.userRepo.findOne({
      where: { uCredentials: 'negative_siswa' },
    });
    if (!user)
      throw new NotFoundException(
        'User dengan credential "negative_siswa" tidak ditemukan.',
      );

    const [testData] = await this.testRepo.find({ take: 1 });
    if (!testData) throw new NotFoundException('Test tidak ditemukan.');

    const score = this.scoreRepo.create({
      idTest: testData.id,
      idUser: user.id,
      level: 'Expert',
      averageScore: 93,
      flagOverride: false,
      hintUsage: 0,
      aiScore: {
        fungsionalitas: 100,
        logika: 100,
        syntax: 100,
        code_style: 90,
        dokumentasi: 80,
        konsep: 90,
      },
      aiSuggestion:
        'Implementasi terbaik dari seluruh level, efisien, modular, dan terdokumentasi penuh dengan doctest.',
      aiFinishTime: '00:05:00' as unknown as Date,
      uCode: 'print("dummy code untuk negative testing")',
    });

    return this.scoreRepo.save(score);
  }

  // ===== Negative testing =====
  // Catatan: method-method ini SENGAJA mengirim data yang salah/tidak konsisten.
  // Kalau backend "berhasil" nyimpen tanpa error, itu justru sinyal ada
  // lubang validasi yang perlu ditambal (missing FK constraint, missing check, dst).

  async scoreInvalidUser() {
    const [testData] = await this.testRepo.find({ take: 1 });
    if (!testData)
      throw new NotFoundException(
        'Test tidak ditemukan untuk keperluan test ini.',
      );

    const score = this.scoreRepo.create({
      idTest: testData.id,
      idUser: '00000000-0000-0000-0000-000000000000', // user fiktif, harusnya ke-reject FK
      level: 'Expert',
      averageScore: 90,
      flagOverride: false,
      hintUsage: 0,
      aiScore: {},
      aiSuggestion: 'negative test: idUser invalid',
      aiFinishTime: '00:01:00' as unknown as Date,
      uCode: 'x = 1',
    });

    return this.scoreRepo.save(score);
  }

  async scoreInvalidTest() {
    const user = await this.userRepo.findOne({
      where: { uCredentials: 'negative_siswa' },
    });
    if (!user)
      throw new NotFoundException(
        'User dengan credential "negative_siswa" tidak ditemukan.',
      );

    const score = this.scoreRepo.create({
      idTest: '00000000-0000-0000-0000-000000000000', // test fiktif, harusnya ke-reject FK
      idUser: user.id,
      level: 'Expert',
      averageScore: 90,
      flagOverride: false,
      hintUsage: 0,
      aiScore: {},
      aiSuggestion: 'negative test: idTest invalid',
      aiFinishTime: '00:01:00' as unknown as Date,
      uCode: 'x = 1',
    });

    return this.scoreRepo.save(score);
  }

  async scoreOutOfRange() {
    const user = await this.userRepo.findOne({
      where: { uCredentials: 'negative_siswa' },
    });
    const [testData] = await this.testRepo.find({ take: 1 });
    if (!user || !testData)
      throw new NotFoundException(
        'User/Test dummy belum tersedia untuk test ini.',
      );

    // averageScore = 150, di luar 0-100. Kolomnya cuma "Int" di schema,
    // jadi kalau nggak ada CHECK constraint / validasi manual, ini bakal lolos.
    const score = this.scoreRepo.create({
      idTest: testData.id,
      idUser: user.id,
      level: 'Expert',
      averageScore: 150,
      flagOverride: false,
      hintUsage: -5, // sekalian negative value di field yang harusnya >= 0
      aiScore: {},
      aiSuggestion: 'negative test: averageScore & hintUsage out of range',
      aiFinishTime: '00:01:00' as unknown as Date,
      uCode: 'x = 1',
    });

    return this.scoreRepo.save(score);
  }

  async classAssignRoleMismatch() {
    // Ambil user dengan role SISWA tapi di-assign dengan state GURU
    const user = await this.userRepo.findOne({
      where: { uCredentials: 'negative_siswa' },
    });
    const [classData] = await this.classRepo.find({ take: 1 });
    if (!user || !classData)
      throw new NotFoundException(
        'User/Class dummy belum tersedia untuk test ini.',
      );

    const assign = this.classAssignRepo.create({
      idClass: classData.id,
      idUser: user.id,
      state: RoleState.INACTIVE, // mismatch dengan role asli user di TABLE_ROLE
    });

    return this.classAssignRepo.save(assign);
  }

  async classAssignDuplicate() {
    const user = await this.userRepo.findOne({
      where: { uCredentials: 'negative_siswa' },
    });
    const [classData] = await this.classRepo.find({ take: 1 });
    if (!user || !classData)
      throw new NotFoundException(
        'User/Class dummy belum tersedia untuk test ini.',
      );

    // Save 2x dengan kombinasi user+class yang sama persis.
    // Schema kamu nggak punya @@unique([idUser, idClass]), jadi ini
    // kemungkinan besar bakal berhasil dobel — pertanyaannya: apa itu memang diinginkan?
    const first = this.classAssignRepo.create({
      idClass: classData.id,
      idUser: user.id,
      state: RoleState.ACTIVE,
    });
    await this.classAssignRepo.save(first);

    const duplicate = this.classAssignRepo.create({
      idClass: classData.id,
      idUser: user.id,
      state: RoleState.ACTIVE,
    });
    return this.classAssignRepo.save(duplicate);
  }

  async progressOverflow() {
    const user = await this.userRepo.findOne({
      where: { uCredentials: 'negative_siswa' },
    });
    const [topicData] = await this.topicRepo.find({ take: 1 });
    if (!user || !topicData)
      throw new NotFoundException(
        'User/Topic dummy belum tersedia untuk test ini.',
      );

    // progressCount > maxCount, secara logika nggak masuk akal
    // (progress ngelewatin batas), tapi secara tipe data (Int) tetap valid.
    const progress = this.progressRepo.create({
      idUser: user.id,
      idTopic: topicData.id,
      maxCount: 5,
      progressCount: 999,
    });

    return this.progressRepo.save(progress);
  }

  async topicInvalidClass() {
    const topic = this.topicRepo.create({
      idClass: '00000000-0000-0000-0000-000000000000', // class fiktif
      title: 'Negative test topic',
      subject: 'Negative testing subject',
      isActive: true,
    });

    return this.topicRepo.save(topic);
  }

  async deleteUserWithRelations() {
    const user = await this.userRepo.findOne({
      where: { uCredentials: 'negative_siswa' },
    });
    if (!user)
      throw new NotFoundException(
        'User dengan credential "negative_siswa" tidak ditemukan.',
      );

    // User ini kemungkinan masih punya relasi di ClassAssign/Score/Progress
    // (dibuat oleh endpoint-endpoint lain di atas). Hapus langsung dan lihat
    // apakah DB menolak (FK constraint, bagus) atau malah sukses (orphan rows, bug).
    return this.userRepo.delete({ id: user.id });
  }

  // ===== Internal =====

  private async assignDummyClass(uCredentials: string, state: RoleState) {
    const user = await this.userRepo.findOne({ where: { uCredentials } });
    if (!user)
      throw new NotFoundException(
        `User dengan credential "${uCredentials}" tidak ditemukan.`,
      );

    const [classData] = await this.classRepo.find({ take: 1 });
    if (!classData) throw new NotFoundException('Class tidak ditemukan.');

    const classAssign = this.classAssignRepo.create({
      idClass: classData.id,
      idUser: user.id,
      state,
    });

    return this.classAssignRepo.save(classAssign);
  }
}
