import { AppDataSource } from "../config/data-source";
import { Department } from "../entities/department.entity";
import { AppError } from "../errors/app-error";
export class DepartmentService {
  private repo = AppDataSource.getRepository(Department);
  async list() {
    return this.repo.find({ order: { name: "ASC" } });
  }
  async create(input: any) {
    return this.repo.save(this.repo.create(input));
  }
  async update(id: string, input: any) {
    const d = await this.repo.findOneBy({ id });
    if (!d)
      throw new AppError(404, "Department not found", "DEPARTMENT_NOT_FOUND");
    Object.assign(d, input);
    return this.repo.save(d);
  }
}
