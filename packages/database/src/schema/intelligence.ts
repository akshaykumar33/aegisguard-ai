import { pgTable, uuid, varchar, timestamp, text, integer, index, jsonb } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { organizations } from './tenancy.js';
import { repositories } from './repositories.js';
import { vector } from './customTypes.js';

export const codeSymbols = pgTable(
  'code_symbols',
  {
    id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
    organizationId: uuid('organization_id')
      .references(() => organizations.id, { onDelete: 'cascade' })
      .notNull(),
    repositoryId: uuid('repository_id')
      .references(() => repositories.id, { onDelete: 'cascade' })
      .notNull(),
    commitSha: varchar('commit_sha', { length: 64 }).notNull(),
    filePath: text('file_path').notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    kind: varchar('kind', { length: 50 }).notNull(), // FUNCTION, CLASS, METHOD, INTERFACE, etc.
    startLine: integer('start_line').notNull(),
    endLine: integer('end_line').notNull(),
    startColumn: integer('start_column'),
    endColumn: integer('end_column'),
    signature: text('signature'),
    docstring: text('docstring'),
    contentHash: varchar('content_hash', { length: 64 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('symbol_org_repo_idx').on(table.organizationId, table.repositoryId),
    index('symbol_name_idx').on(table.name),
    index('symbol_file_idx').on(table.filePath),
    index('symbol_commit_idx').on(table.commitSha)
  ]
);

export const codeRelationships = pgTable(
  'code_relationships',
  {
    id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
    organizationId: uuid('organization_id')
      .references(() => organizations.id, { onDelete: 'cascade' })
      .notNull(),
    repositoryId: uuid('repository_id')
      .references(() => repositories.id, { onDelete: 'cascade' })
      .notNull(),
    sourceSymbolId: uuid('source_symbol_id')
      .references(() => codeSymbols.id, { onDelete: 'cascade' })
      .notNull(),
    targetSymbolId: uuid('target_symbol_id')
      .references(() => codeSymbols.id, { onDelete: 'cascade' })
      .notNull(),
    relationType: varchar('relation_type', { length: 50 }).notNull(), // IMPORTS, CALLS, EXTENDS, IMPLEMENTS, USES, READS, WRITES, etc.
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('rel_org_repo_idx').on(table.organizationId, table.repositoryId),
    index('rel_source_idx').on(table.sourceSymbolId),
    index('rel_target_idx').on(table.targetSymbolId),
    index('rel_type_idx').on(table.relationType)
  ]
);

export const codeChunks = pgTable(
  'code_chunks',
  {
    id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
    organizationId: uuid('organization_id')
      .references(() => organizations.id, { onDelete: 'cascade' })
      .notNull(),
    repositoryId: uuid('repository_id')
      .references(() => repositories.id, { onDelete: 'cascade' })
      .notNull(),
    commitSha: varchar('commit_sha', { length: 64 }).notNull(),
    filePath: text('file_path').notNull(),
    symbolId: uuid('symbol_id').references(() => codeSymbols.id, { onDelete: 'set null' }),
    startLine: integer('start_line').notNull(),
    endLine: integer('end_line').notNull(),
    content: text('content').notNull(),
    language: varchar('language', { length: 50 }).notNull(),
    tokenCount: integer('token_count').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('chunks_org_repo_idx').on(table.organizationId, table.repositoryId),
    index('chunks_file_idx').on(table.filePath),
    index('chunks_commit_idx').on(table.commitSha)
  ]
);

export const codeEmbeddings = pgTable(
  'code_embeddings',
  {
    id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
    chunkId: uuid('chunk_id')
      .references(() => codeChunks.id, { onDelete: 'cascade' })
      .notNull(),
    model: varchar('model', { length: 100 }).notNull().default('text-embedding-3-small'),
    embedding: vector('embedding', { dimensions: 1536 }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('embeddings_chunk_idx').on(table.chunkId)
  ]
);

export const dependencies = pgTable(
  'dependencies',
  {
    id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
    organizationId: uuid('organization_id')
      .references(() => organizations.id, { onDelete: 'cascade' })
      .notNull(),
    repositoryId: uuid('repository_id')
      .references(() => repositories.id, { onDelete: 'cascade' })
      .notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    version: varchar('version', { length: 100 }).notNull(),
    packageManager: varchar('package_manager', { length: 50 }).notNull(), // npm, pnpm, pip, maven, go, cargo
    isDev: varchar('is_dev', { length: 10 }).default('false'),
    manifestFilePath: text('manifest_file_path').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('dep_org_repo_idx').on(table.organizationId, table.repositoryId),
    index('dep_name_idx').on(table.name)
  ]
);

export const apiEndpoints = pgTable(
  'api_endpoints',
  {
    id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
    organizationId: uuid('organization_id')
      .references(() => organizations.id, { onDelete: 'cascade' })
      .notNull(),
    repositoryId: uuid('repository_id')
      .references(() => repositories.id, { onDelete: 'cascade' })
      .notNull(),
    httpMethod: varchar('http_method', { length: 10 }).notNull(), // GET, POST, PUT, DELETE, etc.
    routePath: text('route_path').notNull(),
    handlerSymbolId: uuid('handler_symbol_id').references(() => codeSymbols.id, { onDelete: 'set null' }),
    authRequired: varchar('auth_required', { length: 10 }).default('true'),
    filePath: text('file_path').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('api_org_repo_idx').on(table.organizationId, table.repositoryId),
    index('api_route_idx').on(table.httpMethod, table.routePath)
  ]
);
