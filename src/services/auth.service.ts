import { randomBytes, randomUUID, createHash } from "node:crypto";
import argon2 from "argon2";
import jwt from "jsonwebtoken";
import { AppDataSource } from "../config/data-source";
import { User } from "../entities/user.entity";
import { Role } from "../entities/role.entity";
import { Employee } from "../entities/employee.entity";
import { RefreshToken } from "../entities/refresh-token.entity";
import { env } from "../config/env";
import { AppError } from "../errors/app-error";
import { AuditService } from "./audit.service";
const sha256 = (v: string) => createHash("sha256").update(v).digest("hex");
export class AuthService {
  private users = AppDataSource.getRepository(User);
  private refresh = AppDataSource.getRepository(RefreshToken);
  private access(user: User) {
    return jwt.sign({ ver: user.tokenVersion }, env.JWT_ACCESS_SECRET, {
      subject: user.id,
      expiresIn: env.JWT_ACCESS_TTL as jwt.SignOptions["expiresIn"],
      issuer: env.JWT_ISSUER,
      audience: env.JWT_AUDIENCE,
    });
  }
  private async issueRefresh(user: User, familyId = randomUUID()) {
    const raw = randomBytes(48).toString("base64url");
    const row = await this.refresh.save({
      user,
      tokenHash: sha256(raw),
      familyId,
      expiresAt: new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 86400000),
      revokedAt: null,
      replacedById: null,
    });
    return { raw, row };
  }
  async login(email: string, password: string, requestId?: string) {
    const user = await this.users
      .createQueryBuilder("u")
      .addSelect("u.passwordHash")
      .leftJoinAndSelect("u.role", "role")
      .leftJoinAndSelect("u.employee", "employee")
      .where("u.email = :email", { email })
      .getOne();
    if (
      !user ||
      !user.isActive ||
      !(await argon2.verify(user.passwordHash, password).catch(() => false))
    )
      throw new AppError(
        401,
        "Invalid email or password",
        "INVALID_CREDENTIALS",
      );
    const refresh = await this.issueRefresh(user);
    await AuditService.record(
      user.id,
      "auth.login",
      "user",
      user.id,
      requestId,
    );
    return {
      accessToken: this.access(user),
      refreshToken: refresh.raw,
      tokenType: "Bearer",
      expiresIn: env.JWT_ACCESS_TTL,
      user: {
        id: user.id,
        email: user.email,
        role: user.role.name,
        employeeId: user.employee?.id ?? null,
      },
    };
  }
  async rotate(raw: string) {
    const hash = sha256(raw);
    const old = await this.refresh.findOne({
      where: { tokenHash: hash },
      relations: { user: { role: true, employee: true } },
    });
    if (!old)
      throw new AppError(401, "Invalid refresh token", "INVALID_REFRESH_TOKEN");
    if (old.revokedAt) {
      await this.refresh.update(
        { familyId: old.familyId },
        { revokedAt: new Date() },
      );
      throw new AppError(
        401,
        "Refresh token reuse detected; session revoked",
        "REFRESH_REUSE",
      );
    }
    if (old.expiresAt.getTime() < Date.now() || !old.user.isActive) {
      old.revokedAt = new Date();
      await this.refresh.save(old);
      throw new AppError(
        401,
        "Refresh token expired or revoked",
        "REFRESH_EXPIRED",
      );
    }
    const next = await this.issueRefresh(old.user, old.familyId);
    old.revokedAt = new Date();
    old.replacedById = next.row.id;
    await this.refresh.save(old);
    return {
      accessToken: this.access(old.user),
      refreshToken: next.raw,
      tokenType: "Bearer",
      expiresIn: env.JWT_ACCESS_TTL,
    };
  }
  async logout(raw: string) {
    const row = await this.refresh.findOne({
      where: { tokenHash: sha256(raw) },
    });
    if (row && !row.revokedAt) {
      row.revokedAt = new Date();
      await this.refresh.save(row);
    }
  }
  async logoutAll(userId: string) {
    await this.refresh
      .createQueryBuilder()
      .update()
      .set({ revokedAt: new Date() })
      .where("user_id = :userId AND revoked_at IS NULL", { userId })
      .execute();
  }
  async sessions(userId: string) {
    return this.refresh.find({
      where: { user: { id: userId }, revokedAt: null },
      select: { id: true, familyId: true, expiresAt: true, createdAt: true },
    });
  }
  async revokeSession(userId: string, sessionId: string) {
    const row = await this.refresh.findOne({
      where: { id: sessionId, user: { id: userId } },
    });
    if (!row) throw new AppError(404, "Session not found", "SESSION_NOT_FOUND");
    row.revokedAt = new Date();
    await this.refresh.save(row);
  }
  async changePassword(userId: string, current: string, next: string) {
    const user = await this.users
      .createQueryBuilder("u")
      .addSelect("u.passwordHash")
      .where("u.id = :userId", { userId })
      .getOne();
    if (
      !user ||
      !(await argon2.verify(user.passwordHash, current).catch(() => false))
    )
      throw new AppError(
        400,
        "Current password is incorrect",
        "CURRENT_PASSWORD_INVALID",
      );
    user.passwordHash = await argon2.hash(next, { type: argon2.argon2id });
    user.tokenVersion += 1;
    await this.users.save(user);
    await this.logoutAll(userId);
  }
}
