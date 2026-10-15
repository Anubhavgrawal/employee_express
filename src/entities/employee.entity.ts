
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

import { Department } from "./department.entity";
import { User } from "./user.entity";

@Entity("employees")
export class Employee {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({
    name: "first_name",
    type: "varchar",
    length: 80,
  })
  firstName!: string;

  @Column({
    name: "last_name",
    type: "varchar",
    length: 80,
  })
  lastName!: string;

  @Column({
    name: "work_email",
    type: "varchar",
    unique: true,
    length: 254,
  })
  workEmail!: string;

  @Column({
    type: "varchar",
    length: 30,
    nullable: true,
  })
  phone!: string | null;

  @ManyToOne(
    () => Department,
    (department) => department.employees,
    {
      nullable: false,
      onDelete: "RESTRICT",
    }
  )
  @JoinColumn({ name: "department_id" })
  department!: Department;

  @ManyToOne(
    () => Employee,
    (employee) => employee.reports,
    {
      nullable: true,
      onDelete: "SET NULL",
    }
  )
  @JoinColumn({ name: "manager_id" })
  manager!: Employee | null;

  @OneToMany(
    () => Employee,
    (employee) => employee.manager
  )
  reports!: Employee[];

  @Column({
    name: "job_title",
    type: "varchar",
    length: 100,
  })
  jobTitle!: string;

  @Column({
    name: "joining_date",
    type: "date",
  })
  joiningDate!: string;

  @Column({
    name: "employment_status",
    type: "varchar",
    length: 20,
    default: "active",
  })
  employmentStatus!: "active" | "inactive" | "on_leave";

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
