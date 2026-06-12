import { router } from 'expo-router';
import { useState } from 'react';

import { Pressable, SafeAreaView, ScrollView, Text, TextInput, View } from '@/tw';

import { useCrono } from './crono-context';

export function CronoListsPage() {
  const { lists, tasks, addList } = useCrono();
  const [newListName, setNewListName] = useState('');

  function createList() {
    const trimmed = newListName.trim();
    if (!trimmed) {
      return;
    }

    const list = addList(trimmed);
    setNewListName('');
    router.push(`/lists/${list.id}`);
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <ScrollView contentContainerClassName="gap-5 px-5 py-3" showsVerticalScrollIndicator={false}>
        <Text className="text-[34px] font-bold tracking-normal text-gray-900">Crono</Text>

        <View className="gap-2">
          {lists.map(list => {
            const count = tasks.filter(task => task.listId === list.id && !task.completed).length;

            return (
              <Pressable
                key={list.id}
                onPress={() => router.push(`/lists/${list.id}`)}
                className="min-h-14 flex-row items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3">
                <View className="h-2.5 w-2.5 rounded-lg" style={{ backgroundColor: list.color }} />
                <Text className="flex-1 text-base font-semibold text-gray-900">{list.name}</Text>
                <Text className="text-base font-bold text-gray-900">{count}</Text>
              </Pressable>
            );
          })}
        </View>

        <View className="flex-row gap-2">
          <TextInput
            value={newListName}
            onChangeText={setNewListName}
            onSubmitEditing={createList}
            placeholder="New list"
            placeholderTextColor="#9ca3af"
            returnKeyType="done"
            className="min-h-[42px] flex-1 rounded-lg border border-gray-200 bg-white px-3 text-[15px] text-gray-900"
          />
          <Pressable onPress={createList} className="h-[42px] w-[42px] items-center justify-center rounded-lg bg-gray-900">
            <Text className="text-2xl font-semibold leading-[26px] text-white">+</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
