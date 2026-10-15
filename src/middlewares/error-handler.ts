import { Request, Response, NextFunction } from "express";
import { QueryFailedError } from "typeorm";
import { ZodError } from "zod";
import { AppError } from "../errors/app-error";
export function notFound(req: Request, _res: Response, next: NextFunction) {
  next(
    new AppError(
      404,
      `Route ${req.method} ${req.path} not found`,
      "ROUTE_NOT_FOUND",
    ),
  );
}
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  let status = 500,
    message = "Internal server error",
    code = "INTERNAL_ERROR",
    errors: unknown[] = [];
  if (err instanceof AppError) {
    status = err.statusCode;
    message = err.message;
    code = err.code;
    if (err.details)
      errors = Array.isArray(err.details) ? err.details : [err.details];
  } else if (err instanceof ZodError) {
    status = 400;
    message = "Request validation failed";
    code = "VALIDATION_ERROR";
    errors = err.issues.map((i) => ({
      path: i.path.join("."),
      message: i.message,
    }));
  } else if (err instanceof QueryFailedError) {
    const driver = (err as any).driverError;
    if (driver?.code === "23505") {
      status = 409;
      message = "A record with this value already exists";
      code = "DUPLICATE_RESOURCE";
    } else if (driver?.code === "23503") {
      status = 400;
      message = "Related record does not exist or is still referenced";
      code = "INVALID_REFERENCE";
    } else if (driver?.code === "23514") {
      status = 400;
      message = "A database constraint was not satisfied";
      code = "CONSTRAINT_VIOLATION";
    }
  }
  if (status >= 500)
    console.error(
      JSON.stringify({
        requestId: res.locals.requestId,
        code,
        errorName: err instanceof Error ? err.name : "UnknownError",
      }),
    );
  res
    .status(status)
    .json({
      success: false,
      message,
      code,
      errors,
      requestId: res.locals.requestId,
    });
}
