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
  email: process.env.BREVO_SENDER_EMAIL || 'noreply@rajendra.id',
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
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
      <div style="background-color: #0f2b5c; padding: 18px 20px; border-radius: 8px; text-align: center;">
        <h2 style="color: #ffffff; margin: 0; font-size: 20px; text-transform: uppercase; letter-spacing: 0.5px;">Rajendra Swim System</h2>
        <p style="color: #38bdf8; margin: 4px 0 0 0; font-size: 11px; font-weight: bold; tracking-wider: uppercase;">AKUN RESMI BERHASIL DIDAFTARKAN</p>
      </div>
      <div style="padding: 20px 0; color: #0f172a; font-size: 14px; line-height: 1.6;">
        <p>Halo <b>${params.toName}</b>,</p>
        <p>Selamat datang di platform <b>Rajendra Swim System</b>! Akun resmi pendaftaran kejuaraan Anda telah berhasil terdaftar.</p>
        <div style="background-color: #f8fafc; padding: 16px; border-radius: 8px; border-left: 4px solid #0284c7; margin: 16px 0;">
          <p style="margin: 0 0 8px 0; font-weight: bold; color: #0f2b5c;">Kredensial Akun Anda:</p>
          <p style="margin: 4px 0;">• Nama Lengkap: <b>${params.toName}</b></p>
          <p style="margin: 4px 0;">• Username: <b style="color: #0284c7;">${params.username}</b></p>
          <p style="margin: 4px 0;">• Email Resmi: <b>${params.toEmail}</b></p>
        </div>
        <p>Anda sekarang dapat masuk ke sistem untuk mendaftarkan atlet, mengunggah bukti pembayaran, dan mengunduh ID Pass peserta.</p>
      </div>
      <div style="border-top: 1px solid #e2e8f0; padding-top: 12px; text-align: center; font-size: 11px; color: #64748b;">
        © 2026 Rajendra Swim System • Layanan Email Transaksional Resmi
      </div>
    </div>
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
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
      <div style="background-color: #0f2b5c; padding: 18px 20px; border-radius: 8px; text-align: center;">
        <h2 style="color: #ffffff; margin: 0; font-size: 20px; text-transform: uppercase;">Rajendra Swim System</h2>
        <p style="color: #f59e0b; margin: 4px 0 0 0; font-size: 11px; font-weight: bold;">PERMINTAAN RESET KATA SANDI</p>
      </div>
      <div style="padding: 20px 0; color: #0f172a; font-size: 14px; line-height: 1.6;">
        <p>Halo <b>${params.toName || params.toEmail}</b>,</p>
        <p>Kami menerima permintaan untuk mereset kata sandi akun Rajendra Swim System Anda.</p>
        <p>Silakan klik tombol di bawah ini untuk mengatur kata sandi baru:</p>
        <div style="text-align: center; margin: 24px 0;">
          <a href="${params.resetUrl}" style="background-color: #0284c7; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block;">
            Reset Kata Sandi Akun Anda
          </a>
        </div>
        <p style="font-size: 12px; color: #64748b;">Jika tombol di atas tidak berfungsi, salin dan tempel tautan berikut di browser Anda:<br /><a href="${params.resetUrl}" style="color: #0284c7;">${params.resetUrl}</a></p>
        <p style="font-size: 12px; color: #ef4444; margin-top: 16px;">Tautan ini berlaku selama 24 jam. Jika Anda tidak meminta reset password, abaikan email ini.</p>
      </div>
      <div style="border-top: 1px solid #e2e8f0; padding-top: 12px; text-align: center; font-size: 11px; color: #64748b;">
        © 2026 Rajendra Swim System • Keamanan & Proteksi Akun
      </div>
    </div>
  `;

  return sendBrevoEmail({
    to: [{ email: params.toEmail, name: params.toName }],
    subject: `[Rajendra Swim System] Instruksi Reset Kata Sandi Akun`,
    htmlContent: html,
  });
}
