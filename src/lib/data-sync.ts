'use client';
import { User } from 'firebase/auth';
import { Firestore, collection, doc, writeBatch } from 'firebase/firestore';
import { getLocalItems, clearLocalCollection } from './offline-store';
import type { Lot, Staff, Task } from './types';

export async function syncLocalDataToFirebase(user: User, firestore: Firestore): Promise<number> {
  if (!user || !firestore) return 0;
  
  const idMap = new Map<string, string>();
  let totalSynced = 0;

  try {
    // 1. Sync Lots
    const localLots = getLocalItems<Lot>('lots');
    if (localLots.length > 0) {
      const lotsBatch = writeBatch(firestore);
      const lotsCol = collection(firestore, 'lots');
      localLots.forEach(lot => {
        const docRef = doc(lotsCol);
        idMap.set(lot.id, docRef.id);
        const { id, ...data } = lot;
        lotsBatch.set(docRef, { ...data, id: docRef.id, userId: user.uid });
      });
      await lotsBatch.commit();
      clearLocalCollection('lots');
      totalSynced += localLots.length;
    }

    // 2. Sync Staff
    const localStaff = getLocalItems<Staff>('staff');
    if (localStaff.length > 0) {
      const staffBatch = writeBatch(firestore);
      const staffCol = collection(firestore, 'staff');
      localStaff.forEach(person => {
        const docRef = doc(staffCol);
        idMap.set(person.id, docRef.id);
        const { id, ...data } = person;
        staffBatch.set(docRef, { ...data, id: docRef.id, userId: user.uid });
      });
      await staffBatch.commit();
      clearLocalCollection('staff');
      totalSynced += localStaff.length;
    }

    // 3. Sync Tasks
    const localTasks = getLocalItems<Task>('tasks');
    if (localTasks.length > 0) {
      const tasksBatch = writeBatch(firestore);
      const tasksCol = collection(firestore, 'tasks');
      localTasks.forEach(task => {
        const docRef = doc(tasksCol);
        const { id, lotId, responsibleId, ...data } = task;
        
        // Remap dependencies
        const newLotId = idMap.get(lotId) || lotId;
        const newResponsibleId = idMap.get(responsibleId) || responsibleId;
        
        tasksBatch.set(docRef, { 
          ...data, 
          lotId: newLotId, 
          responsibleId: newResponsibleId, 
          id: docRef.id, 
          userId: user.uid 
        });
      });
      await tasksBatch.commit();
      clearLocalCollection('tasks');
      totalSynced += localTasks.length;
    }

    console.log(`Synced ${totalSynced} items from local storage to Firestore.`);
    return totalSynced;

  } catch (error) {
    console.error("Error syncing local data to Firebase:", error);
    // If a batch fails, local data for that collection is not cleared, allowing for a retry.
    // We return 0 to indicate the sync was not fully successful.
    return 0;
  }
}
