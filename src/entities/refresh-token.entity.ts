import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from "typeorm";
import { User } from "./user.entity";
@Entity("refresh_tokens")
@Index(["tokenHash"], { unique: true })
export class RefreshToken {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @ManyToOne(() => User, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user!: User;
  @Column({ name: "token_hash", type: "char", length: 64 }) tokenHash!: string;
  @Column({ name: "family_id", type: "uuid" }) familyId!: string;
  @Column({ name: "expires_at", type: "timestamptz" }) expiresAt!: Date;
  @Column({ name: "revoked_at", type: "timestamptz", nullable: true })
  revokedAt!: Date | null;
  @Column({ name: "replaced_by_id", type: "uuid", nullable: true })
  replacedById!: string | null;
  @CreateDateColumn({ name: "created_at" }) createdAt!: Date;
}
