// Lightweight form-to-email helper using FormSubmit.co (no backend setup needed).
// First submission triggers a one-time confirmation email to the inbox below;
// after confirming, all subsequent submissions are delivered directly.
const RECIPIENT = "beckiok22@gmail.com";
const ENDPOINT = `https://formsubmit.co/ajax/${RECIPIENT}`;

export async function sendFormToEmail(
  subject: string,
  data: Record<string, string>,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        _subject: subject,
        _template: "table",
        _captcha: "false",
        ...data,
      }),
    });
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}` };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Network error" };
  }
}

// Opens a URL in a new tab with explicit noopener/noreferrer to avoid
// Cross-Origin-Opener-Policy warnings when the preview/app runs inside an iframe.
export function openExternal(url: string) {
  const win = window.open(url, "_blank", "noopener,noreferrer");
  if (win) win.opener = null;
}
