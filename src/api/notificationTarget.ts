// Turns a failed-job notification into the screen where the problem can be
// fixed: the edit form for a record Odoo refused, the event page for a
// change to an event or its attendees, the record's page otherwise.
import type { NavigateFunction } from 'react-router-dom';
import { callApi } from '@/api';
import { isFailed } from '@/api/v2';
import { toast } from '@/lib/toast';

/* eslint-disable @typescript-eslint/no-explicit-any */

interface Target {
  type?: string;
  operation?: string;
  kind?: 'create' | 'action';
  recordId?: string;
  eventId?: string;
  organizerId?: string;
  category?: string;
}

interface Screen {
  /** v2 collection the record lives in. */
  resource: string;
  /** Form that edits a failed record (takes `state.record`). */
  form: string;
  /** Where the record is listed. */
  list: string;
}

// Keyed by the part of the operation name before the dot.
const SCREENS: Record<string, Screen> = {
  toll: { resource: '/v2/fleet/tolls', form: '/add-toll', list: '/toll' },
  personal_use: {
    resource: '/v2/fleet/personal-use',
    form: '/add-personal-use',
    list: '/personal-use',
  },
  expense: { resource: '/v2/expenses', form: '/expenses/add', list: '/expenses' },
  daily_activity: {
    resource: '/v2/daily-activities',
    form: '/add-daily-activity',
    list: '/daily-activities',
  },
  credit_limit_apply: {
    resource: '/v2/credit-limit/apply',
    form: '/add-credit-limit-apply',
    list: '/credit-limit-apply',
  },
  credit_limit_extension: {
    resource: '/v2/credit-limit/extension',
    form: '/add-credit-limit-extension',
    list: '/credit-limit-extension',
  },
  temporary_credit: {
    resource: '/v2/credit-limit/temporary',
    form: '/add-temporary-credit',
    list: '/temporary-credit',
  },
  sale: { resource: '/v2/sales', form: '/sales/add', list: '/sales' },
};

const FUEL: Screen = {
  resource: '/v2/fleet/services',
  form: '/add-fuel',
  list: '/fuel',
};
const MAINTENANCE: Screen = {
  resource: '/v2/fleet/services',
  form: '/add-maintenance',
  list: '/maintenance',
};

/** True when a notification can be opened on a record. */
export const hasTarget = (notification: any) =>
  notification?.data?.type === 'odoo_job_failed' &&
  !!notification.data.recordId;

/** The event page that applies to this user for this event. */
const eventPage = (target: Target, user: any) => {
  if (!user?.is_region_manager) return `/event-details/${target.eventId}`;
  // A manager's own event, or one they review in their region.
  return String(target.organizerId) === String(user.id)
    ? `/event-details-rm/${target.eventId}`
    : `/event-details-area/${target.eventId}`;
};

export const openNotificationTarget = (
  notification: any,
  navigate: NavigateFunction,
  user: any,
) => {
  const target: Target = notification?.data || {};
  const [domain] = String(target.operation || '').split('.');

  // An event that Odoo refused opens in its form; anything else about an
  // event (a change to it, an attendee) opens the event page.
  if (domain === 'event' || domain === 'event_attendee') {
    if (target.operation !== 'event.create') {
      navigate(eventPage(target, user));
      return;
    }
    callApi(
      'GET',
      `/v2/events/${target.recordId}`,
      null,
      (response) => {
        const event = response?.data?.event;
        if (event && isFailed(event)) {
          navigate(user?.is_region_manager ? '/add-rm-event' : '/add-event', {
            state: { record: event },
          });
        } else {
          navigate(eventPage(target, user));
        }
      },
      () => {
        toast.error('This event no longer exists');
        navigate('/events');
      },
    );
    return;
  }

  const screen =
    domain === 'service'
      ? target.category === 'fuel'
        ? FUEL
        : MAINTENANCE
      : SCREENS[domain];
  if (!screen) return;

  // Where the record can be seen once there is nothing left to fix.
  const view = () =>
    navigate(domain === 'sale' ? `/sale/${target.recordId}` : screen.list);

  // A refused change to an existing record went back to how it was; show it.
  if (target.kind !== 'create') {
    view();
    return;
  }

  callApi(
    'GET',
    `${screen.resource}/${target.recordId}`,
    null,
    (response) => {
      const record = response?.data;
      if (record && isFailed(record)) {
        navigate(screen.form, { state: { record } });
      } else {
        view();
      }
    },
    () => {
      toast.error('This record no longer exists');
      navigate(screen.list);
    },
  );
};
