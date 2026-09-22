import { Resend } from 'resend';
import {
  resendApiKey,
  resendEmailConfigured,
  resendFromAddress,
  resendFromName,
} from '@/lib/resend-config';
import { databaseConfigured } from '@/lib/database-config';
import {
  claimSubscriptionWelcomeEmail,
  releaseSubscriptionWelcomeEmailClaim,
} from '@/lib/data';

let resendClient: Resend | null = null;

function getResendClient(): Resend {
  if (!resendClient) {
    resendClient = new Resend(resendApiKey);
  }

  return resendClient;
}

function buildWelcomeEmailContent(productName: string) {
  const subject = `Welcome to ${productName} — your subscription is active`;

  const text = [
    `Thanks for subscribing to ${productName}!`,
    '',
    'Your subscription is now active and your workspace is ready.',
    'Sign in any time to pick up where you left off.',
    '',
    `— The ${productName} team`,
  ].join('\n');

  const html = [
    '<div style="font-family: -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; color: #0f172a; line-height: 1.6;">',
    `<h1 style="font-size: 22px; margin: 0 0 12px;">Welcome to ${productName}</h1>`,
    `<p style="margin: 0 0 12px;">Thanks for subscribing! Your subscription is now active and your workspace is ready.</p>`,
    `<p style="margin: 0 0 12px;">Sign in any time to pick up where you left off.</p>`,
    `<p style="margin: 24px 0 0; color: #64748b;">— The ${productName} team</p>`,
    '</div>',
  ].join('');

  return { subject, text, html };
}

/**
 * Send a "thank you for subscribing / access granted" welcome email after a
 * subscription starts.
 */
export async function sendSubscriptionWelcomeEmail({
  to,
  productName,
}: {
  to: string | null | undefined;
  productName: string;
}): Promise<boolean> {
  if (!resendEmailConfigured) {
    console.warn('Skipping subscription welcome email: RESEND_API_KEY is not set.');
    return false;
  }

  if (!to) {
    console.warn('Skipping subscription welcome email: no recipient email address.');
    return false;
  }

  try {
    const { subject, text, html } = buildWelcomeEmailContent(productName);

    const { error } = await getResendClient().emails.send({
      from: `${resendFromName} <${resendFromAddress}>`,
      to: [to],
      subject,
      html,
      text,
    });

    if (error) {
      throw new Error(`Resend send failed: ${error.name}. ${error.message}`.trim());
    }

    return true;
  } catch (error) {
    console.error('Failed to send subscription welcome email via Resend:', error);
    return false;
  }
}

/**
 * Send the subscription welcome email exactly once, even though both the Stripe
 * webhook and the success page call this for the same subscription (and may race).
 */
export async function sendWelcomeEmailForSubscriptionOnce({
  stripeSubscriptionId,
  to,
  productName,
}: {
  stripeSubscriptionId: string | null | undefined;
  to: string | null | undefined;
  productName: string;
}): Promise<boolean> {
  if (!resendEmailConfigured || !to) {
    return sendSubscriptionWelcomeEmail({ to, productName });
  }

  if (!databaseConfigured || !stripeSubscriptionId) {
    return sendSubscriptionWelcomeEmail({ to, productName });
  }

  let claimed = false;
  try {
    claimed = await claimSubscriptionWelcomeEmail(stripeSubscriptionId);
  } catch (error) {
    console.error('Failed to claim subscription welcome email; skipping send:', error);
    return false;
  }

  if (!claimed) {
    // Another caller already sent (or is sending) this welcome email.
    return false;
  }

  const sent = await sendSubscriptionWelcomeEmail({ to, productName });

  if (!sent) {
    try {
      await releaseSubscriptionWelcomeEmailClaim(stripeSubscriptionId);
    } catch (error) {
      console.error('Failed to release welcome email claim after send failure:', error);
    }
  }

  return sent;
}
