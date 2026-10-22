-- +goose Up
-- 示例（PostgreSQL 写法，仅演示结构）：创建用户表
-- 生成时必须按数据库设计说明书声明的引擎改写类型与函数（UUID 生成、时间类型、默认值等），
-- 并按项目实际的数据模型替换；不要原样保留本示例表。
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX users_email_idx ON users (email);
-- +goose Down
DROP TABLE IF EXISTS users;
