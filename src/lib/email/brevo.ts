/**
 * Brevo (formerly Sendinblue) Transactional Email Service
 * Digunakan untuk:
 *   1. Email Selamat Datang / Registrasi Akun Baru Peserta
 *   2. Email Reset Kata Sandi (Password Reset)
 */

export interface EmailRecipient {
  email: string;
  name?: string;
}

export interface SendEmailPayload {
  to: EmailRecipient[];
  subject: string;
  htmlContent: string;
  textContent?: string;
  sender?: EmailRecipient;
  replyTo?: EmailRecipient;
}

export interface BrevoResult {
  ok: boolean;
  messageId?: string;
  error?: string;
}

const DEFAULT_SENDER: EmailRecipient = {
  name: process.env.BREVO_SENDER_NAME || 'Rajendra Swim System',
  email: process.env.BREVO_SENDER_EMAIL || 'sembilanrouter@gmail.com',
};

/**
 * Kirim Email Transaksional via Brevo REST API v3
 */
export async function sendBrevoEmail(payload: SendEmailPayload): Promise<BrevoResult> {
  const apiKey = process.env.BREVO_API_KEY;

  if (!apiKey) {
    console.warn('[Brevo Email] BREVO_API_KEY belum dikonfigurasi di environment variables.');
    return {
      ok: false,
      error: 'BREVO_API_KEY belum diatur di environment variables.',
    };
  }

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        sender: payload.sender || DEFAULT_SENDER,
        to: payload.to,
        subject: payload.subject,
        htmlContent: payload.htmlContent,
        textContent: payload.textContent,
        replyTo: payload.replyTo,
      }),
    });

    const data = await response.json();

    if (response.ok && data?.messageId) {
      return { ok: true, messageId: data.messageId };
    }

    return {
      ok: false,
      error: data?.message || data?.code || 'Gagal mengirim email via Brevo.',
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Kesalahan jaringan API Brevo.';
    console.error('[Brevo Email Error]:', errorMsg);
    return { ok: false, error: errorMsg };
  }
}

/**
 * 1. Email Pendaftaran Akun Peserta Baru (Selamat Datang)
 */
export async function sendAccountRegistrationEmail(params: {
  toEmail: string;
  toName: string;
  username: string;
}): Promise<BrevoResult> {
  const brandLogoUrl = 'https://raw.githubusercontent.com/rayy1123/rajendra-meet/main/public/brand/logo.png';
  const organizerLogoUrl = 'https://raw.githubusercontent.com/rayy1123/rajendra-meet/main/public/brand/rajendra-organizer-logo.png';

  const html = `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <title>Selamat Datang - Rajendra Swim System</title>
    </head>
    <body style="margin: 0; padding: 24px 12px; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width: 540px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);">
        <tr>
          <td style="padding: 32px 24px 20px 24px; text-align: center; background: linear-gradient(180deg, #f0f9ff 0%, #ffffff 100%); border-bottom: 1px solid #f1f5f9;">
            <img src="${brandLogoUrl}" alt="Rajendra Swim System" width="76" height="76" style="width: 76px; height: 76px; object-fit: contain; margin: 0 auto 12px auto; display: block; border-radius: 12px;" />
            <h1 style="margin: 0; font-size: 19px; font-weight: 900; color: #0f2b5c; letter-spacing: 0.5px; text-transform: uppercase;">
              Rajendra <span style="color: #0284c7;">Swim System</span>
            </h1>
            <p style="margin: 6px 0 0 0; font-size: 10px; font-weight: 800; color: #0284c7; text-transform: uppercase; letter-spacing: 2px;">
              AKUN RESMI BERHASIL DIDAFTARKAN
            </p>
          </td>
        </tr>

        <tr>
          <td style="padding: 28px 24px; text-align: center;">
            <p style="margin: 0 0 8px 0; font-size: 16px; font-weight: 700; color: #0f172a;">
              Halo, <span style="color: #0369a1;">${params.toName}</span>!
            </p>
            <p style="margin: 0 auto 20px auto; max-width: 420px; font-size: 13px; line-height: 1.6; color: #475569;">
              Selamat datang di ekosistem digital <b>Rajendra Swim System</b>. Akun resmi Anda telah aktif dan siap digunakan untuk manajemen kejuaraan renang.
            </p>

            <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 16px auto; width: 100%; max-width: 400px; text-align: left; background-color: #f8fafc; border-radius: 14px; border: 1px solid #e2e8f0; padding: 16px;">
              <tr>
                <td style="padding: 12px 16px;">
                  <p style="margin: 0 0 8px 0; font-size: 11px; font-weight: 800; color: #0369a1; text-transform: uppercase; letter-spacing: 1px;">KREDENSIAL AKUN ANDA</p>
                  <p style="margin: 4px 0; font-size: 13px; color: #334155;">• Nama Lengkap: <b style="color: #0f172a;">${params.toName}</b></p>
                  <p style="margin: 4px 0; font-size: 13px; color: #334155;">• Username: <b style="color: #0284c7; font-family: monospace;">${params.username}</b></p>
                  <p style="margin: 4px 0; font-size: 13px; color: #334155;">• Email Resmi: <b style="color: #0f172a;">${params.toEmail}</b></p>
                </td>
              </tr>
            </table>

            <p style="margin: 20px auto 0 auto; max-width: 420px; font-size: 12px; color: #64748b; line-height: 1.6;">
              Anda dapat masuk ke portal untuk mendaftarkan atlet kontingen, mengunggah bukti pembayaran, dan memantau live timing scoreboard secara langsung.
            </p>
          </td>
        </tr>

        <tr>
          <td style="padding: 20px 24px; text-align: center; background-color: #f8fafc; border-top: 1px solid #e2e8f0;">
            <img src="${organizerLogoUrl}" alt="Rajendra Project" width="110" height="24" style="height: 22px; width: auto; object-fit: contain; margin: 0 auto 8px auto; display: block; opacity: 0.8;" />
            <p style="margin: 0; font-size: 11px; font-weight: 600; color: #94a3b8;">
              © 2026 Rajendra Swim System • Layanan Email Transaksional Resmi
            </p>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  return sendBrevoEmail({
    to: [{ email: params.toEmail, name: params.toName }],
    subject: `[Rajendra Swim System] Selamat Datang - Akun ${params.username} Berhasil Dibuat`,
    htmlContent: html,
  });
}

/**
 * 2. Email Tautan Reset Kata Sandi (Password Reset)
 */
export async function sendPasswordResetEmail(params: {
  toEmail: string;
  toName?: string;
  resetUrl: string;
}): Promise<BrevoResult> {
  const brandLogoUrl = 'https://raw.githubusercontent.com/rayy1123/rajendra-meet/main/public/brand/logo.png';
  const organizerLogoUrl = 'https://raw.githubusercontent.com/rayy1123/rajendra-meet/main/public/brand/rajendra-organizer-logo.png';

  const html = `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <title>Reset Kata Sandi - Rajendra Swim System</title>
    </head>
    <body style="margin: 0; padding: 24px 12px; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width: 540px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);">
        <tr>
          <td style="padding: 32px 24px 20px 24px; text-align: center; background: linear-gradient(180deg, #f0f9ff 0%, #ffffff 100%); border-bottom: 1px solid #f1f5f9;">
            <img src="${brandLogoUrl}" alt="Rajendra Swim System" width="76" height="76" style="width: 76px; height: 76px; object-fit: contain; margin: 0 auto 12px auto; display: block; border-radius: 12px;" />
            <h1 style="margin: 0; font-size: 19px; font-weight: 900; color: #0f2b5c; letter-spacing: 0.5px; text-transform: uppercase;">
              Rajendra <span style="color: #0284c7;">Swim System</span>
            </h1>
            <p style="margin: 6px 0 0 0; font-size: 10px; font-weight: 800; color: #f59e0b; text-transform: uppercase; letter-spacing: 2px;">
              PERMINTAAN RESET KATA SANDI
            </p>
          </td>
        </tr>

        <tr>
          <td style="padding: 28px 24px; text-align: center;">
            <p style="margin: 0 0 8px 0; font-size: 16px; font-weight: 700; color: #0f172a;">
              Halo, <span style="color: #0369a1;">${params.toName || params.toEmail}</span>
            </p>
            <p style="margin: 0 auto 20px auto; max-width: 420px; font-size: 13px; line-height: 1.6; color: #475569;">
              Kami menerima permintaan untuk mereset kata sandi akun Rajendra Swim System Anda. Klik tombol terpusat di bawah ini untuk mengatur kata sandi baru:
            </p>

            <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 20px auto;">
              <tr>
                <td style="border-radius: 12px; background-color: #0284c7; text-align: center;">
                  <a href="${params.resetUrl}" style="background-color: #0284c7; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 12px; font-weight: 800; font-size: 14px; display: inline-block; letter-spacing: 0.5px;">
                    Reset Kata Sandi Akun Anda
                  </a>
                </td>
              </tr>
            </table>

            <p style="margin: 18px auto 0 auto; max-width: 420px; font-size: 11px; color: #64748b; line-height: 1.5;">
              Tautan ini berlaku selama 24 jam. Jika Anda tidak meminta reset kata sandi, abaikan email ini dengan aman.
            </p>
          </td>
        </tr>

        <tr>
          <td style="padding: 20px 24px; text-align: center; background-color: #f8fafc; border-top: 1px solid #e2e8f0;">
            <img src="${organizerLogoUrl}" alt="Rajendra Project" width="110" height="24" style="height: 22px; width: auto; object-fit: contain; margin: 0 auto 8px auto; display: block; opacity: 0.8;" />
            <p style="margin: 0; font-size: 11px; font-weight: 600; color: #94a3b8;">
              © 2026 Rajendra Swim System • Keamanan & Proteksi Akun
            </p>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  return sendBrevoEmail({
    to: [{ email: params.toEmail, name: params.toName }],
    subject: `[Rajendra Swim System] Instruksi Reset Kata Sandi Akun`,
    htmlContent: html,
  });
}
