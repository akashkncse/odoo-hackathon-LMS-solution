import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API);

export async function sendOtpEmail(
  email: string,
  otp: string,
  type: "signup" | "password_reset"
) {
  const subject =
    type === "signup"
      ? "Verify your email – LearnSphere"
      : "Reset your password – LearnSphere";

  const heading =
    type === "signup" ? "Verify Your Email" : "Reset Your Password";

  const message =
    type === "signup"
      ? "Use the code below to verify your email address and complete your signup."
      : "Use the code below to reset your password. If you didn't request this, you can safely ignore this email.";

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 20px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
                <tr>
                  <td style="padding:32px 32px 0;text-align:center;">
                    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#18181b;">${heading}</h1>
                    <p style="margin:0 0 24px;font-size:14px;color:#71717a;line-height:1.6;">
                      ${message}
                    </p>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding:0 32px;">
                    <div style="background-color:#f4f4f5;border-radius:8px;padding:16px 24px;display:inline-block;letter-spacing:8px;font-size:32px;font-weight:700;color:#18181b;font-family:'Courier New',monospace;">
                      ${otp}
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:24px 32px 32px;text-align:center;">
                    <p style="margin:0;font-size:13px;color:#a1a1aa;line-height:1.5;">
                      This code expires in <strong>10 minutes</strong>.<br />
                      Do not share this code with anyone.
                    </p>
                  </td>
                </tr>
              </table>
              <p style="margin:24px 0 0;font-size:12px;color:#a1a1aa;">
                &copy; LearnSphere. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  const { data, error } = await resend.emails.send({
    from: "LearnSphere <onboarding@resend.dev>",
    to: [email],
    subject,
    html,
  });

  if (error) {
    console.error("Failed to send OTP email:", error);
    throw new Error(`Failed to send email: ${error.message}`);
  }

  return data;
}
