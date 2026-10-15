import "reflect-metadata";
import { DataSource } from "typeorm";
import { env } from "./env";
import { Department } from "../entities/department.entity";
import { Employee } from "../entities/employee.entity";
import { Role } from "../entities/role.entity";
import { User } from "../entities/user.entity";
import { RefreshToken } from "../entities/refresh-token.entity";
import { AuditLog } from "../entities/audit-log.entity";

export const AppDataSource = new DataSource({
  type: "postgres",
  url: env.DATABASE_URL,
  entities: [Department, Employee, Role, User, RefreshToken, AuditLog],
  migrations: ["src/migrations/*.ts"],
  synchronize: env.NODE_ENV === "development",
  logging: env.NODE_ENV === "development" ? ["error", "warn"] : false,
  extra: { max: 10, idleTimeoutMillis: 30000, connectionTimeoutMillis: 5000 },
});


export const datasource = AppDataSource.initialize().then(
  
)
