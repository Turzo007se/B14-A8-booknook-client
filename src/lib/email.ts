type AuthEmail = { to: string; subject: string; text: string };

export async function sendAuthEmail({ to, subject, text }: AuthEmail) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) throw new Error("Email delivery is not configured. Add RESEND_API_KEY and EMAIL_FROM to the deployment environment.");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: [to], subject, text }),
  });
  if (!response.ok) {
    const result = await response.json().catch(() => null);
    throw new Error(result?.message || "The verification email could not be sent.");
  }
}
