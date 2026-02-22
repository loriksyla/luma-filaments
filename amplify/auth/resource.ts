import { defineAuth } from '@aws-amplify/backend';

/**
 * Define and configure your auth resource
 * @see https://docs.amplify.aws/gen2/build-a-backend/auth
 */
export const auth = defineAuth({
  loginWith: {
    email: {
      verificationEmailStyle: "CODE",
      verificationEmailSubject: "Kodi i Verifikimit - Luma Filaments",
      verificationEmailBody: (createCode) => `
        <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #0f172a; color: #f8fafc; border-radius: 16px; text-align: center;">
          <h1 style="color: #ffffff; font-size: 28px; font-weight: 900; letter-spacing: -1px; margin-bottom: 24px;">LUMA <span style="color: #0d9488;">FILAMENTS</span></h1>
          <p style="font-size: 16px; line-height: 1.5; color: #cbd5e1; margin-bottom: 32px;">Përshëndetje! Faleminderit që u regjistruat në Luma Filaments. Për të përfunduar regjistrimin, ju lutemi përdorni kodin e mëposhtëm të verifikimit:</p>
          <div style="background-color: #1e293b; border: 1px solid #334155; padding: 24px; border-radius: 12px; display: inline-block; margin-bottom: 32px;">
            <div style="font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #14b8a6;">${createCode()}</div>
          </div>
          <p style="font-size: 14px; color: #64748b;">Nëse nuk e keni kërkuar këtë kod, mund ta injoroni këtë email me siguri.</p>
          <div style="margin-top: 48px; border-top: 1px solid #1e293b; padding-top: 24px;">
            <p style="font-size: 12px; color: #475569;">&copy; 2026 LUMA Filaments. Të gjitha të drejtat e rezervuara.</p>
          </div>
        </div>
      `,
    },
  },
  groups: ["ADMINS"],
});
