import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('questions')
export class Question {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    topik: string;

    @Column()
    judul: string;

    @Column('text')
    deskripsi: string;

    @Column('text', { nullable: true })
    expect?: string;

    @Column('text', { nullable: true })
    starter?: string;

    @Column('text', { nullable: true })
    hint1?: string;

    @Column('text', { nullable: true })
    hint2?: string;

    @Column('text', { nullable: true })
    hint3?: string;

    @Column({ default: 'aktif' })
    status: 'aktif' | 'nonaktif';

    @CreateDateColumn() createdAt: Date;
    @UpdateDateColumn() updatedAt: Date;
}