import dayjs from 'dayjs';

// Entry dates follow the Pakistan calendar day, the same day the server
// uses, whatever timezone the browser is in.

// Pakistan is UTC+5 all year (no daylight saving).
const PK_OFFSET_MS = 5 * 60 * 60 * 1000;

/** How far back an entry may be dated: today and this many days before. */
export const ENTRY_DAYS_BACK = 4;

/** Today's date in Pakistan, as `YYYY-MM-DD`. */
export const pkDay = (at: Date = new Date()): string =>
  new Date(at.getTime() + PK_OFFSET_MS).toISOString().slice(0, 10);

/** Today in Pakistan as a date for the pickers (local midnight of that day). */
export const pkToday = (): Date => dayjs(pkDay()).startOf('day').toDate();

/**
 * The dates an entry (toll, fuel, maintenance, personal use, expense, daily
 * activity) may carry: today and the four days before, in Pakistan time.
 * The server enforces the same window.
 */
export const entryDateLimits = () => {
  const today = dayjs(pkDay()).startOf('day');
  return {
    minDate: today.subtract(ENTRY_DAYS_BACK, 'day').toDate(),
    maxDate: today.toDate(),
  };
};

/** For a date picker's `excludeDate`: true for a day outside that window. */
export const isEntryDateDisabled = (value: string | Date): boolean => {
  const day = dayjs(value).startOf('day');
  const { minDate, maxDate } = entryDateLimits();
  return day.isBefore(minDate) || day.isAfter(maxDate);
};

/**
 * Whether a saved entry's date (stored as UTC midnight of its day) is today
 * or within the last ENTRY_DAYS_BACK days in Pakistan. A daily activity can
 * only be cancelled then; the server checks the same.
 */
export const isWithinEntryDays = (value: string | Date): boolean => {
  const day = new Date(value).toISOString().slice(0, 10);
  const earliest = pkDay(
    new Date(Date.now() - ENTRY_DAYS_BACK * 24 * 60 * 60 * 1000),
  );
  return day >= earliest && day <= pkDay();
};
