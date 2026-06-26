// BAD — FlatList from react-native (should use FlashList for performance)
import { FlatList } from 'react-native';

export function BadList({ data }: { data: string[] }) {
  return (
    <FlatList
      data={data}
      keyExtractor={(item) => item}
      renderItem={({ item }) => null}
    />
  );
}
