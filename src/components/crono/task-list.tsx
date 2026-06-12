import { Link, ScrollView, Text, View } from '@/tw';

import { useCrono } from './crono-context';
import { InlineTaskComposer } from './inline-task-composer';
import { TaskRow } from './task-row';
import type { CronoList } from './types';

export function TaskList({ list, showListsLink = false }: { list: CronoList; showListsLink?: boolean }) {
  const { tasks, addTask, updateTask, deleteTask, toggleTask } = useCrono();
  const activeTasks = tasks.filter(task => task.listId === list.id && !task.completed);
  const completedTasks = tasks.filter(task => task.listId === list.id && task.completed);

  return (
    <View className="min-w-0 flex-1 pt-2.5">
      {showListsLink && (
        <Link href="/lists" className="mb-3 self-start text-[15px] font-semibold text-blue-600">
          Lists
        </Link>
      )}
      <View className="mb-2 flex-row items-center justify-between">
        <Text className="text-[32px] font-bold text-gray-900">{list.name}</Text>
        <Text className="text-sm text-gray-500">
          {activeTasks.length} {activeTasks.length === 1 ? 'task' : 'tasks'}
        </Text>
      </View>

      <ScrollView contentContainerClassName="pb-8" showsVerticalScrollIndicator={false}>
        <InlineTaskComposer listId={list.id} onAddTask={addTask} />

        {activeTasks.length === 0 ? (
          <Text className="py-6 text-center text-[15px] text-gray-400">No tasks in this list.</Text>
        ) : (
          activeTasks.map(task => (
            <TaskRow
              key={task.id}
              task={task}
              onDelete={deleteTask}
              onToggle={toggleTask}
              onUpdate={updateTask}
            />
          ))
        )}

        {completedTasks.length > 0 && (
          <>
            <Text className="mb-2 mt-[18px] text-[13px] font-bold uppercase text-gray-500">Completed</Text>
            {completedTasks.map(task => (
              <TaskRow
                key={task.id}
                task={task}
                onDelete={deleteTask}
                onToggle={toggleTask}
                onUpdate={updateTask}
              />
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}
