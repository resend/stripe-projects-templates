import { appConfig } from '@/lib/app-config';

function firstNonEmpty(...values: Array<string | null | undefined>) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim() !== '') {
      return value.trim();
    }
  }

  return '';
}

export const RESEND_TESTING_FROM_ADDRESS = 'onboarding@resend.dev';

export const resendApiKey = firstNonEmpty(process.env.RESEND_API_KEY);

export const resendFromAddress = firstNonEmpty(
  process.env.RESEND_FROM_ADDRESS,
  RESEND_TESTING_FROM_ADDRESS,
);
export const resendFromName = firstNonEmpty(process.env.RESEND_FROM_NAME, appConfig.name);

export const resendEmailConfigured = Boolean(resendApiKey);
export const resendUsingTestingAddress = resendFromAddress === RESEND_TESTING_FROM_ADDRESS;
