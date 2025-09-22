import { PrismaClient, Role } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()
const hash = (pwd: string) => bcrypt.hashSync(pwd, 10)

async function main() {
  await prisma.user.upsert({
    where: { email: "director@company.com" },
    update: {},
    create: {
      name: "Dana Director",
      email: "director@company.com",
      role: Role.DIRECTOR,          // ✅
      passwordHash: hash("director123"),
    },
  })

  await prisma.user.upsert({
    where: { email: "manager@company.com" },
    update: {},
    create: {
      name: "Morgan Manager",
      email: "manager@company.com",
      role: Role.MANAGER,           // ✅ was GRC_MANAGER
      passwordHash: hash("manager123"),
    },
  })

  await prisma.user.upsert({
    where: { email: "consultant@company.com" },
    update: {},
    create: {
      name: "Casey Consultant",
      email: "consultant@company.com",
      role: Role.CONSULTANT,        // ✅ was GRC_CONSULTANT
      passwordHash: hash("consultant123"),
    },
  })
}

main()
  .then(async () => {
    console.log("Seeded users ✅")
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
