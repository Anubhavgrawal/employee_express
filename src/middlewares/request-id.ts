import { randomUUID } from 'node:crypto';
import { Request, Response, NextFunction } from 'express';
export function requestId(req: Request, res: Response, next: NextFunction): void {
  const supplied = req.header('x-request-id');
  const id = supplied && /^[a-zA-Z0-9._-]{1,100}$/.test(supplied) ? supplied : randomUUID();
  res.locals.requestId = id; res.setHeader('X-Request-Id', id); next();
}
