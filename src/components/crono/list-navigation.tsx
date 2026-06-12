import { useState } from 'react';

import { Link, Pressable, ScrollView, Text, TextInput, View } from '@/tw';
import { cn } from '@/utils/cn';

import type { CronoList, Task } from './types';

export function ListNavigation({
  lists,
  tasks,
  selectedListId,
  onCreateList,
  showSidebar,
}: {
  lists: CronoList[];
  tasks: Task[];
  selectedListId: string;
  onCreateList: (name: string) => void;
  showSidebar: boolean;
}) {
  const [newListName, setNewListName] = useState('');

  function submitList() {
    onCreateList(newListName);
    setNewListName('');
  }

  return (
    <View className={cn('gap-3', showSidebar ? 'mb-0 w-[280px] border-r border-gray-200 bg-gray-100 p-5' : 'mb-[18px] shrink-0')}>
      <Text className="text-[34px] font-bold tracking-normal text-gray-900">Crono</Text>

      <ScrollView
        horizontal={!showSidebar}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        contentContainerClassName={showSidebar ? 'gap-2 pb-1' : 'gap-2'}>
        {lists.map(list => {
          const selected = list.id === selectedListId;
          const count = tasks.filter(task => task.listId === list.id && !task.completed).length;

          return (
            <Link key={list.id} href={`/lists/${list.id}`} asChild>
              <Pressable
                className={cn(
                  'min-h-12 min-w-[148px] flex-row items-center gap-2.5 rounded-lg border bg-white px-3 py-2.5',
                  selected ? 'border-gray-900' : 'border-gray-200'
                )}>
                <View className="h-2.5 w-2.5 rounded-lg" style={{ backgroundColor: list.color }} />
                <Text className={cn('flex-1 text-[15px] font-semibold', selected ? 'text-gray-900' : 'text-gray-500')}>
                  {list.name}
                </Text>
                <Text className="text-base font-bold text-gray-900">{count}</Text>
              </Pressable>
            </Link>
          );
        })}
      </ScrollView>

      <View className="flex-row gap-2">
        <TextInput
          value={newListName}
          onChangeText={setNewListName}
          onSubmitEditing={submitList}
          placeholder="New list"
          placeholderTextColor="#9ca3af"
          returnKeyType="done"
          className="min-h-[42px] flex-1 rounded-lg border border-gray-200 bg-white px-3 text-[15px] text-gray-900"
        />
        <Pressable onPress={submitList} className="h-[42px] w-[42px] items-center justify-center rounded-lg bg-gray-900">
          <Text className="text-2xl font-semibold leading-[26px] text-white">+</Text>
        </Pressable>
      </View>
    </View>
  );
}
