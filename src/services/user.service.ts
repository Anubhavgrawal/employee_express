import argon2 from "argon2";
import { AppDataSource } from "../config/data-source";
import { User } from "../entities/user.entity";
import { Role } from "../entities/role.entity";
import { Employee } from "../entities/employee.entity";
import { AppError } from "../errors/app-error";
import { AuditService } from "./audit.service";
export class UserService {
  private users = AppDataSource.getRepository(User);
  private roles = AppDataSource.getRepository(Role);
  private employees = AppDataSource.getRepository(Employee);
  async create(input: any, actorId: string, requestId?: string) {
    const role = await this.roles.findOneBy({ name: input.role });
    if (!role)
      throw new AppError(400, "Role is not configured", "ROLE_NOT_FOUND");
    let employee: Employee | null = null;
    if (input.employeeId) {
      employee = await this.employees.findOneBy({ id: input.employeeId });
      if (!employee)
        throw new AppError(400, "Employee not found", "EMPLOYEE_NOT_FOUND");
    }
    const user = this.users.create({
      email: input.email,
      passwordHash: await argon2.hash(input.password, {
        type: argon2.argon2id,
      }),
      role,
      employee,
      isActive: true,
      tokenVersion: 0,
    });
    const saved = await this.users.save(user);
    await AuditService.record(
      actorId,
      "user.create",
      "user",
      saved.id,
      requestId,
    );
    return {
      id: saved.id,
      email: saved.email,
      role: role.name,
      employeeId: employee?.id ?? null,
      isActive: saved.isActive,
    };
  }
  async assignRole(
    userId: string,
    roleName: string,
    actorId: string,
    requestId?: string,
  ) {
    const user = await this.users.findOne({
      where: { id: userId },
      relations: { role: true },
    });
    if (!user) throw new AppError(404, "User not found", "USER_NOT_FOUND");
    const role = await this.roles.findOneBy({ name: roleName });
    if (!role)
      throw new AppError(400, "Role is not configured", "ROLE_NOT_FOUND");
    const previousRole = user.role.name;
    user.role = role;
    user.tokenVersion += 1;
    await this.users.save(user);
    await AppDataSource.getRepository("refresh_tokens")
      .createQueryBuilder()
      .update()
      .set({ revokedAt: new Date() })
      .where("user_id = :id AND revoked_at IS NULL", { id: user.id })
      .execute();
    await AuditService.record(
      actorId,
      `user.role_change:${previousRole}->${roleName}`,
      "user",
      user.id,
      requestId,
    );
    return {
      id: user.id,
      email: user.email,
      role: role.name,
      active: user.isActive,
    };
  }
}
