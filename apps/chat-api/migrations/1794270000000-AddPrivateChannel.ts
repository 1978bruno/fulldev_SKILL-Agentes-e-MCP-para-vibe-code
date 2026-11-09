import { MigrationInterface, QueryRunner } from "typeorm";

// Escrita à mão: o TypeORM não percebe a mudança na expressão de um CHECK (plano da F04-T02,
// "Contrato").
export class AddPrivateChannel1794270000000 implements MigrationInterface {
    name = 'AddPrivateChannel1794270000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Um ALTER só: uma trava e uma conferência da tabela.
        await queryRunner.query(`ALTER TABLE "conversations" DROP CONSTRAINT "conversations_kind_check", ADD CONSTRAINT "conversations_kind_check" CHECK ("kind" IN ('public_channel', 'private_channel')), DROP CONSTRAINT "conversations_channel_name_check", ADD CONSTRAINT "conversations_channel_name_check" CHECK ("kind" NOT IN ('public_channel', 'private_channel') OR "name" IS NOT NULL)`);
    }

    // Só reverte sem Canais privados no banco: o CHECK antigo não os aceita, e apagar Conversas
    // numa reversão perderia dados sem aviso.
    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "conversations" DROP CONSTRAINT "conversations_channel_name_check", ADD CONSTRAINT "conversations_channel_name_check" CHECK ("kind" <> 'public_channel' OR "name" IS NOT NULL), DROP CONSTRAINT "conversations_kind_check", ADD CONSTRAINT "conversations_kind_check" CHECK ("kind" IN ('public_channel'))`);
    }

}
