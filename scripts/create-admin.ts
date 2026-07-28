import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const [login, password, roleArg] = process.argv.slice(2);
  if (!login || !password) {
    console.log("Использование: npm run admin:create -- логин пароль [admin|operator|editor]");
    console.log("  admin    — всё, включая доступы арендаторов и удаление");
    console.log("  operator — магазины, новости, отзывы");
    console.log("  editor   — только новости");
    process.exit(1);
  }
  const role = roleArg === "editor" || roleArg === "operator" ? roleArg : "admin";
  const data = {
    login: login.toLowerCase(),
    passwordHash: bcrypt.hashSync(password, 10),
    role,
  };
  const existing = await prisma.account.findUnique({ where: { login: data.login } });
  if (existing) {
    await prisma.account.update({ where: { id: existing.id }, data });
    console.log(`Аккаунт «${data.login}» обновлён (роль ${role}, пароль сменён).`);
  } else {
    await prisma.account.create({ data });
    console.log(`Аккаунт «${data.login}» создан (роль ${role}).`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
