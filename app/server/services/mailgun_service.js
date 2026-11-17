import { APP_TITLE, OTP_TTL_MS } from '../config.js';
import { httpError } from '../utils/http_error.js';

/** Mailgun settings from the environment, or null when email is not configured. */
export function mailgunConfig(env = process.env) {
  const apiKey = env.MAILGUN_API_KEY;
  const from = env.MAILGUN_FROM_EMAIL;
  const domain = env.MAILGUN_DOMAIN;
  if (!apiKey || !from || !domain) return null;

  return {
    apiKey,
    from,
    domain,
    baseUrl: (env.MAILGUN_BASE_URL || 'https://api.mailgun.net').replace(/\/+$/, '')
  };
}

/** Sends sign-in codes through the Mailgun HTTP API. The key is never logged or returned. */
export function createMailgunMailer(env = process.env, fetchImpl = fetch) {
  return {
    configured: () => Boolean(mailgunConfig(env)),

    async sendCode(to, code) {
      const config = mailgunConfig(env);
      if (!config) throw httpError('Email delivery is not configured.', 503);

      const minutes = OTP_TTL_MS / 60000;
      const body = new URLSearchParams({
        from: `${APP_TITLE} <${config.from}>`,
        to,
        subject: `Your sign-in code: ${APP_TITLE}`,
        text: `Your sign-in code is ${code}. It expires in ${minutes} minutes. If you did not request it, ignore this email.`
      });

      const response = await fetchImpl(`${config.baseUrl}/v3/${encodeURIComponent(config.domain)}/messages`, {
        method: 'POST',
        headers: { Authorization: `Basic ${Buffer.from(`api:${config.apiKey}`).toString('base64')}` },
        body,
        signal: AbortSignal.timeout(10000)
      });

      if (!response.ok) {
        console.error(`Mailgun rejected the message (HTTP ${response.status}).`);
        throw httpError('Could not send the sign-in email. Try again shortly.', 502);
      }
    }
  };
}
