import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { UserRole } from '../types';

interface AuthContextType {
  currentUser: User | null;
  userRole: UserRole | null;
  loading: boolean;
  dbError: string | null;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setDbError(null);
      
      if (user) {
        // Optimistic role assignment (failsafe)
        const isHardcodedAdmin = user.email?.toLowerCase() === 'dineshkodali.uk@gmail.com';
        const optimisticRole = (user.email?.includes('admin') || isHardcodedAdmin) ? UserRole.ADMIN : UserRole.VENDOR;
        
        try {
          // Self-Healing: Check if user doc exists, if not create it.
          // This is critical for Security Rules that check 'isAdmin()' via get()
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            const data = userDoc.data() as any;
            
            // Force update role for specific admin email if it's incorrect in DB
            if (isHardcodedAdmin && data.role !== UserRole.ADMIN) {
                console.log("Upgrading user to Admin...");
                await setDoc(userDocRef, { ...data, role: UserRole.ADMIN }, { merge: true });
                setUserRole(UserRole.ADMIN);
            } else {
                setUserRole(data.role as UserRole);
            }
          } else {
            // Document missing? Create it now.
            // Security Rules allow a user to write their OWN document.
            console.log("User profile missing. Attempting self-heal...");
            await setDoc(userDocRef, {
              email: user.email,
              role: optimisticRole,
              createdAt: new Date().toISOString(),
              uid: user.uid
            });
            setUserRole(optimisticRole);
            console.log("User profile restored.");
          }
        } catch (error: any) {
          console.warn("Auth Sync Warning:", error.code);
          setUserRole(optimisticRole); // Fallback
          
          if (error.code === 'permission-denied') {
             setDbError("Database permissions blocked access. Ensure Security Rules are published.");
          } else if (error.code === 'unavailable') {
             setDbError("Network issue: Running in offline mode.");
          }
        }
      } else {
        setUserRole(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ currentUser, userRole, loading, dbError, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};