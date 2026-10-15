import { Request, Response, NextFunction } from "express";
import { DepartmentService } from "../services/department.service";
import { sendSuccess } from "../utils/response";
export class DepartmentController {
  private service = new DepartmentService();
  list = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      sendSuccess(res, 200, "Departments retrieved", await this.service.list());
    } catch (e) {
      next(e);
    }
  };
  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      sendSuccess(
        res,
        201,
        "Department created",
        await this.service.create(req.body),
      );
    } catch (e) {
      next(e);
    }
  };
  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      sendSuccess(
        res,
        200,
        "Department updated",
        await this.service.update(req.params.id, req.body),
      );
    } catch (e) {
      next(e);
    }
  };
}
