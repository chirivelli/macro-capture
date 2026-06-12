import { useLocalSearchParams } from 'expo-router';

import { CronoApp } from '@/components/crono/crono-app';

export default function ListScreen() {
  const { listId } = useLocalSearchParams<{ listId: string }>();

  return <CronoApp listId={listId} />;
}
