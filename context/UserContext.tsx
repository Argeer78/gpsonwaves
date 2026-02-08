'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSession, signOut } from 'next-auth/react';

type User = {
    id?: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    isPro: boolean;
    isAdmin?: boolean;
    boatSettings?: {
        name: string;
        draft: number; // meters
        length: number; // meters
        type: string;
    };
    preferences?: {
        units: 'metric' | 'imperial';
        theme: 'dark' | 'light';
    };
};

type UserContextType = {
    user: User | null;
    isLoading: boolean;
    logout: () => void;
    upgradeToPro: () => void;
    updateUser: (updates: Partial<User>) => Promise<void>;
    changePassword: (current: string, newPass: string) => Promise<{ success: boolean; error?: string }>;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
    const { data: session, status } = useSession();
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        if (session?.user) {
            // Merge session user with base structure
            // Note: In a real app, you might fetch extra profile data (boatSettings) here if not in session
            setUser({
                id: session.user.id,
                name: session.user.name,
                email: session.user.email,
                image: session.user.image,
                isPro: (session.user as { isPro?: boolean }).isPro || false,
                isAdmin: (session.user as { isAdmin?: boolean }).isAdmin || false,
                // Default settings if missing (or fetch from API)
                preferences: { units: 'metric', theme: 'dark' }
            });
        } else {
            setUser(null);
        }
    }, [session]);

    const logout = () => {
        signOut();
    };

    const upgradeToPro = () => {
        // TODO: Implement Stripe integration here
        if (user) {
            setUser({ ...user, isPro: true });
        }
    };

    const updateUser = async (updates: Partial<User>) => {
        if (user) {
            // Optimistic update
            setUser({ ...user, ...updates });

            try {
                const res = await fetch('/api/user/profile', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updates),
                });

                if (!res.ok) throw new Error("Failed to update profile");

                // Optional: Update with server response if needed
                // const data = await res.json();
                // setUser({ ...user, ...data.user });

            } catch (error) {
                console.error("Update failed", error);
                // Revert or show toast? For now, we keep optimistic UI
            }
        }
    };

    const changePassword = async (currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
        try {
            const res = await fetch('/api/user/password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ currentPassword, newPassword }),
            });

            if (!res.ok) {
                const text = await res.text();
                return { success: false, error: text };
            }

            return { success: true };
        } catch (error) {
            return { success: false, error: "Network error" };
        }
    };

    return (
        <UserContext.Provider value={{
            user,
            isLoading: status === 'loading',
            logout,
            upgradeToPro,
            updateUser,
            changePassword
        }}>
            {children}
        </UserContext.Provider>
    );
}

export function useUser() {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
}
