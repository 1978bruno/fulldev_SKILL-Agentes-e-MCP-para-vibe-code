import { MigrationInterface, QueryRunner } from "typeorm";

// Escrita à mão: o TypeORM não percebe a mudança na expressão de um CHECK (plano da F04-T02,
// "Contrato").
export class AddPrivateChannel1794270000000 implements MigrationInterface {
    name = 'AddPrivateChannel1794270000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "conversations" DROP CONSTRAINT "conversations_kind_check"`);
        await queryRunner.query(`ALTER TABLE "conversations" ADD CONSTRAINT "conversations_kind_check" CHECK ("kind" IN ('public_channel', 'private_channel'))`);
        await queryRunner.query(`ALTER TABLE "conversations" DROP CONSTRAINT "conversations_channel_name_check"`);
        await queryRunner.query(`ALTER TABLE "conversations" ADD CONSTRAINT "conversations_channel_name_check" CHECK ("kind" NOT IN ('public_channel', 'private_channel') OR "name" IS NOT NULL)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "conversations" DROP CONSTRAINT "conversations_channel_name_check"`);
        await queryRunner.query(`ALTER TABLE "conversations" ADD CONSTRAINT "conversations_channel_name_check" CHECK ("kind" <> 'public_channel' OR "name" IS NOT NULL)`);
        await queryRunner.query(`ALTER TABLE "conversations" DROP CONSTRAINT "conversations_kind_check"`);
        await queryRunner.query(`ALTER TABLE "conversations" ADD CONSTRAINT "conversations_kind_check" CHECK ("kind" IN ('public_channel'))`);
    }

}
