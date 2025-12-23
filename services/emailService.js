const sgMail = require('@sendgrid/mail');

// Initialize SendGrid with API key
const initializeSendGrid = () => {
    if (process.env.SENDGRID_API_KEY) {
        sgMail.setApiKey(process.env.SENDGRID_API_KEY);
        console.log('SendGrid initialized successfully');
        return true;
    }
    console.warn('SendGrid API key not found. Email service disabled.');
    return false;
};

class EmailService {
    constructor() {
        this.isEnabled = false;
        this.fromEmail = process.env.SENDGRID_FROM_EMAIL || 'noreply@greconnect.com';
        this.fromName = process.env.SENDGRID_FROM_NAME || 'GreConnect';
        this.appName = 'GreConnect';
        this.frontendUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    }

    initialize() {
        this.isEnabled = initializeSendGrid();
        return this.isEnabled;
    }

    async sendEmail({ to, subject, html, text }) {
        if (!this.isEnabled) {
            console.log(`[Email Disabled] Would send to: ${to}, Subject: ${subject}`);
            return { success: false, reason: 'Email service not configured' };
        }

        try {
            const msg = {
                to,
                from: {
                    email: this.fromEmail,
                    name: this.fromName
                },
                subject,
                html,
                text: text || subject
            };

            await sgMail.send(msg);
            console.log(`Email sent successfully to: ${to}`);
            return { success: true };
        } catch (error) {
            console.error('SendGrid Error:', error.response?.body || error.message);
            return { success: false, error: error.message };
        }
    }

    // Password Reset Email
    async sendPasswordResetEmail(user, resetToken) {
        const resetUrl = `${this.frontendUrl}/reset-password?token=${resetToken}`;

        const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
        <table role="presentation" style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 40px 0;">
              <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">${this.appName}</h1>
                  </td>
                </tr>
                <!-- Content -->
                <tr>
                  <td style="padding: 40px 30px;">
                    <h2 style="color: #333333; margin: 0 0 20px; font-size: 24px;">Reset Your Password</h2>
                    <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                      Hello <strong>${user.firstName}</strong>,
                    </p>
                    <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">
                      We received a request to reset your password. Click the button below to create a new password:
                    </p>
                    <div style="text-align: center; margin: 30px 0;">
                      <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 8px; font-size: 16px; font-weight: 600;">Reset Password</a>
                    </div>
                    <p style="color: #999999; font-size: 14px; line-height: 1.6; margin: 30px 0 0;">
                      This link will expire in <strong>1 hour</strong>. If you didn't request a password reset, please ignore this email.
                    </p>
                    <hr style="border: none; border-top: 1px solid #eeeeee; margin: 30px 0;">
                    <p style="color: #999999; font-size: 12px; margin: 0;">
                      If the button doesn't work, copy and paste this link into your browser:<br>
                      <a href="${resetUrl}" style="color: #667eea; word-break: break-all;">${resetUrl}</a>
                    </p>
                  </td>
                </tr>
                <!-- Footer -->
                <tr>
                  <td style="background-color: #f8f9fa; padding: 20px 30px; text-align: center;">
                    <p style="color: #999999; font-size: 12px; margin: 0;">
                      © ${new Date().getFullYear()} ${this.appName}. All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

        return this.sendEmail({
            to: user.email,
            subject: `Reset Your ${this.appName} Password`,
            html,
            text: `Hello ${user.firstName}, Reset your password by visiting: ${resetUrl}. This link expires in 1 hour.`
        });
    }

    // Account Approved Email
    async sendAccountApprovedEmail(user) {
        const loginUrl = `${this.frontendUrl}/login`;

        const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Account Approved</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
        <table role="presentation" style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 40px 0;">
              <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); padding: 40px 30px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">🎉 Welcome to ${this.appName}!</h1>
                  </td>
                </tr>
                <!-- Content -->
                <tr>
                  <td style="padding: 40px 30px;">
                    <h2 style="color: #333333; margin: 0 0 20px; font-size: 24px;">Good News, ${user.firstName}!</h2>
                    <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                      Your ${this.appName} account has been <strong style="color: #11998e;">approved</strong>! You can now access all features of the platform.
                    </p>
                    <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0;">
                      <h3 style="color: #333333; margin: 0 0 15px; font-size: 16px;">Your Account Details:</h3>
                      <p style="color: #666666; font-size: 14px; margin: 5px 0;">
                        <strong>Name:</strong> ${user.firstName} ${user.lastName}
                      </p>
                      <p style="color: #666666; font-size: 14px; margin: 5px 0;">
                        <strong>Username:</strong> ${user.username}
                      </p>
                      <p style="color: #666666; font-size: 14px; margin: 5px 0;">
                        <strong>Role:</strong> ${user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </p>
                    </div>
                    <div style="text-align: center; margin: 30px 0;">
                      <a href="${loginUrl}" style="display: inline-block; background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 8px; font-size: 16px; font-weight: 600;">Login Now</a>
                    </div>
                    <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 20px 0 0;">
                      Here's what you can do now:
                    </p>
                    <ul style="color: #666666; font-size: 14px; line-height: 1.8; padding-left: 20px;">
                      <li>Connect with other students and teachers</li>
                      <li>Ask questions and share knowledge</li>
                      <li>Access learning resources</li>
                      <li>Join events and discussions</li>
                    </ul>
                  </td>
                </tr>
                <!-- Footer -->
                <tr>
                  <td style="background-color: #f8f9fa; padding: 20px 30px; text-align: center;">
                    <p style="color: #999999; font-size: 12px; margin: 0;">
                      © ${new Date().getFullYear()} ${this.appName}. All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

        return this.sendEmail({
            to: user.email,
            subject: `🎉 Your ${this.appName} Account Has Been Approved!`,
            html,
            text: `Hello ${user.firstName}, Your ${this.appName} account has been approved! You can now login at ${loginUrl}`
        });
    }

    // Account Rejected Email
    async sendAccountRejectedEmail(user, reason = '') {
        const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Account Status Update</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
        <table role="presentation" style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 40px 0;">
              <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #eb3349 0%, #f45c43 100%); padding: 40px 30px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">${this.appName}</h1>
                  </td>
                </tr>
                <!-- Content -->
                <tr>
                  <td style="padding: 40px 30px;">
                    <h2 style="color: #333333; margin: 0 0 20px; font-size: 24px;">Account Registration Update</h2>
                    <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                      Hello <strong>${user.firstName}</strong>,
                    </p>
                    <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                      We regret to inform you that your registration request for ${this.appName} has not been approved at this time.
                    </p>
                    ${reason ? `
                    <div style="background-color: #fff3f3; border-left: 4px solid #eb3349; border-radius: 4px; padding: 15px 20px; margin: 20px 0;">
                      <p style="color: #666666; font-size: 14px; margin: 0;">
                        <strong>Reason:</strong> ${reason}
                      </p>
                    </div>
                    ` : ''}
                    <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 20px 0 0;">
                      If you believe this was a mistake or have questions, please contact our support team.
                    </p>
                  </td>
                </tr>
                <!-- Footer -->
                <tr>
                  <td style="background-color: #f8f9fa; padding: 20px 30px; text-align: center;">
                    <p style="color: #999999; font-size: 12px; margin: 0;">
                      © ${new Date().getFullYear()} ${this.appName}. All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

        return this.sendEmail({
            to: user.email,
            subject: `${this.appName} Account Registration Update`,
            html,
            text: `Hello ${user.firstName}, We regret to inform you that your registration request for ${this.appName} has not been approved. ${reason ? `Reason: ${reason}` : ''}`
        });
    }

    // Welcome Email (after registration, before approval)
    async sendWelcomeEmail(user) {
        const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to ${this.appName}</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
        <table role="presentation" style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 40px 0;">
              <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">Welcome to ${this.appName}!</h1>
                  </td>
                </tr>
                <!-- Content -->
                <tr>
                  <td style="padding: 40px 30px;">
                    <h2 style="color: #333333; margin: 0 0 20px; font-size: 24px;">Hello ${user.firstName}!</h2>
                    <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                      Thank you for registering with ${this.appName}! Your account is currently being reviewed by our team.
                    </p>
                    <div style="background-color: #fff8e6; border-left: 4px solid #ffc107; border-radius: 4px; padding: 15px 20px; margin: 20px 0;">
                      <p style="color: #666666; font-size: 14px; margin: 0;">
                        ⏳ <strong>Pending Approval:</strong> You will receive an email once your account has been approved.
                      </p>
                    </div>
                    <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0;">
                      <h3 style="color: #333333; margin: 0 0 15px; font-size: 16px;">Your Registration Details:</h3>
                      <p style="color: #666666; font-size: 14px; margin: 5px 0;">
                        <strong>Name:</strong> ${user.firstName} ${user.lastName}
                      </p>
                      <p style="color: #666666; font-size: 14px; margin: 5px 0;">
                        <strong>Username:</strong> ${user.username}
                      </p>
                      <p style="color: #666666; font-size: 14px; margin: 5px 0;">
                        <strong>Email:</strong> ${user.email}
                      </p>
                    </div>
                  </td>
                </tr>
                <!-- Footer -->
                <tr>
                  <td style="background-color: #f8f9fa; padding: 20px 30px; text-align: center;">
                    <p style="color: #999999; font-size: 12px; margin: 0;">
                      © ${new Date().getFullYear()} ${this.appName}. All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

        return this.sendEmail({
            to: user.email,
            subject: `Welcome to ${this.appName} - Registration Received`,
            html,
            text: `Hello ${user.firstName}! Thank you for registering with ${this.appName}. Your account is currently pending approval.`
        });
    }

    // New Answer Notification Email
    async sendNewAnswerEmail(questionOwner, answerer, question) {
        const questionUrl = `${this.frontendUrl}/questions/${question._id}`;

        const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Answer to Your Question</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
        <table role="presentation" style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 40px 0;">
              <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); padding: 40px 30px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">💬 New Answer!</h1>
                  </td>
                </tr>
                <!-- Content -->
                <tr>
                  <td style="padding: 40px 30px;">
                    <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                      Hello <strong>${questionOwner.firstName}</strong>,
                    </p>
                    <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                      <strong>${answerer.firstName} ${answerer.lastName}</strong> has answered your question:
                    </p>
                    <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #4facfe;">
                      <p style="color: #333333; font-size: 16px; font-weight: 600; margin: 0;">
                        "${question.title}"
                      </p>
                    </div>
                    <div style="text-align: center; margin: 30px 0;">
                      <a href="${questionUrl}" style="display: inline-block; background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 8px; font-size: 16px; font-weight: 600;">View Answer</a>
                    </div>
                  </td>
                </tr>
                <!-- Footer -->
                <tr>
                  <td style="background-color: #f8f9fa; padding: 20px 30px; text-align: center;">
                    <p style="color: #999999; font-size: 12px; margin: 0;">
                      © ${new Date().getFullYear()} ${this.appName}. All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

        return this.sendEmail({
            to: questionOwner.email,
            subject: `💬 ${answerer.firstName} answered your question on ${this.appName}`,
            html,
            text: `Hello ${questionOwner.firstName}, ${answerer.firstName} ${answerer.lastName} has answered your question: "${question.title}". View it at ${questionUrl}`
        });
    }
}

module.exports = new EmailService();

