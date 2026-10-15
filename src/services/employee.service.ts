import { AppDataSource } from "../config/data-source";
import { Employee } from "../entities/employee.entity";
import { Department } from "../entities/department.entity";
import { AppError } from "../errors/app-error";
import { AuditService } from "./audit.service";
export class EmployeeService {
  private repo = AppDataSource.getRepository(Employee);
  private departments = AppDataSource.getRepository(Department);
  async list(query: any, auth: Express.Request["auth"]) {
    const qb = this.repo
      .createQueryBuilder("e")
      .leftJoinAndSelect("e.department", "department")
      .leftJoinAndSelect("e.manager", "manager");
    if (auth?.role === "manager")
      qb.andWhere("manager.id = :managerId", { managerId: auth.employeeId });
    if (auth?.role === "employee")
      qb.andWhere("e.id = :employeeId", { employeeId: auth.employeeId });
    if (query.departmentId)
      qb.andWhere("department.id = :departmentId", {
        departmentId: query.departmentId,
      });
    if (query.status)
      qb.andWhere("e.employmentStatus = :status", { status: query.status });
    if (query.search)
      qb.andWhere(
        "(LOWER(e.firstName) LIKE :s OR LOWER(e.lastName) LIKE :s OR LOWER(e.workEmail) LIKE :s)",
        { s: `%${query.search.toLowerCase()}%` },
      );
    const sortMap: Record<string, string> = {
      firstName: "e.firstName",
      lastName: "e.lastName",
      workEmail: "e.workEmail",
      joiningDate: "e.joiningDate",
      createdAt: "e.createdAt",
    };
    qb.orderBy(
      sortMap[query.sortBy] ?? "e.createdAt",
      query.sortOrder === "ASC" ? "ASC" : "DESC",
    )
      .skip((query.page - 1) * query.limit)
      .take(query.limit);
    const [items, total] = await qb.getManyAndCount();
    return {
      items: items.map((e) => this.safe(e)),
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }
  async get(id: string, auth: NonNullable<Express.Request["auth"]>) {
    const e = await this.repo.findOne({
      where: { id },
      relations: { department: true, manager: true },
    });
    if (!e) throw new AppError(404, "Employee not found", "EMPLOYEE_NOT_FOUND");
    if (auth.role === "employee" && auth.employeeId !== id)
      throw new AppError(
        403,
        "You can only view your own profile",
        "FORBIDDEN",
      );
    if (
      auth.role === "manager" &&
      e.manager?.id !== auth.employeeId &&
      e.id !== auth.employeeId
    )
      throw new AppError(
        403,
        "Employee is outside your reporting scope",
        "FORBIDDEN",
      );
    return this.safe(e);
  }
  async create(input: any, actor: string, requestId?: string) {
    const department = await this.departments.findOneBy({
      id: input.departmentId,
    });
    if (!department)
      throw new AppError(400, "Department not found", "DEPARTMENT_NOT_FOUND");
    let manager: Employee | null = null;
    if (input.managerId) {
      manager = await this.repo.findOneBy({ id: input.managerId });
      if (!manager)
        throw new AppError(
          400,
          "Manager employee not found",
          "MANAGER_NOT_FOUND",
        );
    }
    const e = await this.repo.save(
      this.repo.create({
        firstName: input.firstName,
        lastName: input.lastName,
        workEmail: input.workEmail,
        phone: input.phone ?? null,
        department,
        manager,
        jobTitle: input.jobTitle,
        joiningDate: input.joiningDate,
        employmentStatus: input.employmentStatus,
      }),
    );
    await AuditService.record(
      actor,
      "employee.create",
      "employee",
      e.id,
      requestId,
    );
    return this.safe(e);
  }
  async update(id: string, input: any, actor: string, requestId?: string) {
    const e = await this.repo.findOne({
      where: { id },
      relations: { department: true, manager: true },
    });
    if (!e) throw new AppError(404, "Employee not found", "EMPLOYEE_NOT_FOUND");
    if (input.departmentId) {
      const d = await this.departments.findOneBy({ id: input.departmentId });
      if (!d)
        throw new AppError(400, "Department not found", "DEPARTMENT_NOT_FOUND");
      e.department = d;
    }
    if (input.managerId !== undefined) {
      e.manager = input.managerId
        ? await this.repo.findOneBy({ id: input.managerId })
        : null;
      if (input.managerId && !e.manager)
        throw new AppError(
          400,
          "Manager employee not found",
          "MANAGER_NOT_FOUND",
        );
      if (e.manager?.id === e.id)
        throw new AppError(
          400,
          "An employee cannot manage themselves",
          "INVALID_MANAGER",
        );
    }
    for (const key of [
      "firstName",
      "lastName",
      "workEmail",
      "phone",
      "jobTitle",
      "joiningDate",
      "employmentStatus",
    ] as const)
      if (input[key] !== undefined) (e as any)[key] = input[key];
    await this.repo.save(e);
    await AuditService.record(
      actor,
      "employee.update",
      "employee",
      e.id,
      requestId,
    );
    return this.safe(e);
  }
  async updateOwn(employeeId: string, input: any) {
    const e = await this.repo.findOne({
      where: { id: employeeId },
      relations: { department: true },
    });
    if (!e)
      throw new AppError(
        404,
        "Employee profile not found",
        "EMPLOYEE_NOT_FOUND",
      );
    Object.assign(e, input);
    await this.repo.save(e);
    return this.safe(e);
  }
  async deactivate(id: string, actor: string, requestId?: string) {
    const e = await this.repo.findOneBy({ id });
    if (!e) throw new AppError(404, "Employee not found", "EMPLOYEE_NOT_FOUND");
    e.employmentStatus = "inactive";
    await this.repo.save(e);
    const user = (await AppDataSource.getRepository("users").findOne({
      where: { employee: { id } },
    })) as any;
    if (user) {
      user.isActive = false;
      user.tokenVersion += 1;
      await AppDataSource.getRepository("users").save(user);
      await AppDataSource.getRepository("refresh_tokens")
        .createQueryBuilder()
        .update()
        .set({ revokedAt: new Date() })
        .where("user_id = :id AND revoked_at IS NULL", { id: user.id })
        .execute();
    }
    await AuditService.record(
      actor,
      "employee.deactivate",
      "employee",
      id,
      requestId,
    );
    return { id, employmentStatus: e.employmentStatus };
  }
  safe(e: Employee) {
    return {
      id: e.id,
      firstName: e.firstName,
      lastName: e.lastName,
      workEmail: e.workEmail,
      phone: e.phone,
      department: e.department
        ? { id: e.department.id, name: e.department.name }
        : undefined,
      manager: e.manager
        ? {
            id: e.manager.id,
            firstName: e.manager.firstName,
            lastName: e.manager.lastName,
          }
        : null,
      jobTitle: e.jobTitle,
      joiningDate: e.joiningDate,
      employmentStatus: e.employmentStatus,
      createdAt: e.createdAt,
      updatedAt: e.updatedAt,
    };
  }
}
