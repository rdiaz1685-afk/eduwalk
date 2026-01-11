import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchProfile = async (userId) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching profile:', error);
            return null;
        }
    };

    useEffect(() => {
        const handleUserChange = async (session) => {
            setSession(session);
            if (session?.user) {
                const profile = await fetchProfile(session.user.id);
                setUser({
                    ...session.user,
                    profile: profile,
                    // Backward compatibility if some components expect it in user_metadata
                    user_metadata: {
                        ...session.user.user_metadata,
                        full_name: profile?.full_name || session.user.user_metadata?.full_name,
                        role: profile?.role || session.user.user_metadata?.role
                    }
                });
            } else {
                setUser(null);
            }
            setLoading(false);
        };

        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            handleUserChange(session);
        });

        // Listen for changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            handleUserChange(session);
        });

        return () => subscription.unsubscribe();
    }, []);

    const value = {
        user,
        session,
        signIn: (email, password) => supabase.auth.signInWithPassword({ email, password }),
        signOut: () => supabase.auth.signOut(),
        resetPassword: (email) => supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`,
        }),
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
