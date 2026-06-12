import { useMemo, useRef, useState } from 'react';

import { Text, View } from '@/tw';
import { cn } from '@/utils/cn';

import { HighlightedTaskInput } from './highlighted-task-input';
import { cleanTaskTitle, parseTaskInput } from './task-parser';
import type { Recurrence } from './types';

export function InlineTaskComposer({
  listId,
  onAddTask,
}: {
  listId: string;
  onAddTask: (input: { listId: string; title: string; dueAt: string | null; dueLabel: string | null; recurrence: Recurrence }) => Promise<void>;
}) {
  const isSubmittingSmartTask = useRef(false);
  const [taskTitle, setTaskTitle] = useState('');
  const parsedInput = useMemo(() => parseTaskInput(taskTitle), [taskTitle]);

  async function submitTask() {
    const title = cleanTaskTitle(taskTitle, parsedInput);
    if (!title) {
      return;
    }

    isSubmittingSmartTask.current = true;
    await onAddTask({
      listId,
      title,
      dueAt: parsedInput.detectedReminder?.date.toISOString() ?? null,
      dueLabel: parsedInput.reminderLabel,
      recurrence: parsedInput.recurrence,
    });
    isSubmittingSmartTask.current = false;
    setTaskTitle('');
  }

  async function commitPlainTask() {
    if (isSubmittingSmartTask.current) {
      return;
    }

    const title = taskTitle.trim();
    if (!title) {
      return;
    }

    await onAddTask({
      listId,
      title,
      dueAt: null,
      dueLabel: null,
      recurrence: 'none',
    });
    setTaskTitle('');
  }

  return (
    <View
      className={cn(
        'mb-2.5 flex-row items-start gap-3 rounded-lg border bg-white p-3',
        taskTitle.length === 0 ? 'border-dashed border-slate-300' : 'border-gray-200'
      )}>
      <View className="mt-px h-[22px] w-[22px] items-center justify-center rounded-[10px] border-[1.5px] border-gray-400" />
      <View className="flex-1">
        <HighlightedTaskInput
          value={taskTitle}
          onBlur={commitPlainTask}
          onChangeText={setTaskTitle}
          onSubmitEditing={submitTask}
          placeholder="New reminder"
          parsedInput={parsedInput}
          className="min-h-6 p-0 text-[17px] text-gray-900"
        />
        {(parsedInput.detectedReminder || parsedInput.recurrenceLabel) && (
          <View className="mt-1.5 flex-row flex-wrap gap-2">
            {parsedInput.reminderLabelParts.map(part => (
              <Text key={part} className="overflow-hidden rounded-lg bg-gray-100 px-2 py-1 text-[13px] text-gray-600">{part}</Text>
            ))}
            {parsedInput.recurrenceLabel && (
              <Text className="overflow-hidden rounded-lg bg-gray-100 px-2 py-1 text-[13px] text-gray-600">
                {parsedInput.recurrenceLabel}
              </Text>
            )}
          </View>
        )}
      </View>
    </View>
  );
}
