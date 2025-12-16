# 示例数据库 Schema（请根据项目替换）

schema "public" {}

table "users" {
  schema = schema.public

  column "id" {
    type    = uuid
    default = sql("gen_random_uuid()")
  }

  column "email" {
    type = varchar(255)
    null = false
  }

  column "created_at" {
    type    = timestamptz
    default = sql("now()")
  }

  primary_key {
    columns = [column.id]
  }

  index "users_email_idx" {
    unique  = true
    columns = [column.email]
  }
}
