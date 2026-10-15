import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/app-error';
export function requireRole(...roles: string[]) { return (req: Request, _res: Response, next: NextFunction) => { if (!req.auth) return next(new AppError(401, 'Authentication required', 'UNAUTHENTICATED')); if (!roles.includes(req.auth.role)) return next(new AppError(403, 'You do not have permission to perform this action', 'FORBIDDEN')); next(); }; }
