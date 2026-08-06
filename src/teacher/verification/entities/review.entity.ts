import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('reviews')
export class Review {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    submissionId: string;

    @Column()
    reviewerId: string;

    @Column('jsonb')
    finalScore: { logika:number; fungsi:number; sintaks:number; dok:number; gaya:number; konsep:number };

    @Column('text', { nullable: true })
    note?: string;

    @CreateDateColumn() createdAt: Date;
}