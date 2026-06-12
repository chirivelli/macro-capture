import type { DetectedTime, FieldIntent, ParsedTaskInput, Recurrence, Task } from './types';

export function startOfToday() {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now;
}

function parseClockTime(raw: string) {
  const explicit = raw.match(/\b(?:at\s*)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i);
  if (explicit) {
    let hours = Number(explicit[1]);
    const minutes = Number(explicit[2] ?? 0);
    const meridiem = explicit[3].toLowerCase();

    if (meridiem === 'pm' && hours < 12) {
      hours += 12;
    }
    if (meridiem === 'am' && hours === 12) {
      hours = 0;
    }

    return { hours, minutes };
  }

  const bare = raw.match(/\bat\s+(\d{1,2})(?::(\d{2}))?\b/i);
  if (bare) {
    const hour = Number(bare[1]);
    return { hours: hour < 8 ? hour + 12 : hour, minutes: Number(bare[2] ?? 0) };
  }

  if (/\bmorning\b/i.test(raw)) {
    return { hours: 9, minutes: 0 };
  }
  if (/\b(noon|lunch)\b/i.test(raw)) {
    return { hours: 12, minutes: 0 };
  }
  if (/\bafternoon\b/i.test(raw)) {
    return { hours: 12, minutes: 0 };
  }
  if (/\bevening\b/i.test(raw)) {
    return { hours: 17, minutes: 0 };
  }
  if (/\btonight\b/i.test(raw)) {
    return { hours: 20, minutes: 0 };
  }

  return { hours: 9, minutes: 0 };
}

function applyTime(date: Date, phrase: string) {
  const { hours, minutes } = parseClockTime(phrase);
  date.setHours(hours, minutes, 0, 0);
  return date;
}

function dateFromMonthNameMatch(match: RegExpMatchArray) {
  const month = monthIndex(match[1]);
  const day = Number(match[2]);
  const explicitYear = match[3] ? normalizeYear(Number(match[3])) : null;

  return dateFromParts(day, month, explicitYear);
}

function dateFromDayMonthNameMatch(match: RegExpMatchArray) {
  const day = Number(match[1]);
  const month = monthIndex(match[2]);
  const explicitYear = match[3] ? normalizeYear(Number(match[3])) : null;

  return dateFromParts(day, month, explicitYear);
}

function dateFromParts(day: number, month: number, explicitYear: number | null) {
  const today = startOfToday();
  const year = explicitYear ?? today.getFullYear();
  const date = new Date(year, month, day);

  if (!isValidDateParts(date, year, month, day)) {
    return null;
  }

  if (!explicitYear && date < today) {
    date.setFullYear(date.getFullYear() + 1);
  }

  return date;
}

function dateFromNumericDateMatch(match: RegExpMatchArray) {
  const day = Number(match[1]);
  const month = Number(match[2]) - 1;
  const today = startOfToday();
  const year = match[3] ? normalizeYear(Number(match[3])) : today.getFullYear();
  const date = new Date(year, month, day);

  if (!isValidDateParts(date, year, month, day)) {
    return null;
  }

  if (!match[3] && date < today) {
    date.setFullYear(date.getFullYear() + 1);
  }

  return date;
}

function monthIndex(month: string) {
  return ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'].findIndex(
    value => month.toLowerCase().startsWith(value)
  );
}

function normalizeYear(year: number) {
  return year < 100 ? 2000 + year : year;
}

function isValidDateParts(date: Date, year: number, month: number, day: number) {
  return date.getFullYear() === year && date.getMonth() === month && date.getDate() === day;
}

function hasExplicitTime(phrase: string) {
  return /\b(morning|afternoon|evening|tonight|night)\b/i.test(phrase) || /\b(?:at\s+)?\d{1,2}(?::\d{2})?\s*(?:am|pm)\b/i.test(phrase) || /\bat\s+\d{1,2}(?::\d{2})?\b/i.test(phrase) || /\b\d{1,2}:\d{2}\b/.test(phrase);
}

function detectedTime(date: Date, matchedText: string, dateIntent: FieldIntent, timeIntent: FieldIntent): DetectedTime {
  return {
    date,
    dateIntent,
    matchedText,
    timeIntent,
  };
}

function applyRelativeDate(date: Date, key: string) {
  const normalizedKey = key.toLowerCase();
  if (normalizedKey === 'tomorrow' || normalizedKey === 'tmr') {
    date.setDate(date.getDate() + 1);
  }
}

function detectReminder(text: string): DetectedTime | null {
  const today = startOfToday();
  const recurrenceTimeMatch = text.match(
    /\b(?:daily|weekly|monthly|every day|each day|every week|each week|every month|each month)\s+(?:at\s+)?\d{1,2}(?::\d{2})?\s*(?:am|pm)?\b/i
  );

  if (recurrenceTimeMatch?.[0]) {
    const date = applyFloatingTime(new Date(today), recurrenceTimeMatch[0]);

    return detectedTime(date, recurrenceTimeMatch[0], 'inferred', 'explicit');
  }

  const timeBeforeRelativeMatch = text.match(
    /\b(?:at\s+)?\d{1,2}(?::\d{2})?\s*(?:am|pm)\s+(today|tomorrow|tmr)\b|\b\d{1,2}:\d{2}\s+(today|tomorrow|tmr)\b/i
  );
  if (timeBeforeRelativeMatch?.[0]) {
    const date = new Date(today);
    applyRelativeDate(date, timeBeforeRelativeMatch[1] ?? timeBeforeRelativeMatch[2]);
    applyTime(date, timeBeforeRelativeMatch[0]);

    return detectedTime(date, timeBeforeRelativeMatch[0], 'explicit', 'explicit');
  }

  const relativeMatch = text.match(
    /\b(today|tomorrow|tmr|tonight)(?:\s+(?:morning|afternoon|evening|night|at\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)?|\d{1,2}(?::\d{2})?\s*(?:am|pm)))?/i
  );

  if (relativeMatch?.[0]) {
    const date = new Date(today);
    const key = relativeMatch[1].toLowerCase();
    applyRelativeDate(date, key);
    applyTime(date, relativeMatch[0]);

    return detectedTime(date, relativeMatch[0], 'explicit', hasExplicitTime(relativeMatch[0]) ? 'explicit' : 'inferred');
  }

  const inDaysMatch = text.match(
    /\bin\s+(\d+)\s+days?(?:\s+(?:morning|afternoon|evening|tonight|night|at\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)?|\d{1,2}(?::\d{2})?\s*(?:am|pm)))?/i
  );
  if (inDaysMatch?.[0]) {
    const date = new Date(today);
    date.setDate(date.getDate() + Number(inDaysMatch[1]));
    applyTime(date, inDaysMatch[0]);

    return detectedTime(date, inDaysMatch[0], 'explicit', hasExplicitTime(inDaysMatch[0]) ? 'explicit' : 'inferred');
  }

  const dayMonthNameMatch = text.match(
    /\b(\d{1,2})(?:st|nd|rd|th)?\s+(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\.?(?:,?\s+(\d{2,4}))?(?:\s+(?:morning|afternoon|evening|tonight|night|at\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)?|\d{1,2}(?::\d{2})?\s*(?:am|pm)))?\b/i
  );
  if (dayMonthNameMatch?.[0]) {
    const date = dateFromDayMonthNameMatch(dayMonthNameMatch);
    if (date) {
      applyTime(date, dayMonthNameMatch[0]);

      return detectedTime(date, dayMonthNameMatch[0], 'explicit', hasExplicitTime(dayMonthNameMatch[0]) ? 'explicit' : 'inferred');
    }
  }

  const monthNameMatch = text.match(
    /\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\.?\s+(\d{1,2})(?:st|nd|rd|th)?(?:,?\s+(\d{2,4}))?(?:\s+(?:morning|afternoon|evening|tonight|night|at\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)?|\d{1,2}(?::\d{2})?\s*(?:am|pm)))?\b/i
  );
  if (monthNameMatch?.[0]) {
    const date = dateFromMonthNameMatch(monthNameMatch);
    if (date) {
      applyTime(date, monthNameMatch[0]);

      return detectedTime(date, monthNameMatch[0], 'explicit', hasExplicitTime(monthNameMatch[0]) ? 'explicit' : 'inferred');
    }
  }

  const numericDateMatch = text.match(
    /\b(\d{1,2})[/-](\d{1,2})(?:[/-](\d{2,4}))?(?:\s+(?:morning|afternoon|evening|tonight|night|at\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)?|\d{1,2}(?::\d{2})?\s*(?:am|pm)))?\b/i
  );
  if (numericDateMatch?.[0]) {
    const date = dateFromNumericDateMatch(numericDateMatch);
    if (date) {
      applyTime(date, numericDateMatch[0]);

      return detectedTime(date, numericDateMatch[0], 'explicit', hasExplicitTime(numericDateMatch[0]) ? 'explicit' : 'inferred');
    }
  }

  const weekdayMatch = text.match(
    /\b(mon(?:day)?|tue(?:sday)?|wed(?:nesday)?|thu(?:rsday)?|fri(?:day)?|sat(?:urday)?|sun(?:day)?)\b(?:\s+(?:morning|afternoon|evening|tonight|night|at\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)?|\d{1,2}(?::\d{2})?\s*(?:am|pm)))?/i
  );
  if (weekdayMatch?.[0]) {
    const weekdays = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const target = weekdays.findIndex(day => weekdayMatch[1].toLowerCase().startsWith(day));
    const date = new Date(today);
    const daysUntil = (target - date.getDay() + 7) % 7 || 7;
    date.setDate(date.getDate() + daysUntil);
    applyTime(date, weekdayMatch[0]);

    return detectedTime(date, weekdayMatch[0], 'explicit', hasExplicitTime(weekdayMatch[0]) ? 'explicit' : 'inferred');
  }

  const timeOfDayMatch = text.match(/\b(afternoon|evening|tonight)\b/i);
  if (timeOfDayMatch?.[0]) {
    const date = applyFloatingTime(new Date(today), timeOfDayMatch[0]);

    return detectedTime(date, timeOfDayMatch[0], 'inferred', 'explicit');
  }

  const timeOnlyMatch = text.match(/\bat\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)?\b/i);
  if (timeOnlyMatch?.[0]) {
    const date = applyFloatingTime(new Date(today), timeOnlyMatch[0]);

    return detectedTime(date, timeOnlyMatch[0], 'inferred', 'explicit');
  }

  const bareTimeMatch = text.match(/\b(?:[01]?\d|2[0-3])(?::[0-5]\d)\s*(?:am|pm)?\b|\b\d{1,2}\s*(?:am|pm)\b/i);
  if (bareTimeMatch?.[0]) {
    const date = applyFloatingTime(new Date(today), bareTimeMatch[0]);

    return detectedTime(date, bareTimeMatch[0], 'inferred', 'explicit');
  }

  return null;
}

function applyFloatingTime(date: Date, phrase: string) {
  const now = new Date();
  const explicitMeridiem = /\b(am|pm)\b/i.test(phrase);
  const clockMatch = phrase.match(/\b(\d{1,2})(?::(\d{2}))?/);

  if (!clockMatch || explicitMeridiem) {
    applyTime(date, phrase);
    if (date <= now) {
      date.setDate(date.getDate() + 1);
    }
    return date;
  }

  const hour = Number(clockMatch[1]);
  const minutes = Number(clockMatch[2] ?? 0);
  date.setHours(hour, minutes, 0, 0);

  if (date <= now && hour + 12 < 24) {
    date.setHours(hour + 12, minutes, 0, 0);
  }
  if (date <= now) {
    date.setDate(date.getDate() + 1);
    date.setHours(hour, minutes, 0, 0);
  }

  return date;
}

function detectRecurrence(text: string): Pick<
  ParsedTaskInput,
  'recurrence' | 'recurrenceLabel' | 'recurrenceMatchedText'
> {
  const recurrencePatterns: {
    recurrence: Recurrence;
    label: string;
    regex: RegExp;
  }[] = [
    {
      recurrence: 'daily',
      label: 'Repeats daily',
      regex: /\b(every day|daily|each day)(?:\s+(?:at\s+)?\d{1,2}(?::\d{2})?\s*(?:am|pm)?)?\b/i,
    },
    {
      recurrence: 'weekly',
      label: 'Repeats weekly',
      regex:
        /\b(every week|weekly|each week|every (?:mon(?:day)?|tue(?:sday)?|wed(?:nesday)?|thu(?:rsday)?|fri(?:day)?|sat(?:urday)?|sun(?:day)?))\b(?:\s+(?:at\s+)?\d{1,2}(?::\d{2})?\s*(?:am|pm)?)?/i,
    },
    {
      recurrence: 'monthly',
      label: 'Repeats monthly',
      regex: /\b(every month|monthly|each month)(?:\s+(?:at\s+)?\d{1,2}(?::\d{2})?\s*(?:am|pm)?)?\b/i,
    },
  ];

  for (const pattern of recurrencePatterns) {
    const match = text.match(pattern.regex);
    if (match?.[0]) {
      return {
        recurrence: pattern.recurrence,
        recurrenceLabel: pattern.label,
        recurrenceMatchedText: match[0],
      };
    }
  }

  return {
    recurrence: 'none',
    recurrenceLabel: null,
    recurrenceMatchedText: null,
  };
}

export function parseTaskInput(text: string): ParsedTaskInput {
  const recurrence = detectRecurrence(text);
  const detectedReminder = detectReminder(text) ?? getDefaultRepeatReminder(recurrence.recurrence);
  const reminderLabelParts = getReminderLabelParts(detectedReminder);

  return {
    detectedReminder,
    reminderLabel: reminderLabelParts.join(' · ') || null,
    reminderLabelParts,
    ...recurrence,
  };
}

function getDefaultRepeatReminder(recurrence: Recurrence): DetectedTime | null {
  if (recurrence === 'none') {
    return null;
  }

  const date = startOfToday();
  date.setHours(9, 0, 0, 0);

  return {
    date,
    dateIntent: 'inferred',
    matchedText: '',
    timeIntent: 'default',
  };
}

export function getReminderLabelParts(reminder: DetectedTime | null) {
  if (!reminder) {
    return [];
  }

  const showDate = reminder.dateIntent !== 'default' || reminder.timeIntent === 'explicit';
  const showTime = reminder.timeIntent === 'explicit';

  if (!showDate && !showTime) {
    return [];
  }

  const parts: string[] = [];
  const dateLabel = formatDisplayDate(reminder.date);
  if (showDate) {
    parts.push(dateLabel);
  }
  if (showTime) {
    parts.push(formatTime(reminder.date));
  }

  return parts;
}

export function splitReminderLabel(label: string | null) {
  return label?.split(' · ').filter(Boolean) ?? [];
}

export function formatDisplayDate(date: Date) {
  const now = new Date();
  const tomorrow = startOfToday();
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (isSameDate(date, now)) {
    return 'Today';
  }
  if (isSameDate(date, tomorrow)) {
    return 'Tomorrow';
  }

  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export function formatTime(date: Date) {
  return date
    .toLocaleTimeString([], { hour: 'numeric', hour12: true, minute: '2-digit' })
    .replace(/\s?(am|pm)$/i, match => match.toUpperCase());
}

export function formatDueDate(value: string | null) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return `${formatDisplayDate(date)} · ${formatTime(date)}`;
}

function isSameDate(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function cleanTaskTitle(title: string, parsedInput: ParsedTaskInput) {
  const matchedTexts = [parsedInput.detectedReminder?.matchedText, parsedInput.recurrenceMatchedText].filter(
    (value): value is string => Boolean(value)
  );

  return matchedTexts
    .reduce((current, matchedText) => current.replace(new RegExp(escapeRegExp(matchedText), 'i'), ''), title)
    .replace(/\s+/g, ' ')
    .replace(/\s+[,.-]$/, '')
    .trim();
}

export function getHighlightedSegments(text: string, parsedInput: ParsedTaskInput) {
  const matches = [parsedInput.detectedReminder?.matchedText, parsedInput.recurrenceMatchedText].filter(
    (value): value is string => Boolean(value)
  );
  const ranges: { start: number; end: number }[] = [];
  const lowerText = text.toLowerCase();

  for (const match of matches) {
    const start = lowerText.indexOf(match.toLowerCase());
    const end = start + match.length;
    const overlapsExistingRange = ranges.some(range => start < range.end && end > range.start);

    if (start >= 0 && !overlapsExistingRange) {
      ranges.push({ start, end });
    }
  }

  ranges.sort((a, b) => a.start - b.start);

  if (ranges.length === 0) {
    return [];
  }

  const segments: { highlighted: boolean; index: number; text: string }[] = [];
  let cursor = 0;

  for (const range of ranges) {
    if (range.start > cursor) {
      segments.push({ highlighted: false, index: cursor, text: text.slice(cursor, range.start) });
    }

    segments.push({ highlighted: true, index: range.start, text: text.slice(range.start, range.end) });
    cursor = range.end;
  }

  if (cursor < text.length) {
    segments.push({ highlighted: false, index: cursor, text: text.slice(cursor) });
  }

  return segments;
}

export function isDueAtOverdue(dueAt: string | null) {
  if (!dueAt) {
    return false;
  }

  return new Date(dueAt).getTime() < Date.now();
}

export function isTaskOverdue(task: Task) {
  if (task.completed || !task.dueAt) {
    return false;
  }

  return isDueAtOverdue(task.dueAt);
}

export function mergeEditedReminder(task: Task, parsedDraft: ParsedTaskInput) {
  const reminder = parsedDraft.detectedReminder;
  if (!reminder) {
    return {
      dueAt: task.dueAt,
      dueLabel: task.dueLabel ?? null,
    };
  }

  const date = new Date(reminder.date);
  if (task.dueAt && reminder.dateIntent !== 'default' && reminder.timeIntent !== 'explicit') {
    const previousDate = new Date(task.dueAt);
    date.setHours(previousDate.getHours(), previousDate.getMinutes(), 0, 0);
  }

  const labelParts = getReminderLabelParts({ ...reminder, date });

  return {
    dueAt: date.toISOString(),
    dueLabel: labelParts.join(' · ') || null,
  };
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
