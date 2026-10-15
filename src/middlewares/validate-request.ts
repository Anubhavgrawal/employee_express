import { Request, Response, NextFunction } from 'express';
import { ZodType } from 'zod';
export function validateBody(schema: ZodType) { return (req: Request, _res: Response, next: NextFunction) => { const result = schema.safeParse(req.body); if (!result.success) return next(result.error); req.body = result.data; next(); }; }
export function validateParams(schema: ZodType) { return (req: Request, _res: Response, next: NextFunction) => { const result = schema.safeParse(req.params); if (!result.success) return next(result.error); req.params = result.data as typeof req.params; next(); }; }
export function validateQuery(schema: ZodType) { return (req: Request, _res: Response, next: NextFunction) => { const result = schema.safeParse(req.query); if (!result.success) return next(result.error); resAssign(req, result.data); next(); }; }
function resAssign(req: Request, value: unknown) { Object.defineProperty(req, 'query', { configurable: true, enumerable: true, writable: true, value }); }
