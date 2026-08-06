import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('submissions')
export class Submission {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    studentId: string;

    @Column()
    className: string;

    @Column()
    questionId: string;

    @Column('text')
    code: string;

    @Column('jsonb', { nullable: true })
    aiScore: { logika:number; fungsi:number; sintaks:number; dok:number; gaya:number; konsep:number } | null;

    @Column('text', { nullable: true })
    aiNote?: string;

    @Column({ type: 'varchar', default: 'perlu' })
    status: 'perlu' | 'selesai' | 'ditolak';

    @Column('jsonb', { nullable: true })
    finalScore: { logika:number; fungsi:number; sintaks:number; dok:number; gaya:number; konsep:number } | null;

    @Column({ type: 'int', nullable: true })
    accuracy?: number;

    @Column('text', { nullable: true })
    reviewerId?: string;

    @CreateDateColumn() createdAt: Date;
    @UpdateDateColumn() updatedAt: Date;
}