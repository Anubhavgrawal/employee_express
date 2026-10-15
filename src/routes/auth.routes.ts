import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { authenticate } from "../middlewares/authenticate";
import { validateBody, validateParams } from "../middlewares/validate-request";
import {
  loginSchema,
  refreshSchema,
  changePasswordSchema,
  uuidParam,
} from "../validators/common.schemas";
import { rateLimit } from "express-rate-limit";
import { env } from "../config/env";
const router = Router(),
  c = new AuthController();
const loginLimit = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  limit: env.LOGIN_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many authentication attempts; try again later",
  },
});
router.post("/login", loginLimit, validateBody(loginSchema), c.login);
router.post("/refresh", loginLimit, validateBody(refreshSchema), c.refresh);
router.post("/logout", validateBody(refreshSchema), c.logout);
router.post("/logout-all", authenticate, c.logoutAll);
router.get("/sessions", authenticate, c.sessions);
router.delete(
  "/sessions/:id",
  authenticate,
  validateParams(uuidParam),
  c.revoke,
);
router.post(
  "/change-password",
  authenticate,
  validateBody(changePasswordSchema),
  c.changePassword,
);
export default router;
