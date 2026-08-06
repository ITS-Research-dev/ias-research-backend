import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Submission } from './entities/submission.entity';
import { Review } from './entities/review.entity';

@Injectable()
export class VerificationService {
    constructor(
        @InjectRepository(Submission) private subRepo: Repository<Submission>,
        @InjectRepository(Review) private revRepo: Repository<Review>,
    ) {}

    async listQueue(className?: string, q?: string) {
        const qb = this.subRepo.createQueryBuilder('s');
        if (className) qb.andWhere('s.className = :className', { className });
        if (q) qb.andWhere('(LOWER(s.studentId) LIKE :q OR LOWER(s.questionId) LIKE :q)', { q: `%${q.toLowerCase()}%` });
        qb.orderBy('s.createdAt', 'DESC');
        const items = await qb.getMany();
        return items;
    }

    async getSubmissionDetail(id: string) {
        return this.subRepo.findOne({ where: { id } });
    }

    async review(id: string, payload: any) {
        const submission = await this.subRepo.findOne({ where: { id } });
        if (!submission) throw new NotFoundException();
        if (payload.decision === 'terima') {
        submission.finalScore = submission.aiScore;
        submission.accuracy = 100;
        } else {
        submission.finalScore = payload.finalScore || submission.aiScore;
        const dims = ['logika','fungsi','sintaks','dok','gaya','konsep'];
        let diff = 0;
        for (const d of dims) { diff += Math.abs((submission.aiScore?.[d] || 0) - (submission.finalScore?.[d] || 0)); }
        submission.accuracy = Math.max(0, Math.round(100 - diff / dims.length));
        }
        
        submission.status = 'selesai';
        submission.reviewerId = 'teacher-1'; // replace with auth user
        await this.subRepo.save(submission);

        const review = this.revRepo.create({
        submissionId: submission.id,
        reviewerId: submission.reviewerId!,
        finalScore: submission.finalScore!,
        note: payload.catatan,
        });
        await this.revRepo.save(review);
        return { ok: true, submission, review };
    }
}