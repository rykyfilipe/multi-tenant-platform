/** @format */

import nodemailer from "nodemailer";
import crypto from "crypto";

// Email configuration
const smtpConfig = {
	host: process.env.SMTP_HOST || "mail.privateemail.com",
	port: parseInt(process.env.SMTP_PORT || "465"),
	secure: true,
	auth: {
		user: process.env.SMTP_USER_NO_REPLY || process.env.SMTP_USER,
		pass: process.env.SMTP_PASS_NO_REPLY || process.env.SMTP_PASS,
	},
};

const transporter = nodemailer.createTransporter(smtpConfig);

export interface InvitationData {
	email: string;
	firstName: string;
	lastName: string;
	role: string;
	tenantName: string;
	adminName: string;
	invitationUrl: string;
}

export async function sendInvitationEmail(
	invitationData: InvitationData,
): Promise<boolean> {
	try {
		const {
			email,
			firstName,
			lastName,
			role,
			tenantName,
			adminName,
			invitationUrl,
		} = invitationData;

		const mailOptions = {
			from: `"YDV Platform" <${
				process.env.SMTP_MAIL_NO_REPLY || process.env.SMTP_USER
			}>`,
			to: email,
			subject: `You've been invited to join ${tenantName} on YDV Platform`,
			html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
            <h1 style="color: white; margin: 0; font-size: 28px;">YDV Platform</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Your Data Your View</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; margin-bottom: 20px;">
            <h2 style="color: #333; margin-top: 0;">You've been invited!</h2>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
              Hello ${firstName} ${lastName},
            </p>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
              <strong>${adminName}</strong> has invited you to join <strong>${tenantName}</strong> on the YDV Platform.
            </p>
            
            <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #1976d2; margin-top: 0;">Invitation Details:</h3>
              <ul style="color: #666; margin: 0; padding-left: 20px;">
                <li><strong>Role:</strong> ${role}</li>
                <li><strong>Organization:</strong> ${tenantName}</li>
                <li><strong>Invited by:</strong> ${adminName}</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${invitationUrl}" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        color: white; 
                        padding: 15px 30px; 
                        text-decoration: none; 
                        border-radius: 8px; 
                        font-weight: bold; 
                        display: inline-block;
                        box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
                Accept Invitation
              </a>
            </div>
            
            <p style="color: #666; line-height: 1.6; font-size: 14px;">
              This invitation will expire in 7 days. If you have any questions, please contact your administrator.
            </p>
          </div>
          
          <div style="text-align: center; color: #999; font-size: 12px; margin-top: 30px;">
            <p>This is an automated message from YDV Platform. Please do not reply to this email.</p>
            <p>If you didn't expect this invitation, you can safely ignore this email.</p>
          </div>
        </div>
      `,
		};

		await transporter.sendMail(mailOptions);
		return true;
	} catch (error) {
		console.error("Error sending invitation email:", error);
		return false;
	}
}

export function generateInvitationToken(): string {
	return crypto.randomBytes(32).toString("hex");
}

export function generateInvitationUrl(token: string): string {
	const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
	return `${baseUrl}/invite?token=${token}`;
}
