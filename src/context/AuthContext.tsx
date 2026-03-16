import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  merchant: any | null;
  refreshMerchant: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  merchant: null,
  refreshMerchant: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [merchant, setMerchant] = useState<any | null>(null);

  useEffect(() => {
    let unsubscribeMerchant: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setUser(user);
      
      if (unsubscribeMerchant) {
        unsubscribeMerchant();
        unsubscribeMerchant = null;
      }

      if (user) {
        // Listen to merchant data in real-time
        const merchantRef = doc(db, 'merchants', user.uid);
        unsubscribeMerchant = onSnapshot(merchantRef, (doc) => {
          if (doc.exists()) {
            setMerchant({ id: doc.id, ...doc.data() });
          } else {
            setMerchant(null);
          }
          setLoading(false);
        }, (error) => {
          console.error("Merchant snapshot error:", error);
          setLoading(false);
        });
      } else {
        setMerchant(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeMerchant) unsubscribeMerchant();
    };
  }, []);

  const refreshMerchant = async () => {
    if (user) {
      const merchantRef = doc(db, 'merchants', user.uid);
      const docSnap = await getDoc(merchantRef);
      if (docSnap.exists()) {
        setMerchant({ id: docSnap.id, ...docSnap.data() });
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, merchant, refreshMerchant }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
