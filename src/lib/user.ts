import { getFirestore, doc, setDoc, getDoc, SetOptions } from "firebase/firestore";
import { User } from "firebase/auth";
import { UserProfile } from "./types";

export async function createUserProfile(user: User, options?: SetOptions) {
  const firestore = getFirestore(user.app);
  const userRef = doc(firestore, "users", user.uid);
  
  // For new users, we can check if the doc exists to avoid overwriting.
  // For Google Sign-In, we might want to merge to update profile info.
  if (!options?.merge) {
    const docSnap = await getDoc(userRef);
    if (docSnap.exists()) {
      return; // Profile already exists, do nothing.
    }
  }

  const userProfile: UserProfile = {
    uid: user.uid,
    email: user.email || "",
    name: user.displayName || user.email?.split('@')[0] || 'Usuario',
  };

  return setDoc(userRef, userProfile, options || {});
}
