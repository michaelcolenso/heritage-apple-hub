export type ListingFilterItem = {
  varietyName: string;
  sellerName?: string | null;
};

export function applyListingSearch<T extends ListingFilterItem>(items: T[], search: string): T[] {
  const term = search.trim().toLowerCase();
  if (!term) return items;

  return items.filter((item) =>
    item.varietyName.toLowerCase().includes(term) ||
    item.sellerName?.toLowerCase().includes(term),
  );
}
