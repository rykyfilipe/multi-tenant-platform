/** @format */

import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import {
	getClientIdentifier,
	checkRateLimit,
	RATE_LIMITS,
} from "@/lib/rate-limiting";

export async function POST(request: NextRequest) {
	try {
		// Rate limiting for contact form
		const identifier = getClientIdentifier(request);
		const rateLimitResult = checkRateLimit(identifier, RATE_LIMITS.contact);

		if (!rateLimitResult.allowed) {
			return NextResponse.json(
				{
					error: "Too many contact form submissions. Please try again later.",
					retryAfter: Math.ceil(
						(rateLimitResult.resetTime - Date.now()) / 1000,
					),
				},
				{
					status: 429,
					headers: {
						"Retry-After": Math.ceil(
							(rateLimitResult.resetTime - Date.now()) / 1000,
						).toString(),
						"X-RateLimit-Limit": RATE_LIMITS.contact.maxRequests.toString(),
						"X-RateLimit-Remaining": "0",
						"X-RateLimit-Reset": new Date(
							rateLimitResult.resetTime,
						).toISOString(),
					},
				},
			);
		}

		const { name, email, subject, message } = await request.json();

		// Validate required fields
		if (!name || !email || !subject || !message) {
			return NextResponse.json(
				{ error: "All fields are required" },
				{ status: 400 },
			);
		}

		// Validate email format
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			return NextResponse.json(
				{ error: "Invalid email format" },
				{ status: 400 },
			);
		}

		// Validate that we have a contact email configured
		const contactEmail =
			process.env.CONTACT_EMAIL ||
			process.env.SMTP_MAIL_CONTACT ||
			process.env.SMTP_USER;
		if (!contactEmail) {
			console.error("No contact email configured");
			return NextResponse.json(
				{ error: "Email service not properly configured" },
				{ status: 500 },
			);
		}

		// Create transporter for contact email
		const contactTransporter = nodemailer.createTransport({
			host: process.env.SMTP_HOST || "mail.privateemail.com",
			port: parseInt(process.env.SMTP_PORT || "465"),
			secure: true, // true for 465 (SSL), false for 587 (TLS)
			auth: {
				user: process.env.SMTP_USER_CONTACT || process.env.SMTP_USER,
				pass: process.env.SMTP_PASS_CONTACT || process.env.SMTP_PASS,
			},
			// Add timeout and connection settings
			connectionTimeout: 60000,
			greetingTimeout: 30000,
			socketTimeout: 60000,
			// TLS options for secure connection
			tls: {
				rejectUnauthorized: true, // More secure, but set to false if you have certificate issues
				minVersion: "TLSv1.2",
			},
		});

		// Create transporter for no-reply email
		const noReplyTransporter = nodemailer.createTransport({
			host: process.env.SMTP_HOST || "mail.privateemail.com",
			port: parseInt(process.env.SMTP_PORT || "465"),
			secure: true, // true for 465 (SSL), false for 587 (TLS)
			auth: {
				user: process.env.SMTP_USER_NO_REPLY || process.env.SMTP_USER,
				pass: process.env.SMTP_PASS_NO_REPLY || process.env.SMTP_PASS,
			},
			// Add timeout and connection settings
			connectionTimeout: 60000,
			greetingTimeout: 30000,
			socketTimeout: 60000,
			// TLS options for secure connection
			tls: {
				rejectUnauthorized: true, // More secure, but set to false if you have certificate issues
				minVersion: "TLSv1.2",
			},
		});

		// Verify connection configurations
		try {
			await contactTransporter.verify();
			await noReplyTransporter.verify();
			console.log("SMTP connections verified successfully");
		} catch (verifyError) {
			console.error("SMTP verification failed:", verifyError);
			return NextResponse.json(
				{ error: "Email service configuration error" },
				{ status: 500 },
			);
		}

		// Email content
		const mailOptions = {
			from: `"YDV Contact" <${
				process.env.SMTP_MAIL_CONTACT || process.env.SMTP_USER
			}>`,
			to: contactEmail,
			subject: `Contact Form: ${subject}`,
			html: `
				<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
					<h2 style="color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px;">
						New Contact Form Submission
					</h2>
					
					<div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
						<h3 style="color: #007bff; margin-top: 0;">Contact Details</h3>
						<p><strong>Name:</strong> ${name}</p>
						<p><strong>Email:</strong> ${email}</p>
						<p><strong>Subject:</strong> ${subject}</p>
					</div>
					
					<div style="background-color: #fff; padding: 20px; border: 1px solid #dee2e6; border-radius: 8px;">
						<h3 style="color: #333; margin-top: 0;">Message</h3>
						<p style="line-height: 1.6; color: #555;">${message.replace(/\n/g, "<br>")}</p>
					</div>
					
					<div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; color: #6c757d; font-size: 14px;">
						<p>This message was sent from the YDV contact form.</p>
						<p>Timestamp: ${new Date().toLocaleString()}</p>
					</div>
				</div>
			`,
		};

		// Send email
		await contactTransporter.sendMail(mailOptions);

		// Send confirmation email to user
		const confirmationMailOptions = {
			from: `"YDV No-Reply" <${
				process.env.SMTP_MAIL_NO_REPLY || process.env.SMTP_USER
			}>`,
			to: email,
			subject: "Thank you for contacting YDV",
			html: `
				<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
					<h2 style="color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px;">
						Thank you for contacting us!
					</h2>
					
					<p style="line-height: 1.6; color: #555;">
						Dear ${name},
					</p>
					
					<p style="line-height: 1.6; color: #555;">
						Thank you for reaching out to YDV. We have received your message and will get back to you as soon as possible.
					</p>
					
					<div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
						<h3 style="color: #007bff; margin-top: 0;">Your Message Details</h3>
						<p><strong>Subject:</strong> ${subject}</p>
						<p><strong>Message:</strong></p>
						<p style="background-color: #fff; padding: 15px; border-radius: 5px; border-left: 4px solid #007bff;">
							${message.replace(/\n/g, "<br>")}
						</p>
					</div>
					
					<p style="line-height: 1.6; color: #555;">
						We typically respond within 24 hours during business days.
					</p>
					
					<p style="line-height: 1.6; color: #555;">
						Best regards,<br>
						The YDV Support Team
					</p>
					
					<div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; color: #6c757d; font-size: 14px;">
						<p>YDV - Your Data Your View</p>
						<p>Multi-Tenant Database Platform</p>
					</div>
				</div>
			`,
		};

		await noReplyTransporter.sendMail(confirmationMailOptions);

		return NextResponse.json(
			{ message: "Message sent successfully" },
			{ status: 200 },
		);
	} catch (error) {
		console.error("Contact form error:", error);
		return NextResponse.json(
			{ error: "Failed to send message. Please try again later." },
			{ status: 500 },
		);
	}
}
