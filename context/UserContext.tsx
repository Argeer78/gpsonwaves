'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type User = {
    name: string;
    email: string;
    isPro: boolean;
    isAdmin?: boolean;
    photoUrl?: string;
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
    login: (name: string, email: string) => void;
    logout: () => void;
    upgradeToPro: () => void;
    updateUser: (updates: Partial<User>) => void;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Check local storage on mount
        const savedUser = localStorage.getItem('gpsonwaves-user');
        if (savedUser) {
            try {
                setUser(JSON.parse(savedUser));
            } catch (e) {
                console.error("Failed to parse user", e);
            }
        }
        setIsLoading(false);
    }, []);

    const login = (name: string, email: string) => {
        // Simulate API call
        const isAdmin = email.toLowerCase() === 'sgouros2305@gmail.com';
        const newUser: User = {
            name,
            email,
            isPro: isAdmin, // Admins get Pro for free
            isAdmin,
            preferences: {
                units: 'metric',
                theme: 'dark'
            }
        };
        setUser(newUser);
        localStorage.setItem('gpsonwaves-user', JSON.stringify(newUser));
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('gpsonwaves-user');
    };

    const upgradeToPro = () => {
        if (user) {
            const updatedUser = { ...user, isPro: true };
            setUser(updatedUser);
            localStorage.setItem('gpsonwaves-user', JSON.stringify(updatedUser));
        }
    };

    const updateUser = (updates: Partial<User>) => {
        if (user) {
            const updatedUser = { ...user, ...updates };
            setUser(updatedUser);
            localStorage.setItem('gpsonwaves-user', JSON.stringify(updatedUser)); // Persist
        }
    };

    return (
        <UserContext.Provider value={{ user, isLoading, login, logout, upgradeToPro, updateUser }}>
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
