// GOOD — FlashList from @shopify/flash-list (recycled views, better performance)
import { FlashList } from '@shopify/flash-list';

export function GoodList({ data }: { data: string[] }) {
  return (
    <FlashList
      data={data}
      keyExtractor={(item) => item}
      renderItem={({ item }) => null}
      estimatedItemSize={50}
    />
  );
}
