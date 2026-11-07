#!/usr/bin/env bash
# Cria os três bancos da mesma instância (HLD, seção 7) com os papéis de produção:
# um dono por banco e um usuário só leitura com acesso apenas ao Banco de negócio (ADR 0013).
# Senhas fixas, só para desenvolvimento local.
set -euo pipefail

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname postgres <<-'SQL'
	CREATE ROLE chat LOGIN PASSWORD 'chat';
	CREATE ROLE agents LOGIN PASSWORD 'agents';
	CREATE ROLE business LOGIN PASSWORD 'business';
	CREATE ROLE business_readonly LOGIN PASSWORD 'business_readonly';

	CREATE DATABASE chat OWNER chat;
	CREATE DATABASE agents OWNER agents;
	CREATE DATABASE business OWNER business;

	-- Ninguém conecta num banco sem permissão explícita: o só leitura não alcança chat nem agents.
	REVOKE CONNECT ON DATABASE chat, agents, business, postgres FROM PUBLIC;
	GRANT CONNECT ON DATABASE chat TO chat;
	GRANT CONNECT ON DATABASE agents TO agents;
	GRANT CONNECT ON DATABASE business TO business, business_readonly;
SQL

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname business <<-'SQL'
	GRANT USAGE ON SCHEMA public TO business_readonly;
	GRANT SELECT ON ALL TABLES IN SCHEMA public TO business_readonly;
	-- Tabelas que o script de carga criar depois (como o papel business) já nascem legíveis.
	ALTER DEFAULT PRIVILEGES FOR ROLE business IN SCHEMA public
		GRANT SELECT ON TABLES TO business_readonly;
SQL
