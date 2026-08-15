import type { Metadata } from 'next';
import './globals.css';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { AppProvider } from '@/lib/store';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { MobileDrawer } from '@/components/layout/MobileDrawer';
import { CommandPalette } from '@/components/command/CommandPalette';
import { UpgradeModal } from '@/components/modals/UpgradeModal';
import { InviteModal } from '@/components/modals/InviteModal';
import { TicketModal } from '@/components/modals/TicketModal';
import { BreakGlassModal } from '@/components/modals/BreakGlassModal';
import { Toaster } from 'sonner';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'CodeGuard AI • Enterprise Code Review & Governance Platform',
  description:
    'Continuous zero-trust AST scanning, secret prevention, and Google Gemini 3.7 PR verification for modern engineering teams.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      data-theme="dark"
      className={`${inter.variable} ${jetbrainsMono.variable} ${GeistSans.variable} ${GeistMono.variable}`}
      suppressHydrationWarning
    >
      <body className="font-sans antialiased bg-background text-foreground selection:bg-primary/25 selection:text-primary min-h-screen">
        <AppProvider>
          <div className="flex min-h-screen bg-background text-foreground">
            {/* Minimalist Linear Sidebar */}
            <Sidebar />

            {/* Main Content Area */}
            <div className="flex flex-1 flex-col min-w-0 overflow-x-hidden">
              {/* Vercel-Style Sticky Navbar */}
              <Navbar />

              {/* Page Body with generous padding and breathing room */}
              <main className="flex-1 px-5 sm:px-8 lg:px-12 py-8 lg:py-10 max-w-[1400px] w-full mx-auto min-w-0">
                {children}
              </main>
            </div>
          </div>

          {/* Global Modals & Command Palette */}
          <MobileDrawer />
          <CommandPalette />
          <UpgradeModal />
          <InviteModal />
          <TicketModal />
          <BreakGlassModal />

          {/* Toast Notification Container */}
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: 'hsl(var(--card-elevated))',
                border: '1px solid hsl(var(--border))',
                color: 'hsl(var(--foreground))',
                borderRadius: 'calc(var(--radius) - 2px)',
                fontSize: '13px',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.4)',
              },
            }}
          />
        </AppProvider>
      </body>
    </html>
  );
}
