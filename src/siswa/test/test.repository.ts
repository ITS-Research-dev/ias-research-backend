import { Injectable, NotFoundException } from '@nestjs/common';
import { TestEntity } from './entities/test.entity';

@Injectable()
export class TestRepository {
    private tests: TestEntity[] = [];

    async findByTopicId(idTopic: string): Promise<Partial<TestEntity>[]> {
        return this.tests
        .filter((t) => t.idTopic === idTopic)
        .map(({ id, title, question, expOutput }) => ({
            id,
            title,
            question,
            expOutput,
        }));
    }

    async findById(id: string): Promise<TestEntity> {
        const test = this.tests.find((t) => t.id === id);
        if (!test) {
        throw new NotFoundException('Data Not Found');
        }
        return test;
    }
}