import { MigrationInterface, QueryRunner } from "typeorm";

// Escrita à mão: a busca de Pessoas compara nomes sem acento (spec da F04, "Busca de Pessoas"). No
// Postgres 18 a extensão é confiável, e o dono do banco a cria.
export class AddUnaccent1794280000000 implements MigrationInterface {
    name = 'AddUnaccent1794280000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS unaccent`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP EXTENSION IF EXISTS unaccent`);
    }

}
