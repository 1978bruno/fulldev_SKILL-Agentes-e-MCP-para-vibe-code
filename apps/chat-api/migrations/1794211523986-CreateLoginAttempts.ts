import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateLoginAttempts1794211523986 implements MigrationInterface {
    name = 'CreateLoginAttempts1794211523986'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "login_attempts" ("id" uuid NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "email" text NOT NULL, "failed_count" integer NOT NULL, "first_failed_at" TIMESTAMP WITH TIME ZONE NOT NULL, "blocked_until" TIMESTAMP WITH TIME ZONE, CONSTRAINT "UQ_0aedff58b23995504f9dc99f75d" UNIQUE ("email"), CONSTRAINT "PK_070e613c8f768b1a70742705c5b" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "login_attempts"`);
    }

}
