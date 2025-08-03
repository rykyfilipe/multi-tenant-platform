/** @format */

import GoogleProvider from "next-auth/providers/google";
import { Session } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

import type { Adapter } from "next-auth/adapters";
import { JWT } from "next-auth/jwt";
import prisma from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth";
import { generateToken, JWT_SECRET,authOptions } from "@/lib/auth";

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
