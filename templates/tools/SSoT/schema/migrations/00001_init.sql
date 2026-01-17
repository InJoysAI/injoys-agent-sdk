-- +goose Up
-- 示例：创建用户表
-- 请根据项目需求修改
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX users_email_idx ON users (email);
-- +goose Down
DROP TABLE IF EXISTS users;