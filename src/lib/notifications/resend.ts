type SendParams = { to: string; subject: string; html: string };

export async function sendEmail({ to, subject, html }: SendParams) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    // Dev no-op
    return { ok: true } as const;
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'noreply@digigov.local',
      to: [to],
      subject,
      html,
    }),
  });
  if (!res.ok) {
    return { ok: false as const, status: res.status };
  }
  return { ok: true as const };
}


