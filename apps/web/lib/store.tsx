'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { ThemeName, AccentColor, DemoPersonaRole, PersonaProfile } from './types';
import { apiClient, ApiError } from './client';
import { toast as sonnerToast } from 'sonner';

interface AppContextType {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
  accent: AccentColor;
  setAccent: (accent: AccentColor) => void;
  persona: PersonaProfile;
  setPersonaRole: (role: DemoPersonaRole) => Promise<void>;
  isCommandOpen: boolean;
  setIsCommandOpen: (open: boolean) => void;
  isUpgradeModalOpen: boolean;
  setIsUpgradeModalOpen: (open: boolean) => void;
  isInviteModalOpen: boolean;
  setIsInviteModalOpen: (open: boolean) => void;
  isTicketModalOpen: boolean;
  setIsTicketModalOpen: (open: boolean) => void;
  isBreakGlassModalOpen: boolean;
  setIsBreakGlassModalOpen: (open: boolean) => void;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (collapsed: boolean | ((prev: boolean) => boolean)) => void;
  isMobileDrawerOpen: boolean;
  setIsMobileDrawerOpen: (open: boolean) => void;
}

const PERSONA_PROFILES: Record<DemoPersonaRole, PersonaProfile> = {
  student: {
    role: 'student',
    name: 'Aarav Sharma',
    email: 'student@codeguard.dev',
    planName: 'Student Developer',
    tier: 'FREE',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
  },
  pro: {
    role: 'pro',
    name: 'Elena Rostova',
    email: 'pro@codeguard.dev',
    planName: 'Pro Engineer',
    tier: 'PRO',
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
  },
  org: {
    role: 'org',
    name: 'Alex Rivera',
    email: 'admin@acmepayments.com',
    planName: 'Enterprise Organization',
    tier: 'ENTERPRISE',
    organization: 'Acme Payments Corp',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  },
  admin: {
    role: 'admin',
    name: 'Sarah Connor',
    email: 'superadmin@codeguard.dev',
    planName: 'Platform Super Admin',
    tier: 'ENTERPRISE',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
  },
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName>('dark');
  const [accent, setAccentState] = useState<AccentColor>('steel');
  const [personaRole, setPersonaRoleState] = useState<DemoPersonaRole>('pro');
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [isBreakGlassModalOpen, setIsBreakGlassModalOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // Initialize theme and accent on mount
  useEffect(() => {
    // Validated rather than cast: a value stored before the palette was reduced
    // would otherwise be stamped onto <html> and match no stylesheet rule.
    const THEMES: ThemeName[] = [
      'dark',
      'tokyo-night',
      'dracula',
      'matrix',
      'nord',
      'github-dimmed',
      'solarized-dark',
      'light',
      'latte',
    ];
    const ACCENTS: AccentColor[] = ['steel', 'teal', 'violet', 'emerald', 'amber', 'cyan'];

    const storedTheme = localStorage.getItem('codeguard_theme') as ThemeName | null;
    const storedAccent = localStorage.getItem('codeguard_accent') as AccentColor | null;
    const storedRole = localStorage.getItem('codeguard_role') as DemoPersonaRole | null;

    const savedTheme = storedTheme && THEMES.includes(storedTheme) ? storedTheme : 'dark';
    const savedAccent = storedAccent && ACCENTS.includes(storedAccent) ? storedAccent : 'steel';
    const savedRole = storedRole || 'pro';

    setThemeState(savedTheme);
    setAccentState(savedAccent);
    setPersonaRoleState(savedRole);

    document.documentElement.setAttribute('data-theme', savedTheme);
    document.documentElement.setAttribute('data-accent', savedAccent);

    // Ensure session token is initialized on initial page load
    if (!apiClient.getToken()) {
      apiClient.demoLogin(savedRole).catch(() => {
        // Continue gracefully if network is initializing
      });
    }
  }, []);

  // Keyboard shortcut listener for ⌘K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const setTheme = (newTheme: ThemeName) => {
    setThemeState(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('codeguard_theme', newTheme);
    sonnerToast.success(`Theme updated to ${newTheme.toUpperCase()}`);
  };

  const setAccent = (newAccent: AccentColor) => {
    setAccentState(newAccent);
    document.documentElement.setAttribute('data-accent', newAccent);
    localStorage.setItem('codeguard_accent', newAccent);
    sonnerToast.success(`Accent color updated to ${newAccent.toUpperCase()}`);
  };

  const setPersonaRole = async (role: DemoPersonaRole) => {
    const profile = PERSONA_PROFILES[role];

    try {
      // demoLogin stores the returned JWT on the client, so every subsequent
      // request is authenticated. Without a token the API now returns 401 rather
      // than silently granting access, so a failure here must be surfaced.
      await apiClient.demoLogin(role);
      setPersonaRoleState(role);
      localStorage.setItem('codeguard_role', role);
      sonnerToast.success(`Switched persona to ${profile.name} (${profile.planName})`);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Could not switch persona.';
      sonnerToast.error('Sign-in failed', { description: message });
    }
  };

  const persona = PERSONA_PROFILES[personaRole] || PERSONA_PROFILES.pro;

  return (
    <AppContext.Provider
      value={{
        theme,
        setTheme,
        accent,
        setAccent,
        persona,
        setPersonaRole,
        isCommandOpen,
        setIsCommandOpen,
        isUpgradeModalOpen,
        setIsUpgradeModalOpen,
        isInviteModalOpen,
        setIsInviteModalOpen,
        isTicketModalOpen,
        setIsTicketModalOpen,
        isBreakGlassModalOpen,
        setIsBreakGlassModalOpen,
        isSidebarCollapsed,
        setIsSidebarCollapsed,
        isMobileDrawerOpen,
        setIsMobileDrawerOpen,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
