
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from "typeorm";

@Entity("audit_logs")
@Index(["resourceType", "resourceId"])
export class AuditLog {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({
    name: "actor_user_id",
    type: "uuid",
    nullable: true,
  })
  actorUserId!: string | null;

  @Column({
    type: "varchar",
    length: 100,
  })
  action!: string;

  @Column({
    name: "resource_type",
    type: "varchar",
    length: 80,
  })
  resourceType!: string;

  @Column({
    name: "resource_id",
    type: "uuid",
    nullable: true,
  })
  resourceId!: string | null;

  @Column({
    name: "request_id",
    type: "varchar",
    length: 100,
    nullable: true,
  })
  requestId!: string | null;

  @CreateDateColumn({
    name: "created_at",
    type: "timestamptz",
  })
  createdAt!: Date;
}
