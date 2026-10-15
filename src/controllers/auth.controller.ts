import { Request, Response, NextFunction } from "express";
import { AuthService } from "../services/auth.service";
import { sendSuccess } from "../utils/response";
export class AuthController {
  private service = new AuthService();
  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      sendSuccess(
        res,
        200,
        "Login successful",
        await this.service.login(
          req.body.email,
          req.body.password,
          res.locals.requestId,
        ),
      );
    } catch (e) {
      next(e);
    }
  };
  refresh = async (req: Request, res: Response, next: NextFunction) => {
    try {
      sendSuccess(
        res,
        200,
        "Token refreshed",
        await this.service.rotate(req.body.refreshToken),
      );
    } catch (e) {
      next(e);
    }
  };
  logout = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.service.logout(req.body.refreshToken);
      sendSuccess(res, 200, "Logged out successfully", null);
    } catch (e) {
      next(e);
    }
  };
  logoutAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.service.logoutAll(req.auth!.userId);
      sendSuccess(res, 200, "All sessions revoked", null);
    } catch (e) {
      next(e);
    }
  };
  sessions = async (req: Request, res: Response, next: NextFunction) => {
    try {
      sendSuccess(
        res,
        200,
        "Sessions retrieved",
        await this.service.sessions(req.auth!.userId),
      );
    } catch (e) {
      next(e);
    }
  };
  revoke = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.service.revokeSession(req.auth!.userId, req.params.id);
      sendSuccess(res, 200, "Session revoked", null);
    } catch (e) {
      next(e);
    }
  };
  changePassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.service.changePassword(
        req.auth!.userId,
        req.body.currentPassword,
        req.body.newPassword,
      );
      sendSuccess(res, 200, "Password changed; please log in again", null);
    } catch (e) {
      next(e);
    }
  };
}
