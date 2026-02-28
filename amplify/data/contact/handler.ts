import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import type { Schema } from '../resource';
import { escapeHtml } from '../utils/escapeHtml';

type Handler = Schema['contact']['functionHandler'];

export const handler: Handler = async (event): Promise<any> => {
    try {
        const { name, email, subject, message } = event.arguments;

        const fromEmail = process.env.CONTACT_EMAIL_FROM || 'gentrit.tech@gmail.com';
        const adminEmail = process.env.CONTACT_EMAIL_ADMIN || 'gentrit.tech@gmail.com';

        const ses = new SESClient({ region: process.env.AWS_REGION });

        const htmlBody = `
      <h2>New Contact Request</h2>
      <p><strong>Name:</strong> ${escapeHtml(name)}</p>
      <p><strong>Email:</strong> ${escapeHtml(email)}</p>
      <p><strong>Subject:</strong> ${escapeHtml(subject)}</p>
      <p><strong>Message:</strong></p>
      <p>${escapeHtml(message).replace(/\n/g, '<br/>')}</p>
    `;

        await ses.send(
            new SendEmailCommand({
                Source: fromEmail,
                Destination: { ToAddresses: [adminEmail] },
                Message: {
                    Subject: { Data: `Contact Request: ${subject}`, Charset: 'UTF-8' },
                    Body: { Html: { Data: htmlBody, Charset: 'UTF-8' } },
                },
            })
        );

        return { ok: true, message: 'Message sent successfully.' };
    } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : JSON.stringify(err);
        console.error('contact failed:', err);
        return { ok: false, message: errorMsg };
    }
};
