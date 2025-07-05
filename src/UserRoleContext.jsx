import { createContext, useContext, useEffect, useState } from 'react';
import { db } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useAuth } from './AuthContext';

const UserRoleContext = createContext();

export const useUserRole = () => {
  const context = useContext(UserRoleContext);
  if (!context) {
    throw new Error('useUserRole must be used within a UserRoleProvider');
  }
  return context;
};

export const UserRoleProvider = ({ children }) => {
  const { user } = useAuth();
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  // Admin emails list - you can modify this list
  const adminEmails = [
    'admin@example.com',
    'southparayouthsociety@gmail.com',
    // Add more admin emails here
  ];

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user) {
        setUserRole(null);
        setLoading(false);
        return;
      }

      try {
        console.log('Current user email:', user.email);
        console.log('Admin emails:', adminEmails);
        
        // Check if user is in admin list
        const isAdmin = adminEmails.includes(user.email);
        console.log('Is admin:', isAdmin);
        
        // Get or create user document in Firestore
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);

        let role = 'public'; // Default role

        if (userDoc.exists()) {
          // User document exists, get role from Firestore
          const userData = userDoc.data();
          role = userData.role || (isAdmin ? 'admin' : 'public');
          
          // If user is in admin list but role is not admin, update it
          if (isAdmin && role !== 'admin') {
            role = 'admin';
            await setDoc(userDocRef, {
              role: 'admin'
            }, { merge: true });
          }
        } else {
          // User document doesn't exist, create it
          role = isAdmin ? 'admin' : 'public';
          await setDoc(userDocRef, {
            email: user.email,
            displayName: user.displayName || '',
            role: role,
            createdAt: new Date(),
            lastLogin: new Date()
          });
        }

        // Update last login
        await setDoc(userDocRef, {
          lastLogin: new Date()
        }, { merge: true });

        console.log('Final role:', role);
        setUserRole(role);
      } catch (error) {
        console.error('Error fetching user role:', error);
        // If user is in admin list, default to admin even on error
        const isAdmin = adminEmails.includes(user.email);
        setUserRole(isAdmin ? 'admin' : 'public');
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, [user]);

  const isAdmin = () => {
    console.log('Checking isAdmin, userRole:', userRole);
    return userRole === 'admin';
  };
  
  const isPublic = () => userRole === 'public';

  const value = {
    userRole,
    loading,
    isAdmin,
    isPublic
  };

  return (
    <UserRoleContext.Provider value={value}>
      {children}
    </UserRoleContext.Provider>
  );
};

