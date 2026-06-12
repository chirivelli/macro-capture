import { router } from 'expo-router';
import { useWindowDimensions } from 'react-native';

import { SafeAreaView, View } from '@/tw';
import { cn } from '@/utils/cn';

import { useCrono, CronoProvider } from './crono-context';
import { ListNavigation } from './list-navigation';
import { TaskList } from './task-list';

export { CronoProvider };

export function CronoApp({ listId }: { listId?: string }) {
  const { lists, tasks, addList } = useCrono();
  const { width } = useWindowDimensions();
  const selectedList = lists.find(list => list.id === listId) ?? lists[0];
  const showSidebar = width >= 760;

  function createList(name: string) {
    const trimmed = name.trim();
    if (!trimmed) {
      return;
    }

    const list = addList(trimmed);
    router.replace(`/lists/${list.id}`);
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <View className={cn('flex-1 px-5 pt-2.5', showSidebar && 'flex-row gap-6 px-0 pt-0')}>
        {showSidebar && (
          <ListNavigation
            lists={lists}
            tasks={tasks}
            selectedListId={selectedList.id}
            onCreateList={createList}
            showSidebar={showSidebar}
          />
        )}
        <TaskList list={selectedList} showListsLink={!showSidebar} />
      </View>
    </SafeAreaView>
  );
}
