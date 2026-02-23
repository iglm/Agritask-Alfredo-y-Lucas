'use client';

function generateLocalId() {
  // crypto.randomUUID() is available in modern browsers and secure contexts (like localhost/https)
  return `local_${crypto.randomUUID()}`;
}

type CollectionName = 'lots' | 'staff' | 'tasks' | 'supplies' | 'productiveUnit';

export function getLocalItems<T>(collectionName: CollectionName): T[] {
  if (typeof window === 'undefined') return [];
  try {
    const itemsJson = localStorage.getItem(`agritask_${collectionName}`);
    return itemsJson ? JSON.parse(itemsJson) : [];
  } catch (error) {
    console.error(`Error reading ${collectionName} from localStorage`, error);
    return [];
  }
}

export function saveLocalItems<T>(collectionName: CollectionName, items: T[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`agritask_${collectionName}`, JSON.stringify(items));
  } catch (error) {
    console.error(`Error saving ${collectionName} to localStorage`, error);
  }
}

export function addLocalItem<T extends { id: string }>(collectionName: CollectionName, item: Omit<T, 'id' | 'userId'>): T {
  const items = getLocalItems<T>(collectionName);
  const newItem = { ...item, id: generateLocalId() } as T;
  const newItems = [...items, newItem];
  saveLocalItems(collectionName, newItems);
  return newItem;
}

export function updateLocalItem<T extends { id: string }>(collectionName: CollectionName, updatedItem: T): void {
  const items = getLocalItems<T>(collectionName);
  const newItems = items.map(item => (item.id === updatedItem.id ? updatedItem : item));
  saveLocalItems(collectionName, newItems);
}

export function deleteLocalItem<T extends { id: string }>(collectionName: CollectionName, itemId: string): void {
  const items = getLocalItems<T>(collectionName);
  const newItems = items.filter(item => item.id !== itemId);
  saveLocalItems(collectionName, newItems);
}

export function clearLocalCollection(collectionName: CollectionName): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(`agritask_${collectionName}`);
}
