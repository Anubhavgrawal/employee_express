
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

import { Role } from "./role.entity";
import { Employee } from "./employee.entity";

@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({
    type: "varchar",
    unique: true,
    length: 254,
  })
  email!: string;

  @Column({
    name: "password_hash",
    select: false,
    type: "text",
  })
  passwordHash!: string;

  @ManyToOne(() => Role, (role) => role.users, {
    nullable: false,
    onDelete: "RESTRICT",
  })
  @JoinColumn({ name: "role_id" })
  role!: Role;

  @OneToOne(() => Employee, {
    nullable: true,
    onDelete: "SET NULL",
  })
  @JoinColumn({ name: "employee_id" })
  employee!: Employee | null;

  @Column({
    name: "is_active",
    type: "boolean",
    default: true,
  })
  isActive!: boolean;

  @Column({
    name: "token_version",
    type: "integer",
    default: 0,
  })
  tokenVersion!: number;

  @CreateDateColumn({
    name: "created_at",
    type: "timestamptz",
  })
  createdAt!: Date;

  @UpdateDateColumn({
    name: "updated_at",
    type: "timestamptz",
  })
  updatedAt!: Date;
}
