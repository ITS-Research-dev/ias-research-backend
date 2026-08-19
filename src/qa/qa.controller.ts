import { Controller, Patch, Post, Delete } from '@nestjs/common';
import { QaService } from './qa.service';

@Controller('qa')
export class QaController {
  constructor(private readonly svc: QaService) {}

  // ===== Happy-path dummy data (sudah ada sebelumnya) =====
  @Patch('siswa/give-class')
  giveClassSiswa() {
    return this.svc.giveClassSiswa();
  }

  @Patch('guru/give-class')
  giveClassGuru() {
    return this.svc.giveClassGuru();
  }

  @Patch('/guru/create-and-assign-class')
  createAndAssignClassGuru() {
    return this.svc.createAndAssignClassGuru();
  }

  @Patch('/siswa/join-new-class')
  addSiswaToNewClass() {
    return this.svc.addSiswaToNewClass();
  }

  @Patch('siswa/give-score')
  giveScoreSiswa() {
    return this.svc.giveScoreSiswa();
  }

  // ===== Negative testing =====

  // FK ke user yang nggak ada -> harus reject, bukan malah lolos
  @Post('negative/score-invalid-user')
  scoreInvalidUser() {
    return this.svc.scoreInvalidUser();
  }

  // FK ke test yang nggak ada
  @Post('negative/score-invalid-test')
  scoreInvalidTest() {
    return this.svc.scoreInvalidTest();
  }

  // averageScore di luar range wajar (0-100) -> cek apakah ada validasi di layer manapun
  @Post('negative/score-out-of-range')
  scoreOutOfRange() {
    return this.svc.scoreOutOfRange();
  }

  // ClassAssign dengan state yang nggak sesuai role asli user (siswa di-assign sbg GURU)
  @Post('negative/class-assign-role-mismatch')
  classAssignRoleMismatch() {
    return this.svc.classAssignRoleMismatch();
  }

  // ClassAssign dobel untuk kombinasi user+class yang sama -> cek ada unique constraint atau nggak
  @Post('negative/class-assign-duplicate')
  classAssignDuplicate() {
    return this.svc.classAssignDuplicate();
  }

  // Progress dengan progressCount > maxCount -> cek validasi logika, bukan cuma tipe data
  @Post('negative/progress-overflow')
  progressOverflow() {
    return this.svc.progressOverflow();
  }

  // Topic dengan idClass yang nggak exist
  @Post('negative/topic-invalid-class')
  topicInvalidClass() {
    return this.svc.topicInvalidClass();
  }

  // Hapus User yang masih punya Score/ClassAssign terkait -> cek FK constraint / cascade behavior
  @Delete('negative/delete-user-with-relations')
  deleteUserWithRelations() {
    return this.svc.deleteUserWithRelations();
  }
}
