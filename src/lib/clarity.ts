// Microsoft Clarity: session recordings and heatmaps of the live dashboard.
// Only production builds are recorded, so local work never reaches it.
import Clarity from '@microsoft/clarity';

// VITE_CLARITY_PROJECT_ID points a build at another Clarity project.
const PROJECT_ID = import.meta.env.VITE_CLARITY_PROJECT_ID || 'ywmqp9yt3w';

let started = false;

export const startClarity = () => {
  if (import.meta.env.DEV || started) return;
  started = true;
  Clarity.init(PROJECT_ID);
};

/**
 * Ties the recordings to the signed-in employee, so one person's sessions
 * can be found together. They are labelled name-id-company, for example
 * "Wajeeh-1-Suncrop", with the company id as a tag to filter by.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const identifyClarityUser = (user: any) => {
  if (user?.id == null || !started) return;
  const companyId = user.company?.id ?? user.company_id;
  const label = [user.name, user.id, user.company?.name ?? companyId]
    .filter((part) => part != null && part !== '')
    .join('-');
  Clarity.identify(label, undefined, undefined, label);
  if (companyId != null) Clarity.setTag('company_id', String(companyId));
};
