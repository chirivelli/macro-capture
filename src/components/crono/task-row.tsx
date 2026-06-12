import { useMemo, useRef, useState } from 'react';

import { Pressable, Text, View } from '@/tw';
import { cn } from '@/utils/cn';

import { HighlightedTaskInput } from './highlighted-task-input';
import {
  cleanTaskTitle,
  formatDueDate,
  isDueAtOverdue,
  isTaskOverdue,
  mergeEditedReminder,
  parseTaskInput,
  splitReminderLabel,
} from './task-parser';
import type { Recurrence, Task } from './types';

export function TaskRow({
  task,
  onDelete,
  onToggle,
  onUpdate,
}: {
  task: Task;
  onDelete: (task: Task) => Promise<void>;
  onToggle: (task: Task) => void;
  onUpdate: (task: Task, input: { title: string; dueAt: string | null; dueLabel: string | null; recurrence: Recurrence }) => Promise<void>;
}) {
  const isSubmittingSmartEdit = useRef(false);
  const dueLabel = task.dueLabel !== undefined ? task.dueLabel : formatDueDate(task.dueAt);
  const overdue = isTaskOverdue(task);
  const [isEditing, setIsEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState(task.title);
  const parsedDraft = useMemo(() => parseTaskInput(draftTitle), [draftTitle]);
  const previewReminder = mergeEditedReminder(task, parsedDraft);
  const editingDueLabel = previewReminder.dueLabel ?? dueLabel;
  const editingDueLabelParts = parsedDraft.detectedReminder ? splitReminderLabel(previewReminder.dueLabel) : splitReminderLabel(editingDueLabel);
  const editingRecurrence = parsedDraft.recurrence !== 'none' ? parsedDraft.recurrence : task.recurrence;
  const editingOverdue = isDueAtOverdue(previewReminder.dueAt);

  function startEditing() {
    setDraftTitle(task.title);
    setIsEditing(true);
  }

  async function saveSmartEdit() {
    const title = cleanTaskTitle(draftTitle, parsedDraft);
    if (!title) {
      setDraftTitle(task.title);
      setIsEditing(false);
      return;
    }

    isSubmittingSmartEdit.current = true;
    await onUpdate(task, {
      title,
      dueAt: previewReminder.dueAt,
      dueLabel: previewReminder.dueLabel,
      recurrence: parsedDraft.recurrence === 'none' ? task.recurrence : parsedDraft.recurrence,
    });
    isSubmittingSmartEdit.current = false;
    setIsEditing(false);
  }

  async function savePlainEdit() {
    if (isSubmittingSmartEdit.current) {
      return;
    }

    const title = draftTitle.trim();
    if (!title) {
      setDraftTitle(task.title);
      setIsEditing(false);
      return;
    }

    await onUpdate(task, {
      title,
      dueAt: task.dueAt,
      dueLabel: task.dueLabel ?? null,
      recurrence: task.recurrence,
    });
    setIsEditing(false);
  }

  return (
    <View className="mb-2 flex-row items-start gap-3 rounded-lg border border-gray-200 bg-white p-3">
      <Pressable
        onPress={() => onToggle(task)}
        className={cn(
          'mt-px h-[22px] w-[22px] items-center justify-center rounded-[10px] border-[1.5px]',
          task.completed ? 'border-gray-900 bg-gray-900' : 'border-gray-400'
        )}>
        {task.completed && <Text className="text-[13px] font-bold text-white">✓</Text>}
      </Pressable>
      <View className="flex-1">
        {isEditing ? (
          <>
            <HighlightedTaskInput
              autoFocus
              value={draftTitle}
              onBlur={savePlainEdit}
              onChangeText={setDraftTitle}
              onSubmitEditing={saveSmartEdit}
              parsedInput={parsedDraft}
              className="min-h-5 p-0 text-base font-medium leading-5 text-gray-900"
            />
            {(editingDueLabel || editingRecurrence !== 'none') && (
              <View className="mt-1.5 flex-row flex-wrap gap-2">
                {editingDueLabelParts.map(part => (
                  <Text
                    key={part}
                    className={cn(
                      'overflow-hidden rounded-lg bg-gray-100 px-2 py-1 text-[13px] text-gray-600',
                      editingOverdue && 'text-red-600'
                    )}>
                    {part}
                  </Text>
                ))}
                {editingRecurrence !== 'none' && (
                  <Text className="overflow-hidden rounded-lg bg-gray-100 px-2 py-1 text-[13px] text-gray-600">
                    Repeats {editingRecurrence}
                  </Text>
                )}
              </View>
            )}
          </>
        ) : (
          <Pressable onPress={startEditing}>
            <Text className={cn('text-base font-medium leading-5 text-gray-900', task.completed && 'text-gray-400 line-through')}>
              {task.title}
            </Text>
            {(dueLabel || task.recurrence !== 'none') && (
              <Text
                className="mt-1 text-[13px] leading-[18px] text-gray-500"
                accessibilityLabel={[dueLabel, task.recurrence !== 'none' ? task.recurrence : null].filter(Boolean).join(' · ')}>
                {dueLabel && <Text className={overdue ? 'text-red-600' : undefined}>{dueLabel}</Text>}
                {dueLabel && task.recurrence !== 'none' && <Text> · </Text>}
                {task.recurrence !== 'none' && <Text>{task.recurrence}</Text>}
              </Text>
            )}
          </Pressable>
        )}
      </View>
      <Pressable accessibilityLabel={`Delete ${task.title}`} onPress={() => onDelete(task)} className="rounded-lg px-2 py-1">
        <Text className="text-[13px] font-semibold text-gray-400">Delete</Text>
      </Pressable>
    </View>
  );
}
