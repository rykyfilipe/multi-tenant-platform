/** @format */

import { PrismaClient } from "@/generated/prisma/index";

const prisma = new PrismaClient();

if (process.env.NODE_ENV !== "production") (globalThis as any).prisma = prisma;

export default prisma;
