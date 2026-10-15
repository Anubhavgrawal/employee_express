import "reflect-metadata";
import argon2 from "argon2";
import { AppDataSource } from "../config/data-source";
import { Role } from "../entities/role.entity";
import { User } from "../entities/user.entity";
import { env } from "../config/env";
async function seed() {
  await AppDataSource.initialize();
  try {
    const repo = AppDataSource.getRepository(Role);
    for (const [name, description] of [
      ["admin", "Full system administration"],
      ["hr", "Employee and department management"],
      ["manager", "Scoped team access"],
      ["employee", "Own profile access"],
    ] as const) {
      if (!(await repo.findOneBy({ name })))
        await repo.save(repo.create({ name, description }));
    }
    if (env.SEED_ADMIN_EMAIL && env.SEED_ADMIN_PASSWORD) {
      const users = AppDataSource.getRepository(User);
      if (
        !(await users.findOneBy({ email: env.SEED_ADMIN_EMAIL.toLowerCase() }))
      ) {
        const role = await repo.findOneByOrFail({ name: "admin" });
        await users.save(
          users.create({
            email: env.SEED_ADMIN_EMAIL.toLowerCase(),
            passwordHash: await argon2.hash(env.SEED_ADMIN_PASSWORD, {
              type: argon2.argon2id,
            }),
            role,
            isActive: true,
            tokenVersion: 0,
            employee: null,
          }),
        );
        console.log("Development admin created");
      } else console.log("Admin email already exists; no changes made");
    } else
      console.log(
        "Roles seeded. Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD to create a development admin.",
      );
  } finally {
    await AppDataSource.destroy();
  }
}
seed().catch((e) => {
  console.error(
    "Seed failed:",
    e instanceof Error ? e.message : "Unknown error",
  );
  process.exit(1);
});
