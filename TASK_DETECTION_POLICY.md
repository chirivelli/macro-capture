# Task Detection Policy

Crono parses task text into fields. Each field has a default value. A field should only be displayed when it is explicit or inferred.

## Core Model

| Field | Default value | Explicit when | Inferred when |
|---|---|---|---|
| Date | None | The user types a date/day: `today`, `tmr`, `sunday`, `june 13`, `27/6/26` | The user types a time without a date, or only repeat text; repeat-only text infers Today |
| Time | None | The user types a time: `7pm`, `19:30`, `at 7` | None for now; when date or repeat exists without a typed time, Crono stores the default reminder time, currently 9:00 AM, but the time field remains default for display |
| Repeat | None | The user types repeat text: `daily`, `weekly`, `monthly`, `every monday` | None for now |

If a field is not explicit or inferred, it is at its default value and does not need to be displayed.

## Detection Table

| Example text | Date field | Time field | Repeat field | Display |
|---|---|---|---|---|
| `buy milk` | Default: None | Default: None | Default: None | Nothing detected |
| `today` | Explicit: Today | Inferred: 9:00 AM | Default: None | `Today` |
| `today 7pm` | Explicit: Today | Explicit: 7:00 PM | Default: None | `Today · 7:00 PM` |
| `tomorrow / tmr` | Explicit: Tomorrow | Inferred: 9:00 AM | Default: None | `Tomorrow` |
| `tmr 7pm` | Explicit: Tomorrow | Explicit: 7:00 PM | Default: None | `Tomorrow · 7:00 PM` |
| `afternoon` | Inferred: today if 12:00 PM is later, else tomorrow | Explicit: 12:00 PM inferred from word meaning | Default: None | Date · `12:00 PM` |
| `evening` | Inferred: today if 5:00 PM is later, else tomorrow | Explicit: 5:00 PM inferred from word meaning | Default: None | Date · `5:00 PM` |
| `tonight` | Explicit: Today | Explicit: 8:00 PM inferred from word meaning | Default: None | `Today · 8:00 PM` |
| `7pm` | Inferred: today if later, else tomorrow | Explicit: 7:00 PM | Default: None | Date · `7:00 PM` |
| `7:30pm` | Inferred: today if later, else tomorrow | Explicit: 7:30 PM | Default: None | Date · `7:30 PM` |
| `19:30` | Inferred: today if later, else tomorrow | Explicit: 7:30 PM | Default: None | Date · `7:30 PM` |
| `at 7` | Inferred: next sensible occurrence | Explicit: 7:00 AM or 7:00 PM | Default: None | Date + time |
| `sunday` | Explicit: next Sunday | Inferred: 9:00 AM | Default: None | `Sunday` |
| `friday 9am` | Explicit: next Friday | Explicit: 9:00 AM | Default: None | `Friday · 9:00 AM` |
| `june 13` | Explicit: June 13 this year, else next year | Inferred: 9:00 AM | Default: None | `Jun 13` |
| `June 13 7pm` | Explicit: June 13 this year, else next year | Explicit: 7:00 PM | Default: None | `Jun 13 · 7:00 PM` |
| `June 13 afternoon` | Explicit: June 13 this year, else next year | Explicit: 12:00 PM inferred from word meaning | Default: None | `Jun 13 · 12:00 PM` |
| `June 13 evening` | Explicit: June 13 this year, else next year | Explicit: 5:00 PM inferred from word meaning | Default: None | `Jun 13 · 5:00 PM` |
| `14 Jun` | Explicit: June 14 this year, else next year | Inferred: 9:00 AM | Default: None | `Jun 14` |
| `14 Jun 7pm` | Explicit: June 14 this year, else next year | Explicit: 7:00 PM | Default: None | `Jun 14 · 7:00 PM` |
| `27/6/26` | Explicit: 27 June 2026 | Inferred: 9:00 AM | Default: None | `Jun 27, 2026` |
| `9/7/26` | Explicit: 9 July 2026 | Inferred: 9:00 AM | Default: None | `Jul 9, 2026` |
| `09/07/2026 7pm` | Explicit: 9 July 2026 | Explicit: 7:00 PM | Default: None | `Jul 9, 2026 · 7:00 PM` |
| `in 3 days` | Explicit: today + 3 days | Inferred: 9:00 AM | Default: None | Date |
| `in 3 days at 8am` | Explicit: today + 3 days | Explicit: 8:00 AM | Default: None | Date · `8:00 AM` |
| `in 3 days 7pm` | Explicit: today + 3 days | Explicit: 7:00 PM | Default: None | Date · `7:00 PM` |
| `daily` | Inferred: Today | Default: 9:00 AM stored internally | Explicit: daily | `Today` · `Repeats daily` |
| `every day 7pm` | Inferred: today if later, else tomorrow | Explicit: 7:00 PM | Explicit: daily | Date · `7:00 PM` · `Repeats daily` |
| `weekly` | Inferred: Today | Default: 9:00 AM stored internally | Explicit: weekly | `Today` · `Repeats weekly` |
| `weekly 7pm` | Inferred: today if later, else tomorrow | Explicit: 7:00 PM | Explicit: weekly | Date · `7:00 PM` · `Repeats weekly` |
| `every monday` | Explicit: next Monday | Inferred: 9:00 AM | Explicit: weekly | `Monday` · `Repeats weekly` |
| `every sunday at 7pm` | Explicit: next Sunday | Explicit: 7:00 PM | Explicit: weekly | `Sunday · 7:00 PM` · `Repeats weekly` |
| `monthly` | Inferred: Today | Default: 9:00 AM stored internally | Explicit: monthly | `Today` · `Repeats monthly` |
| `monthly 19:30` | Inferred: today if later, else tomorrow | Explicit: 7:30 PM | Explicit: monthly | Date · `7:30 PM` · `Repeats monthly` |
| `tmr daily at 6` | Explicit: Tomorrow | Explicit: 6:00 PM | Explicit: daily | `Tomorrow · 6:00 PM` · `Repeats daily` |

## Notes

- Numeric dates use `day/month/year`.
- Two-digit years map to the 2000s, so `27/6/26` means June 27, 2026.
- Yearless month-name dates support both `June 13` and `13 June`, and roll forward to next year if the date already passed this year.
- Full weekdays such as `sunday` choose the next matching weekday.
- Time-of-day words such as `afternoon` and `evening` can be used alone or with an explicit date.
- Default fields are not displayed.
- Default time, currently 9:00 AM, is used for scheduling but is not displayed unless the user typed a time explicitly.
- If all fields are default, no reminder notification is scheduled.

## Interaction Rules

| Interaction | Detection behavior | Save behavior | Display behavior |
|---|---|---|---|
| Type in the `New reminder` input | Highlight detected date/time/repeat text inline while typing | Pressing Enter creates a smart task using detected fields | Date, time, and repeat preview as separate pills |
| Click away from `New reminder` after typing | Detection preview can be visible while typing | Blur creates a plain task with the text exactly as typed | No detected date/time/repeat is applied |
| Click an existing task | Existing task becomes editable inline | No save happens until blur or Enter | Existing date/time/repeat can show as pills while editing |
| Click away from an existing task after typing | Detection preview can be visible while typing | Blur saves the text exactly as typed and preserves existing date/time/repeat | Preview pills are not applied on blur |
| Press Enter while editing an existing task | Detected text is highlighted inline | Enter applies detected date/time/repeat and removes detected text from the title | Saved metadata uses `Date · Time · Repeat` |
| Type a new explicit time while editing an existing task, e.g. `9pm` | The typed time is highlighted inline | Pressing Enter changes the task time to the typed time | Preview pills use the newly parsed due date/time, including overdue color only if the new value is overdue |
| Type a new date without a time while editing a task that already has a time, e.g. `tmr` | The typed date is highlighted inline | Pressing Enter changes the task date and preserves the existing time | Example: `Today · 7:00 AM` edited with `tmr` becomes `Tomorrow · 7:00 AM` |
| Type a new date and time while editing an existing task | Both date and time are highlighted inline | Pressing Enter replaces both date and time | Saved metadata uses `Date · Time` |
| Type repeat text while editing an existing task | Repeat text is highlighted inline | Pressing Enter replaces repeat policy only when a repeat is detected | Repeat displays as its own field after date/time |
