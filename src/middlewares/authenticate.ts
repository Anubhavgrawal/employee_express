import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { env } from "../config/env";
import { AppError } from "../errors/app-error";
import { AppDataSource } from "../config/data-source";
import { User } from "../entities/user.entity";

declare global {
  namespace Express {
    interface Request {
      auth?: {
        userId: string;
        email: string;
        role: string;
        employeeId: string | null;
      };
    }
  }
}
export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  try {
    const header = req.header("authorization");
    if (!header?.startsWith("Bearer "))
      throw new AppError(401, "Authentication required", "UNAUTHENTICATED");
    const token = header.slice(7);
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET, {
      issuer: env.JWT_ISSUER,
      audience: env.JWT_AUDIENCE,
    }) as JwtPayload;
    if (typeof decoded.sub !== "string")
      throw new AppError(401, "Invalid access token", "INVALID_TOKEN");
    const user = await AppDataSource.getRepository(User).findOne({
      where: { id: decoded.sub },
      relations: { role: true },
    });
    if (!user || !user.isActive || user.tokenVersion !== decoded.ver)
      throw new AppError(401, "Session is no longer valid", "SESSION_INVALID");
    req.auth = {
      userId: user.id,
      email: user.email,
      role: user.role.name,
      employeeId: user.employee?.id ?? null,
    };
    next();
  } catch (err) {
    next(
      err instanceof Error && err.name === "JsonWebTokenError"
        ? new AppError(401, "Invalid access token", "INVALID_TOKEN")
        : err,
    );
  }
}
