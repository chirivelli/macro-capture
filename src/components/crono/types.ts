export type CronoList = {
  id: string;
  name: string;
  color: string;
};

export type Recurrence = 'none' | 'daily' | 'weekly' | 'monthly';

export type Task = {
  id: string;
  title: string;
  listId: string;
  completed: boolean;
  dueAt: string | null;
  dueLabel?: string | null;
  recurrence: Recurrence;
  notificationId?: string;
};

export type FieldIntent = 'default' | 'explicit' | 'inferred';

export type DetectedTime = {
  date: Date;
  dateIntent: FieldIntent;
  matchedText: string;
  timeIntent: FieldIntent;
};

export type ParsedTaskInput = {
  detectedReminder: DetectedTime | null;
  reminderLabel: string | null;
  reminderLabelParts: string[];
  recurrence: Recurrence;
  recurrenceLabel: string | null;
  recurrenceMatchedText: string | null;
};

export type TaskInput = {
  listId: string;
  title: string;
  dueAt: string | null;
  dueLabel: string | null;
  recurrence: Recurrence;
};

export type TaskUpdateInput = {
  title: string;
  dueAt: string | null;
  dueLabel: string | null;
  recurrence: Recurrence;
};
