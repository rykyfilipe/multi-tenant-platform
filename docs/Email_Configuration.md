<!-- @format -->

# Email Configuration

This document explains the email configuration for the YDV platform.

## Environment Variables

The following environment variables are used for email configuration:

### Basic SMTP Configuration

- `SMTP_HOST`: SMTP server host (default: "mail.privateemail.com")
- `SMTP_PORT`: SMTP server port (default: "465")
- `SMTP_USER`: Main email address for authentication (fallback)
- `SMTP_PASS`: Main email password (fallback)

### Separate Email Credentials

- `SMTP_USER_CONTACT`: Contact email address and credentials
- `SMTP_PASS_CONTACT`: Contact email password
- `SMTP_USER_NO_REPLY`: No-reply email address and credentials
- `SMTP_PASS_NO_REPLY`: No-reply email password
- `SMTP_USER_SUPPORT`: Support email address and credentials
- `SMTP_PASS_SUPPORT`: Support email password

### Email Addresses for Different Purposes

- `SMTP_MAIL_CONTACT`: Email address for contact form submissions
- `SMTP_MAIL_NO_REPLY`: Email address for no-reply messages (confirmations,
  notifications)
- `SMTP_MAIL_SUPPORT`: Email address for support-related messages
- `CONTACT_EMAIL`: Email address where contact form submissions are sent

## Usage

### Contact Form

- **From**: `SMTP_MAIL_CONTACT` (displays as "YDV Contact")
- **To**: `CONTACT_EMAIL` (where contact form submissions are received)
- **Confirmation**: `SMTP_MAIL_NO_REPLY` (displays as "YDV No-Reply")

### Password Reset

- **From**: `SMTP_MAIL_NO_REPLY` (displays as "YDV Support")
- **To**: User's email address
- **Support Contact**: `SMTP_MAIL_SUPPORT` (mentioned in email content)

## Namecheap Private Email Configuration

You can now configure separate email accounts for different purposes. Each email
type can have its own credentials.

### Example Configuration

```env
SMTP_HOST="mail.privateemail.com"
SMTP_PORT="465"

# Main fallback credentials
SMTP_USER="main@ydv.digital"
SMTP_PASS="main-password"

# Contact email credentials
SMTP_USER_CONTACT="contact@ydv.digital"
SMTP_PASS_CONTACT="contact-password"

# No-reply email credentials
SMTP_USER_NO_REPLY="no-reply@ydv.digital"
SMTP_PASS_NO_REPLY="no-reply-password"

# Support email credentials
SMTP_USER_SUPPORT="support@ydv.digital"
SMTP_PASS_SUPPORT="support-password"

# Email addresses
SMTP_MAIL_CONTACT="contact@ydv.digital"
SMTP_MAIL_NO_REPLY="no-reply@ydv.digital"
SMTP_MAIL_SUPPORT="support@ydv.digital"
CONTACT_EMAIL="contact@ydv.digital"
```

## Benefits

1. **Professional Appearance**: Each email type has its own address
2. **Better Organization**: Separate credentials for different purposes
3. **Security**: Isolated access for different email functions
4. **Flexibility**: Can use different providers for different email types

## Fallback System

If specific credentials are not provided, the system will fall back to the main
`SMTP_USER` and `SMTP_PASS` credentials.
