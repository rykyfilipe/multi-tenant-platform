/** @format */

import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import nodemailer from "nodemailer";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
	try {
		const { email } = await request.json();

		// Validate email
		if (!email) {
			return NextResponse.json({ error: "Email is required" }, { status: 400 });
		}

		// Check if user exists
		const user = await prisma.user.findUnique({
			where: { email },
		});

		if (!user) {
			// Don't reveal if user exists or not for security
			return NextResponse.json(
				{
					message:
						"If an account with that email exists, a password reset link has been sent.",
				},
				{ status: 200 },
			);
		}

		// Generate reset token
		const resetToken = randomBytes(32).toString("hex");
		const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

		// Create new verification token (don't update existing ones to avoid replica identity issues)
		await prisma.verificationToken.create({
			data: {
				identifier: email,
				token: resetToken,
				expires,
			},
		});

		// Create transporter for no-reply email
		const noReplyTransporter = nodemailer.createTransport({
			host: process.env.SMTP_HOST || "mail.privateemail.com",
			port: parseInt(process.env.SMTP_PORT || "465"),
			secure: true,
			auth: {
				user: process.env.SMTP_USER_NO_REPLY || process.env.SMTP_USER,
				pass: process.env.SMTP_PASS_NO_REPLY || process.env.SMTP_PASS,
			},
			connectionTimeout: 60000,
			greetingTimeout: 30000,
			socketTimeout: 60000,
			tls: {
				rejectUnauthorized: true,
				minVersion: "TLSv1.2",
			},
		});

		// Create reset URL
		const resetUrl = `${
			process.env.NEXTAUTH_URL
		}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

		// Send email
		const mailOptions = {
			from: `"YDV Support" <${
				process.env.SMTP_MAIL_NO_REPLY || process.env.SMTP_USER
			}>`,
			to: email,
			subject: "Reset Your YDV Password",
			html: `
				<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
					<h2 style="color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px;">
						Password Reset Request
					</h2>
					
					<p style="line-height: 1.6; color: #555;">
						Hello ${user.firstName},
					</p>
					
					<p style="line-height: 1.6; color: #555;">
						We received a request to reset your password for your YDV account. If you didn't make this request, you can safely ignore this email.
					</p>
					
					<div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
						<a href="${resetUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
							Reset Password
						</a>
					</div>
					
					<p style="line-height: 1.6; color: #555;">
						Or copy and paste this link into your browser:
					</p>
					<p style="background-color: #f8f9fa; padding: 10px; border-radius: 4px; word-break: break-all; font-size: 14px;">
						${resetUrl}
					</p>
					
					<p style="line-height: 1.6; color: #555;">
						This link will expire in 1 hour for security reasons.
					</p>
					
					<p style="line-height: 1.6; color: #555;">
						If you have any questions, please contact our support team at ${
							process.env.SMTP_MAIL_SUPPORT || "support@yourdomain.com"
						}.
					</p>
					
					<div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; color: #6c757d; font-size: 14px;">
						<p>YDV - Your Data Your View</p>
						<p>Multi-Tenant Database Platform</p>
					</div>
				</div>
			`,
		};

		await noReplyTransporter.sendMail(mailOptions);

		return NextResponse.json(
			{
				message:
					"If an account with that email exists, a password reset link has been sent.",
			},
			{ status: 200 },
		);
	} catch (error) {
		console.error("Forgot password error:", error);
		return NextResponse.json(
			{
				error:
					"Failed to process password reset request. Please try again later.",
			},
			{ status: 500 },
		);
	}
}
