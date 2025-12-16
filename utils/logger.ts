
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../firebase';

export const logActivity = async (
  type: 'ORDER' | 'PRODUCT' | 'VENDOR' | 'SYSTEM' | 'SHOP',
  description: string,
  user: string
) => {
  try {
    await addDoc(collection(db, 'logs'), {
      type,
      description,
      user,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    // Suppress permission errors for logging to avoid breaking user flow
    // console.error("Failed to log activity:", error);
  }
};
