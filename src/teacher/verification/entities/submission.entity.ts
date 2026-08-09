import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('submissions')
export class Submission {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    studentId: string;

    @Column({ nullable: true })
    studentName?: string;

    @Column({ nullable: true })
    questionTitle?: string;

    @Column({ nullable: true, default: 'XI RPL 2' })
    className: string;

    @Column({ nullable: true })
    questionId: string;

    @Column('text', { nullable: true })
    code?: string;

    @Column('jsonb', { nullable: true })
    aiScore: Record<string, number> | null;

    @Column('text', { nullable: true })
    aiNote?: string;

    @Column({ type: 'varchar', default: 'perlu' })
    status: 'perlu' | 'selesai' | 'ditolak';

    @Column('jsonb', { nullable: true })
    finalScore: Record<string, number> | null;

    @Column({ type: 'int', nullable: true })
    accuracy?: number;

    @Column('text', { nullable: true })
    reviewerId?: string;

    @Column('text', { nullable: true })
    teacherNote?: string;

    @CreateDateColumn() createdAt: Date;
    @UpdateDateColumn() updatedAt: Date;
}