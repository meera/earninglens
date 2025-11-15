import nodemailer from 'nodemailer';

export async function sendEmail({
  to,
  subject,
  text,
  html,
}: {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}) {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_SERVER_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_SERVER_PORT || '587'),
    secure: false, // use STARTTLS
    auth: {
      user: process.env.EMAIL_SERVER_USER, // meera@videotobe.com
      pass: process.env.EMAIL_SERVER_PASSWORD, // Gmail app password
    },
  });

  const mailData = {
    from: 'Markey HawkEye <meera@videotobe.com>',
    to: to,
    subject: subject,
    text: text || '',
    html: html || `<p>${text || ''}</p>`,
  };

  try {
    const info = await transporter.sendMail(mailData);
    console.log('Email sent:', info.response);
    return { status: 'Success' };
  } catch (error) {
    console.error('Error sending email:', error);
    return { status: 'Error', message: 'Failed to send email' };
  }
}

export async function sendNewSubscriberNotification(subscriberEmail: string) {
  const subject = `New Newsletter Subscriber: ${subscriberEmail}`;
  const text = `New subscriber to Markey HawkEye newsletter:\n\nEmail: ${subscriberEmail}\nSubscribed at: ${new Date().toISOString()}`;
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px;">
      <h2 style="color: #10B981;">New Newsletter Subscriber</h2>
      <table style="border-collapse: collapse; width: 100%; margin-top: 20px;">
        <tr>
          <td style="padding: 10px; border: 1px solid #ddd; background-color: #f9f9f9; font-weight: bold;">Email</td>
          <td style="padding: 10px; border: 1px solid #ddd;">${subscriberEmail}</td>
        </tr>
        <tr>
          <td style="padding: 10px; border: 1px solid #ddd; background-color: #f9f9f9; font-weight: bold;">Subscribed At</td>
          <td style="padding: 10px; border: 1px solid #ddd;">${new Date().toLocaleString()}</td>
        </tr>
      </table>
      <p style="margin-top: 20px; color: #666; font-size: 14px;">
        This is an automated notification from <a href="https://markethawkeye.com" style="color: #10B981;">markethawkeye.com</a>
      </p>
    </div>
  `;

  return sendEmail({
    to: 'meera@videotobe.com',
    subject,
    text,
    html,
  });
}
