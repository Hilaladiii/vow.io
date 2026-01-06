interface EmailTemplate {
  username: string;
  documentTitle: string;
  message?: string;
  link: string;
}

export function generateSignRequestEmail({
  username,
  documentTitle,
  message,
  link,
}: EmailTemplate): string {
  const colors = {
    bg: '#f4f4f5',
    card: '#ffffff',
    text: '#18181b',
    subtext: '#71717a',
    border: '#e4e4e7',
    primary: '#4f46e5',
    buttonText: '#ffffff',
  };

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sign Request - Vow.io</title>
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: ${colors.bg}; }
    .container { width: 100%; max-width: 600px; margin: 0 auto; background-color: ${colors.card}; border-radius: 8px; overflow: hidden; border: 1px solid ${colors.border}; margin-top: 40px; margin-bottom: 40px; }
    .header { padding: 30px; border-bottom: 1px solid ${colors.border}; background-color: #fafafa; }
    .content { padding: 40px 30px; }
    .button { display: inline-block; padding: 14px 24px; background-color: ${colors.primary}; color: ${colors.buttonText}; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; text-align: center; }
    .footer { padding: 20px; background-color: #fafafa; text-align: center; color: ${colors.subtext}; font-size: 12px; border-top: 1px solid ${colors.border}; }
    .meta-box { background-color: #f4f4f5; border-radius: 6px; padding: 16px; margin: 20px 0; border: 1px solid ${colors.border}; }
  </style>
</head>
<body>
  <div style="background-color: ${colors.bg}; padding: 20px;">
    
    <div style="text-align: center; margin-bottom: 20px;">
      <h2 style="color: ${colors.text}; margin: 0; letter-spacing: -1px; font-weight: 800; font-size: 24px;">Vow.io</h2>
    </div>

    <div class="container">
      
      <div class="header">
        <h1 style="color: ${colors.text}; font-size: 20px; margin: 0; font-weight: 600;">Signature Requested</h1>
      </div>

      <div class="content">
        <p style="color: ${colors.text}; font-size: 16px; line-height: 1.6; margin-top: 0;">
          Hi <strong>${username}</strong>,
        </p>
        
        <p style="color: ${colors.subtext}; font-size: 16px; line-height: 1.6;">
          You have been invited to review and sign the following document on Vow.io:
        </p>

        <div class="meta-box">
          <p style="margin: 0; font-size: 14px; color: ${colors.subtext}; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">Document</p>
          <p style="margin: 8px 0 0 0; font-size: 18px; color: ${colors.text}; font-weight: 600;">${documentTitle}</p>
          
          ${
            message
              ? `
            <div style="margin-top: 16px; border-top: 1px solid ${colors.border}; padding-top: 12px;">
              <p style="margin: 0; font-size: 14px; color: ${colors.subtext};">Message from sender:</p>
              <p style="margin: 4px 0 0 0; font-size: 14px; color: ${colors.text}; font-style: italic;">"${message}"</p>
            </div>
          `
              : ''
          }
        </div>

        <div style="text-align: center; margin-top: 32px; margin-bottom: 10px;">
          <a href="${link}" class="button" target="_blank">Review and Sign</a>
        </div>
        
        <p style="color: ${colors.subtext}; font-size: 14px; text-align: center; margin-top: 24px;">
          Link expires in 7 days. If the button doesn't work, paste this URL into your browser:<br>
          <a href="${link}" style="color: ${colors.primary}; word-break: break-all;">${link}</a>
        </p>
      </div>

      <div class="footer">
        &copy; ${new Date().getFullYear()} Vow.io. All rights reserved.<br>
        Secure Digital Signature Platform.
      </div>
    </div>
  </div>
</body>
</html>
  `;
}
