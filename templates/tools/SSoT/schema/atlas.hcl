# Atlas 环境配置模板

variable "db_url" {
  type    = string
  default = getenv("DATABASE_URL")
}

# 开发环境：使用本地 dev 容器
env "local" {
  src = "file://postgres.hcl"
  url = var.db_url
  dev = "docker://postgres/16/dev"
}

# 生产环境：连接线上数据库
env "prod" {
  src = "file://postgres.hcl"
  url = var.db_url
}
