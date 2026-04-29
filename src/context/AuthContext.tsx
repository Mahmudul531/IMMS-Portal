import React, { createContext, useContext, useState } from 'react';

interface PharUser {
    id: number;
    username: string;
    fullName: string;
    role: string;
}

interface AuthContextType {
    user: PharUser | null;
    login: (user: PharUser) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const PharAuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<PharUser | null>(() => {
        const s = localStorage.getItem('phar_user');
        return s ? JSON.parse(s) : null;
    });

    const login = (u: PharUser) => { setUser(u); localStorage.setItem('phar_user', JSON.stringify(u)); };
    const logout = () => { setUser(null); localStorage.removeItem('phar_user'); };

    return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
};

export const usePharAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('usePharAuth must be inside PharAuthProvider');
    return ctx;
};
