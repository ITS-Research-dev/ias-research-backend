import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('materials')
export class Material {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    judul: string;

    @Column('text', { nullable: true })
    cp?: string;

    @Column('text', { nullable: true })
    kontenMarkdown?: string;

    @Column({ default: 'aktif' })
    status: 'aktif' | 'nonaktif';

    @CreateDateColumn() createdAt: Date;
    @UpdateDateColumn() updatedAt: Date;
}