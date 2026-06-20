import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export interface User {
    id: number;
    username: string;
    role: string;
    email: string;
    permissionGroupId?: number | null;
    active?: boolean;
}

interface AuthContextType {
    user: User | null;
    permissions: string[];
    login: (userData: User) => void;
    logout: () => void;
    /** Returns true if the user has the given permission key — ADMIN always returns true */
    hasPermission: (key: string) => boolean;
    /** Call this to force-refresh permissions from the server (e.g. after admin edits a group) */
    refreshPermissions: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(() => {
        const saved = localStorage.getItem('user');
        return saved ? JSON.parse(saved) : null;
    });

    const [permissions, setPermissions] = useState<string[]>(() => {
        const saved = localStorage.getItem('user_permissions');
        return saved ? JSON.parse(saved) : [];
    });

    /**
     * Fetch the latest permissions for the logged-in user's role from the backend.
     * If the user has a specific permissionGroupId, fetch just that group.
     * Otherwise fall back to the first group configured for their role.
     * ADMIN role always skips this — they have unrestricted access.
     */
    const refreshPermissions = useCallback(async (currentUser?: User | null) => {
        const u = currentUser ?? user;
        if (!u) { setPermissions([]); return; }
        // ADMIN always has all permissions — no need to fetch
        if (u.role === 'ADMIN') { setPermissions(['*']); return; }

        try {
            if (u.permissionGroupId) {
                // Fetch the specific group this user is assigned to
                const { data } = await axios.get(`${API}/api/permission-groups`);
                const groups: any[] = Array.isArray(data) ? data : [];
                const group = groups.find((g: any) => g.id === u.permissionGroupId);
                if (group && group.permissions) {
                    const perms = group.permissions.split(',').filter(Boolean);
                    setPermissions(perms);
                    localStorage.setItem('user_permissions', JSON.stringify(perms));
                    return;
                }
            }

            // Fallback: get the first group configured for this role
            const { data: roleGroups } = await axios.get(`${API}/api/permission-groups/by-role/${u.role}`);
            if (Array.isArray(roleGroups) && roleGroups.length > 0) {
                const perms = roleGroups[0].permissions
                    ? roleGroups[0].permissions.split(',').filter(Boolean)
                    : [];
                setPermissions(perms);
                localStorage.setItem('user_permissions', JSON.stringify(perms));
            } else {
                // No group configured for this role → grant role defaults
                setPermissions(getDefaultPermissions(u.role));
            }
        } catch {
            // If backend is unreachable, use cached permissions
            const cached = localStorage.getItem('user_permissions');
            if (cached) setPermissions(JSON.parse(cached));
        }
    }, [user]);

    // Re-fetch permissions from backend on every app mount / refresh
    useEffect(() => {
        if (user) {
            refreshPermissions(user);
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const login = async (userData: User) => {
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        await refreshPermissions(userData);
    };

    const logout = () => {
        setUser(null);
        setPermissions([]);
        localStorage.removeItem('user');
        localStorage.removeItem('user_permissions');
    };

    const hasPermission = (key: string): boolean => {
        if (!user) return false;
        if (user.role === 'ADMIN') return true;   // ADMIN bypasses all checks
        if (permissions.includes('*')) return true;
        return permissions.includes(key);
    };

    return (
        <AuthContext.Provider value={{ user, permissions, login, logout, hasPermission, refreshPermissions }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

/**
 * Default minimal permissions for each role when no permission group is configured.
 * We return empty so that NO permissions are granted until the admin explicitly assigns them a group.
 */
function getDefaultPermissions(role: string): string[] {
    return [];
}
