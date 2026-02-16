/**
 * Auth Context
 * Global authentication state management
 */

import { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { useAuth as useAuthQuery } from '@/hooks/api/useAuth';
import type { User } from '@/services';

interface AuthContextType {
	user: User | undefined;
	isLoading: boolean;
	isAuthenticated: boolean;
	error: Error | null;
	selectedFilialId: number | null;
	setSelectedFilialId: (id: number | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
	children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
	const auth = useAuthQuery();

	const [selectedFilialId, setSelectedFilialIdState] = useState<number | null>(() => {
		try {
			const raw = localStorage.getItem('selectedFilialId');
			return raw ? Number(raw) : null;
		} catch {
			return null;
		}
	});

	// When user data loads, default filial if none set
	useEffect(() => {
		if (!auth.user) return;
		if (selectedFilialId) return;

		const defaultFilial = auth.user.filials_detail?.[0]?.id || auth.user.companies?.[0] || null;
		if (defaultFilial) setSelectedFilialIdState(defaultFilial);
	}, [auth.user]);

	const setSelectedFilialId = (id: number | null) => {
		setSelectedFilialIdState(id);
		try {
			if (id === null) localStorage.removeItem('selectedFilialId');
			else localStorage.setItem('selectedFilialId', String(id));
		} catch {
			// ignore localStorage errors
		}
	};

	return (
		<AuthContext.Provider value={{ ...(auth as any), selectedFilialId, setSelectedFilialId }}>
			{children}
		</AuthContext.Provider>
	);
}

export function useAuthContext() {
	const context = useContext(AuthContext);

	if (context === undefined) {
		throw new Error('useAuthContext must be used within an AuthProvider');
	}

	return context;
}
