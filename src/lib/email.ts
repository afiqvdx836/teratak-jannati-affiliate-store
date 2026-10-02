import "server-only";
import { Resend } from "resend";

function getClient() {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY belum diset");
  return new Resend(key);
}

export async function sendMagicLink(
  email: string,
  token: string,
  baseUrl: string,
) {
  const link = `${baseUrl}/admin/login/verify?token=${token}`;
  const resend = getClient();
  await resend.emails.send({
    from: "Login <noreply@resend.dev>",
    to: email,
    subject: "Login ke admin panel",
    html: `
      <p>Klik butang di bawah untuk login ke admin panel:</p>
      <p><a href="${link}" style="display:inline-block;background:#1f1b16;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">Log Masuk</a></p>
      <p style="color:#6b6259;font-size:13px;">Link ini sah untuk 15 minit sahaja. Jika anda tidak meminta login ini, abaikan email ini.</p>
    `,
  });
}
