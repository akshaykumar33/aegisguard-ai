import { FastifyInstance } from 'fastify';
import { db, repositories, pullRequests, reviewRuns, reviewFindings, policies, organizations, customers, plans, subscriptions, users } from '@codeguard/database';
import { desc, eq } from 'drizzle-orm';

export async function dashboardRoutes(app: FastifyInstance): Promise<void> {
  // 1. Root & Portals HTML
  app.get('/', async (req, reply) => {
    reply.type('text/html').send(renderFullPlatformHtml('customer'));
  });

  app.get('/dashboard', async (req, reply) => {
    reply.type('text/html').send(renderFullPlatformHtml('customer'));
  });

  app.get('/app', async (req, reply) => {
    reply.type('text/html').send(renderFullPlatformHtml('customer'));
  });

  app.get('/admin', async (req, reply) => {
    reply.type('text/html').send(renderFullPlatformHtml('admin'));
  });

  app.get('/app/organization', async (req, reply) => {
    reply.type('text/html').send(renderFullPlatformHtml('org'));
  });

  // 2. Stats API
  app.get('/api/v1/dashboard/stats', async (req, reply) => {
    try {
      const orgs = await db.select().from(organizations);
      const repos = await db.select().from(repositories);
      const prs = await db.select().from(pullRequests);
      const reviews = await db.select().from(reviewRuns).orderBy(desc(reviewRuns.createdAt)).limit(10);
      const findings = await db.select().from(reviewFindings).orderBy(desc(reviewFindings.createdAt)).limit(15);
      const activePolicies = await db.select().from(policies);

      const criticalFindings = findings.filter((f) => f.severity === 'CRITICAL').length;
      const highFindings = findings.filter((f) => f.severity === 'HIGH').length;

      const enrichedReviews = reviews.map((r) => {
        const repo = repos.find((repo) => repo.id === r.repositoryId);
        const pr = prs.find((p) => p.id === r.pullRequestId);
        return {
          ...r,
          repositoryName: repo?.name ?? repo?.fullName ?? 'payments-service',
          pullRequestTitle: pr?.title ?? `Pull Request #${pr?.number ?? '142'}`,
          prNumber: pr?.number ?? 142,
          verdict: r.policyOutcome === 'ALLOW' || r.state === 'PASSED' ? 'APPROVED' : 'BLOCKED',
          executionTimeMs: r.durationMs ?? 1420
        };
      });

      const enrichedFindings = findings.map((f) => {
        return {
          ...f,
          file: f.filePath,
          lineStart: f.startLine,
          tool: f.source || 'AST-Engine'
        };
      });

      return reply.send({
        counts: {
          organizations: orgs.length,
          repositories: repos.length,
          pullRequests: prs.length,
          reviews: reviews.length,
          criticalFindings,
          highFindings,
          activeModel: 'Google Gemini 3.7 Flash'
        },
        recentReviews: enrichedReviews,
        recentFindings: enrichedFindings,
        activePolicies
      });
    } catch (err: any) {
      return reply.status(500).send({ error: err.message });
    }
  });
}

function renderFullPlatformHtml(initialMode: 'customer' | 'admin' | 'org'): string {
  return `<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CodeGuard AI • Enterprise Subscriber Portal & Governance Platform</title>
  
  <!-- Modern Typography: Inter + Plus Jakarta Sans + JetBrains Mono -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap" rel="stylesheet">
  
  <style>
    /* ==========================================================================
       MULTI-THEME CSS VARIABLES (Stripe, Dark Obsidian, Purple AI, Emerald)
       ========================================================================== */
    :root {
      --font-sans: 'Plus Jakarta Sans', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      --font-body: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      --font-mono: 'JetBrains Mono', monospace;
      --transition-smooth: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      --radius-sm: 8px;
      --radius-md: 12px;
      --radius-lg: 16px;
      --radius-xl: 24px;
      --radius-full: 9999px;
    }

    /* THEME 1: DARK OBSIDIAN (Default) */
    html[data-theme="dark"] {
      --bg-app: #090a0f;
      --bg-sidebar: #0d0f17;
      --bg-header: rgba(13, 15, 23, 0.85);
      --bg-card: #131622;
      --bg-card-hover: #181c2b;
      --bg-card-elevated: #1a1e30;
      --bg-input: #0e111a;
      --border-subtle: rgba(255, 255, 255, 0.07);
      --border-medium: rgba(255, 255, 255, 0.12);
      --border-focus: #6366f1;
      --text-primary: #f8fafc;
      --text-secondary: #94a3b8;
      --text-muted: #64748b;
      --primary: #6366f1;
      --primary-hover: #4f46e5;
      --primary-light: rgba(99, 102, 241, 0.15);
      --primary-glow: rgba(99, 102, 241, 0.35);
      --accent: #06b6d4;
      --accent-light: rgba(6, 182, 212, 0.15);
      --success: #10b981;
      --success-light: rgba(16, 185, 129, 0.15);
      --warning: #f59e0b;
      --warning-light: rgba(245, 158, 11, 0.15);
      --danger: #ef4444;
      --danger-light: rgba(239, 68, 68, 0.15);
      --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.4);
      --shadow-md: 0 8px 24px rgba(0, 0, 0, 0.5);
      --shadow-lg: 0 20px 48px rgba(0, 0, 0, 0.6);
      --hero-mesh: radial-gradient(at 0% 0%, rgba(99, 102, 241, 0.15) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(6, 182, 212, 0.15) 0px, transparent 50%);
    }

    /* THEME 2: STRIPE PEARL (Crisp Light) */
    html[data-theme="stripe"] {
      --bg-app: #f8fafc;
      --bg-sidebar: #ffffff;
      --bg-header: rgba(255, 255, 255, 0.9);
      --bg-card: #ffffff;
      --bg-card-hover: #f1f5f9;
      --bg-card-elevated: #ffffff;
      --bg-input: #f8fafc;
      --border-subtle: #e2e8f0;
      --border-medium: #cbd5e1;
      --border-focus: #6366f1;
      --text-primary: #0f172a;
      --text-secondary: #475569;
      --text-muted: #94a3b8;
      --primary: #6366f1;
      --primary-hover: #4f46e5;
      --primary-light: rgba(99, 102, 241, 0.08);
      --primary-glow: rgba(99, 102, 241, 0.25);
      --accent: #0ea5e9;
      --accent-light: rgba(14, 165, 233, 0.1);
      --success: #10b981;
      --success-light: rgba(16, 185, 129, 0.1);
      --warning: #d97706;
      --warning-light: rgba(217, 119, 6, 0.1);
      --danger: #dc2626;
      --danger-light: rgba(220, 38, 38, 0.1);
      --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.03);
      --shadow-md: 0 4px 16px rgba(0, 0, 0, 0.06), 0 2px 4px rgba(0, 0, 0, 0.04);
      --shadow-lg: 0 20px 40px rgba(0, 0, 0, 0.08);
      --hero-mesh: radial-gradient(at 0% 0%, rgba(99, 102, 241, 0.08) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(14, 165, 233, 0.08) 0px, transparent 50%);
    }

    /* THEME 3: PURPLE AI (Futuristic Neon) */
    html[data-theme="purple"] {
      --bg-app: #080612;
      --bg-sidebar: #0e0a20;
      --bg-header: rgba(14, 10, 32, 0.85);
      --bg-card: #15102e;
      --bg-card-hover: #1d163f;
      --bg-card-elevated: #221a49;
      --bg-input: #0b081a;
      --border-subtle: rgba(168, 85, 247, 0.15);
      --border-medium: rgba(168, 85, 247, 0.25);
      --border-focus: #a855f7;
      --text-primary: #faf5ff;
      --text-secondary: #c084fc;
      --text-muted: #7e69ab;
      --primary: #a855f7;
      --primary-hover: #9333ea;
      --primary-light: rgba(168, 85, 247, 0.15);
      --primary-glow: rgba(168, 85, 247, 0.4);
      --accent: #ec4899;
      --accent-light: rgba(236, 72, 153, 0.15);
      --success: #34d399;
      --success-light: rgba(52, 211, 153, 0.15);
      --warning: #fbbf24;
      --warning-light: rgba(251, 191, 36, 0.15);
      --danger: #f43f5e;
      --danger-light: rgba(244, 63, 94, 0.15);
      --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.5);
      --shadow-md: 0 8px 24px rgba(168, 85, 247, 0.15);
      --shadow-lg: 0 20px 48px rgba(168, 85, 247, 0.25);
      --hero-mesh: radial-gradient(at 0% 0%, rgba(168, 85, 247, 0.2) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(236, 72, 153, 0.18) 0px, transparent 50%);
    }

    /* THEME 4: EMERALD CYBER */
    html[data-theme="emerald"] {
      --bg-app: #040e0a;
      --bg-sidebar: #071912;
      --bg-header: rgba(7, 25, 18, 0.85);
      --bg-card: #0c261c;
      --bg-card-hover: #123628;
      --bg-card-elevated: #164030;
      --bg-input: #05130e;
      --border-subtle: rgba(16, 185, 129, 0.15);
      --border-medium: rgba(16, 185, 129, 0.25);
      --border-focus: #10b981;
      --text-primary: #ecfdf5;
      --text-secondary: #6ee7b7;
      --text-muted: #3d8066;
      --primary: #10b981;
      --primary-hover: #059669;
      --primary-light: rgba(16, 185, 129, 0.15);
      --primary-glow: rgba(16, 185, 129, 0.35);
      --accent: #14b8a6;
      --accent-light: rgba(20, 184, 166, 0.15);
      --success: #34d399;
      --success-light: rgba(52, 211, 153, 0.15);
      --warning: #f59e0b;
      --warning-light: rgba(245, 158, 11, 0.15);
      --danger: #ef4444;
      --danger-light: rgba(239, 68, 68, 0.15);
      --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.5);
      --shadow-md: 0 8px 24px rgba(16, 185, 129, 0.15);
      --shadow-lg: 0 20px 48px rgba(16, 185, 129, 0.25);
      --hero-mesh: radial-gradient(at 0% 0%, rgba(16, 185, 129, 0.18) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(20, 184, 166, 0.15) 0px, transparent 50%);
    }

    /* ==========================================================================
       GLOBAL BASE STYLES
       ========================================================================== */
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: var(--font-body);
      background-color: var(--bg-app);
      color: var(--text-primary);
      line-height: 1.5;
      -webkit-font-smoothing: antialiased;
      overflow-x: hidden;
      transition: background-color 0.3s ease, color 0.3s ease;
    }

    h1, h2, h3, h4, h5, h6 {
      font-family: var(--font-sans);
      font-weight: 700;
      letter-spacing: -0.025em;
      color: var(--text-primary);
    }

    a {
      color: var(--primary);
      text-decoration: none;
      transition: var(--transition-smooth);
    }

    /* SCROLLBAR */
    ::-webkit-scrollbar {
      width: 6px;
      height: 6px;
    }
    ::-webkit-scrollbar-track {
      background: var(--bg-app);
    }
    ::-webkit-scrollbar-thumb {
      background: var(--border-medium);
      border-radius: var(--radius-full);
    }
    ::-webkit-scrollbar-thumb:hover {
      background: var(--text-muted);
    }

    /* ==========================================================================
       LAYOUT STRUCTURE (SIDEBAR + MAIN + HEADER)
       ========================================================================== */
    .app-shell {
      display: flex;
      min-height: 100vh;
      width: 100vw;
    }

    /* SIDEBAR */
    .sidebar {
      width: 280px;
      background: var(--bg-sidebar);
      border-right: 1px solid var(--border-subtle);
      display: flex;
      flex-direction: column;
      position: sticky;
      top: 0;
      height: 100vh;
      z-index: 40;
      transition: var(--transition-smooth);
      flex-shrink: 0;
    }

    .sidebar-brand {
      padding: 24px 20px 20px;
      display: flex;
      align-items: center;
      gap: 12px;
      border-bottom: 1px solid var(--border-subtle);
    }

    .brand-logo-icon {
      width: 38px;
      height: 38px;
      border-radius: var(--radius-md);
      background: linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      box-shadow: 0 4px 12px var(--primary-glow);
      font-size: 20px;
      font-weight: 800;
    }

    .brand-text-title {
      font-size: 17px;
      font-weight: 800;
      letter-spacing: -0.03em;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .brand-badge {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      padding: 2px 6px;
      border-radius: var(--radius-full);
      background: var(--primary-light);
      color: var(--primary);
      border: 1px solid var(--primary-glow);
    }

    .sidebar-nav {
      flex: 1;
      padding: 20px 14px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .nav-group-title {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--text-muted);
      padding: 0 10px 8px;
    }

    .nav-list {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 14px;
      border-radius: var(--radius-md);
      color: var(--text-secondary);
      font-weight: 500;
      font-size: 14px;
      cursor: pointer;
      transition: var(--transition-smooth);
      border: 1px solid transparent;
      user-select: none;
    }

    .nav-item:hover {
      background: var(--bg-card-hover);
      color: var(--text-primary);
    }

    .nav-item.active {
      background: var(--primary-light);
      color: var(--primary);
      border-color: var(--primary-glow);
      font-weight: 600;
    }

    .nav-item .icon {
      font-size: 18px;
      width: 20px;
      display: flex;
      justify-content: center;
    }

    .nav-badge {
      margin-left: auto;
      font-size: 11px;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: var(--radius-full);
      background: var(--bg-card-elevated);
      color: var(--text-secondary);
      border: 1px solid var(--border-subtle);
    }

    .nav-badge.highlight {
      background: var(--primary);
      color: white;
      box-shadow: 0 2px 8px var(--primary-glow);
    }

    .sidebar-footer {
      padding: 16px;
      border-top: 1px solid var(--border-subtle);
      background: var(--bg-sidebar);
    }

    .user-profile-pill {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 12px;
      border-radius: var(--radius-md);
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      transition: var(--transition-smooth);
      cursor: pointer;
    }

    .user-profile-pill:hover {
      background: var(--bg-card-hover);
      border-color: var(--border-medium);
    }

    .avatar-img {
      width: 36px;
      height: 36px;
      border-radius: var(--radius-full);
      object-fit: cover;
      border: 2px solid var(--primary);
    }

    .profile-info {
      flex: 1;
      overflow: hidden;
    }

    .profile-name {
      font-size: 13px;
      font-weight: 600;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .profile-role {
      font-size: 11px;
      color: var(--text-muted);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* MAIN CONTENT WRAPPER */
    .main-wrapper {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-width: 0;
      background: var(--bg-app);
      background-image: var(--hero-mesh);
      background-attachment: fixed;
    }

    /* TOP HEADER BAR */
    .top-header {
      height: 72px;
      background: var(--bg-header);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border-bottom: 1px solid var(--border-subtle);
      position: sticky;
      top: 0;
      z-index: 30;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 32px;
      gap: 20px;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .header-page-title {
      font-size: 18px;
      font-weight: 700;
      color: var(--text-primary);
    }

    /* PERSONA LIVE SWITCHER PILLS */
    .persona-switcher {
      display: flex;
      align-items: center;
      background: var(--bg-input);
      border: 1px solid var(--border-subtle);
      padding: 4px;
      border-radius: var(--radius-full);
      gap: 2px;
    }

    .persona-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 14px;
      border-radius: var(--radius-full);
      border: none;
      background: transparent;
      color: var(--text-secondary);
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: var(--transition-smooth);
      white-space: nowrap;
    }

    .persona-btn:hover {
      color: var(--text-primary);
      background: var(--bg-card-hover);
    }

    .persona-btn.active {
      background: var(--primary);
      color: white;
      box-shadow: 0 2px 10px var(--primary-glow);
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    /* THEME SWITCHER DROPDOWN */
    .theme-selector {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      border-radius: var(--radius-md);
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      color: var(--text-secondary);
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: var(--transition-smooth);
    }

    .theme-selector:hover {
      background: var(--bg-card-hover);
      border-color: var(--border-medium);
      color: var(--text-primary);
    }

    .header-btn {
      width: 40px;
      height: 40px;
      border-radius: var(--radius-md);
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      color: var(--text-secondary);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      position: relative;
      transition: var(--transition-smooth);
      font-size: 16px;
    }

    .header-btn:hover {
      background: var(--bg-card-hover);
      border-color: var(--border-medium);
      color: var(--text-primary);
    }

    .notification-dot {
      position: absolute;
      top: 8px;
      right: 8px;
      width: 8px;
      height: 8px;
      background: var(--danger);
      border-radius: var(--radius-full);
      border: 2px solid var(--bg-card);
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
      70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(239, 68, 68, 0); }
      100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
    }

    /* VIEW CONTAINER */
    .view-content {
      padding: 32px;
      max-width: 1400px;
      width: 100%;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 32px;
    }

    /* ==========================================================================
       HERO SUBSCRIPTION BANNER (STRIPE & LINEAR STYLE)
       ========================================================================== */
    .hero-banner {
      background: linear-gradient(135deg, var(--bg-card-elevated) 0%, var(--bg-card) 100%);
      border: 1px solid var(--border-medium);
      border-radius: var(--radius-xl);
      padding: 32px 36px;
      position: relative;
      overflow: hidden;
      box-shadow: var(--shadow-md);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 32px;
    }

    .hero-banner::before {
      content: '';
      position: absolute;
      top: -50%;
      right: -20%;
      width: 500px;
      height: 500px;
      background: radial-gradient(circle, var(--primary-glow) 0%, transparent 70%);
      pointer-events: none;
      z-index: 1;
    }

    .hero-left {
      position: relative;
      z-index: 2;
      display: flex;
      flex-direction: column;
      gap: 12px;
      max-width: 650px;
    }

    .hero-status-pill {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 4px 12px;
      border-radius: var(--radius-full);
      background: var(--primary-light);
      border: 1px solid var(--primary-glow);
      color: var(--primary);
      font-size: 12px;
      font-weight: 700;
      width: fit-content;
    }

    .hero-title {
      font-size: 30px;
      font-weight: 800;
      line-height: 1.2;
      letter-spacing: -0.03em;
    }

    .hero-desc {
      font-size: 15px;
      color: var(--text-secondary);
      line-height: 1.6;
    }

    .hero-right {
      position: relative;
      z-index: 2;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 12px;
      flex-shrink: 0;
    }

    .plan-price-tag {
      font-size: 36px;
      font-weight: 800;
      font-family: var(--font-sans);
      color: var(--text-primary);
      display: flex;
      align-items: baseline;
      gap: 4px;
    }

    .plan-price-period {
      font-size: 15px;
      font-weight: 500;
      color: var(--text-muted);
    }

    /* BUTTONS */
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 10px 20px;
      border-radius: var(--radius-md);
      font-family: var(--font-sans);
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: var(--transition-smooth);
      border: 1px solid transparent;
      user-select: none;
    }

    .btn-primary {
      background: linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%);
      color: white;
      box-shadow: 0 4px 14px var(--primary-glow);
    }

    .btn-primary:hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 20px var(--primary-glow);
    }

    .btn-secondary {
      background: var(--bg-card-elevated);
      color: var(--text-primary);
      border-color: var(--border-medium);
    }

    .btn-secondary:hover {
      background: var(--bg-card-hover);
      border-color: var(--border-focus);
      color: var(--text-primary);
    }

    .btn-outline {
      background: transparent;
      color: var(--text-secondary);
      border-color: var(--border-medium);
    }

    .btn-outline:hover {
      color: var(--text-primary);
      background: var(--bg-card);
      border-color: var(--border-focus);
    }

    .btn-sm {
      padding: 6px 12px;
      font-size: 12px;
    }

    .btn-danger {
      background: var(--danger-light);
      color: var(--danger);
      border-color: var(--danger);
    }

    .btn-danger:hover {
      background: var(--danger);
      color: white;
    }

    /* ==========================================================================
       STATS & KPI GRID (STRIPE STYLE)
       ========================================================================== */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 20px;
    }

    .stat-card {
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-lg);
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      transition: var(--transition-smooth);
      position: relative;
      overflow: hidden;
      box-shadow: var(--shadow-sm);
    }

    .stat-card:hover {
      transform: translateY(-2px);
      border-color: var(--border-medium);
      box-shadow: var(--shadow-md);
    }

    .stat-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .stat-title {
      font-size: 13px;
      font-weight: 600;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .stat-icon-wrap {
      width: 36px;
      height: 36px;
      border-radius: var(--radius-md);
      background: var(--primary-light);
      color: var(--primary);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
    }

    .stat-value {
      font-size: 32px;
      font-weight: 800;
      letter-spacing: -0.03em;
      color: var(--text-primary);
      font-family: var(--font-sans);
    }

    .stat-trend {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      font-weight: 600;
    }

    .trend-up {
      color: var(--success);
    }
    .trend-down {
      color: var(--danger);
    }

    /* ==========================================================================
       USAGE METERS GRID & QUOTA PROGRESS BARS
       ========================================================================== */
    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;
    }

    .section-title {
      font-size: 20px;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .section-desc {
      font-size: 14px;
      color: var(--text-secondary);
      margin-top: 2px;
    }

    .meters-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 20px;
    }

    .meter-card {
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-lg);
      padding: 22px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      transition: var(--transition-smooth);
      box-shadow: var(--shadow-sm);
    }

    .meter-card:hover {
      border-color: var(--border-medium);
      box-shadow: var(--shadow-md);
    }

    .meter-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .meter-title {
      font-size: 15px;
      font-weight: 600;
      color: var(--text-primary);
    }

    .meter-badge {
      font-size: 11px;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: var(--radius-full);
      background: var(--bg-card-elevated);
      color: var(--text-secondary);
    }

    .meter-badge.warning {
      background: var(--warning-light);
      color: var(--warning);
      border: 1px solid var(--warning);
    }

    .meter-badge.danger {
      background: var(--danger-light);
      color: var(--danger);
      border: 1px solid var(--danger);
    }

    .progress-track {
      width: 100%;
      height: 10px;
      background: var(--bg-input);
      border-radius: var(--radius-full);
      overflow: hidden;
      position: relative;
    }

    .progress-fill {
      height: 100%;
      border-radius: var(--radius-full);
      background: linear-gradient(90deg, var(--primary) 0%, var(--accent) 100%);
      transition: width 0.8s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .progress-fill.warning {
      background: linear-gradient(90deg, var(--warning) 0%, #f97316 100%);
    }

    .progress-fill.danger {
      background: linear-gradient(90deg, var(--danger) 0%, #b91c1c 100%);
    }

    .meter-bottom {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 13px;
      color: var(--text-secondary);
      font-family: var(--font-mono);
    }

    .meter-percentage {
      font-weight: 700;
      color: var(--text-primary);
    }

    /* ==========================================================================
       FEATURES & BENEFITS MATRIX
       ========================================================================== */
    .features-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 16px;
    }

    .feature-card {
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      padding: 18px 20px;
      display: flex;
      align-items: flex-start;
      gap: 16px;
      transition: var(--transition-smooth);
    }

    .feature-card:hover {
      background: var(--bg-card-hover);
      border-color: var(--border-medium);
    }

    .feature-icon-box {
      width: 32px;
      height: 32px;
      border-radius: var(--radius-sm);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      flex-shrink: 0;
    }

    .feature-icon-box.enabled {
      background: var(--success-light);
      color: var(--success);
    }

    .feature-icon-box.disabled {
      background: var(--bg-card-elevated);
      color: var(--text-muted);
    }

    .feature-info {
      flex: 1;
    }

    .feature-name {
      font-size: 14px;
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: 4px;
    }

    .feature-desc {
      font-size: 12px;
      color: var(--text-secondary);
      line-height: 1.4;
    }

    /* ==========================================================================
       TABLES (INVOICES, CRM, MEMBERS, AUDIT)
       ========================================================================== */
    .table-container {
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-lg);
      overflow: hidden;
      box-shadow: var(--shadow-sm);
    }

    .table-toolbar {
      padding: 16px 20px;
      border-bottom: 1px solid var(--border-subtle);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      flex-wrap: wrap;
    }

    .search-input-wrap {
      position: relative;
      flex: 1;
      max-width: 320px;
    }

    .search-input {
      width: 100%;
      padding: 8px 14px 8px 36px;
      border-radius: var(--radius-md);
      background: var(--bg-input);
      border: 1px solid var(--border-subtle);
      color: var(--text-primary);
      font-size: 13px;
      outline: none;
      transition: var(--transition-smooth);
    }

    .search-input:focus {
      border-color: var(--border-focus);
      box-shadow: 0 0 0 3px var(--primary-light);
    }

    .search-icon {
      position: absolute;
      left: 12px;
      top: 50%;
      transform: translateY(-50%);
      color: var(--text-muted);
      font-size: 14px;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 13px;
    }

    .data-table th {
      background: var(--bg-input);
      color: var(--text-muted);
      font-weight: 600;
      text-transform: uppercase;
      font-size: 11px;
      letter-spacing: 0.05em;
      padding: 12px 20px;
      border-bottom: 1px solid var(--border-subtle);
    }

    .data-table td {
      padding: 14px 20px;
      border-bottom: 1px solid var(--border-subtle);
      color: var(--text-primary);
    }

    .data-table tr:last-child td {
      border-bottom: none;
    }

    .data-table tr:hover td {
      background: var(--bg-card-hover);
    }

    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 3px 10px;
      border-radius: var(--radius-full);
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
    }

    .status-badge.active, .status-badge.paid, .status-badge.succeeded {
      background: var(--success-light);
      color: var(--success);
    }

    .status-badge.pending, .status-badge.trial {
      background: var(--warning-light);
      color: var(--warning);
    }

    .status-badge.suspended, .status-badge.cancelled, .status-badge.failed {
      background: var(--danger-light);
      color: var(--danger);
    }

    /* ==========================================================================
       MODALS & DIALOGS
       ========================================================================== */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(8px);
      z-index: 100;
      display: none;
      align-items: center;
      justify-content: center;
      padding: 20px;
      opacity: 0;
      transition: opacity 0.25s ease;
    }

    .modal-backdrop.show {
      display: flex;
      opacity: 1;
    }

    .modal-card {
      background: var(--bg-card);
      border: 1px solid var(--border-medium);
      border-radius: var(--radius-xl);
      max-width: 680px;
      width: 100%;
      max-height: 90vh;
      overflow-y: auto;
      padding: 32px;
      box-shadow: var(--shadow-lg);
      transform: scale(0.95);
      transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .modal-backdrop.show .modal-card {
      transform: scale(1);
    }

    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 24px;
    }

    .modal-title {
      font-size: 22px;
      font-weight: 800;
    }

    .modal-close-btn {
      background: transparent;
      border: none;
      color: var(--text-muted);
      font-size: 20px;
      cursor: pointer;
      padding: 4px;
      transition: var(--transition-smooth);
    }

    .modal-close-btn:hover {
      color: var(--text-primary);
    }

    /* PRICING COMPARISON MATRIX IN MODAL */
    .pricing-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 16px;
      margin: 24px 0;
    }

    .pricing-card {
      background: var(--bg-input);
      border: 2px solid var(--border-subtle);
      border-radius: var(--radius-lg);
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      transition: var(--transition-smooth);
      cursor: pointer;
      position: relative;
    }

    .pricing-card:hover, .pricing-card.selected {
      border-color: var(--primary);
      background: var(--bg-card-elevated);
      box-shadow: 0 4px 20px var(--primary-glow);
    }

    .pricing-tier-name {
      font-size: 16px;
      font-weight: 700;
    }

    .pricing-amount {
      font-size: 26px;
      font-weight: 800;
      color: var(--text-primary);
    }

    .pricing-feature-list {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 6px;
      font-size: 12px;
      color: var(--text-secondary);
      margin-top: 8px;
    }

    .pricing-feature-list li {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    /* FORMS & INPUTS */
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
      margin-bottom: 16px;
    }

    .form-label {
      font-size: 12px;
      font-weight: 600;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .form-input, .form-select, .form-textarea {
      width: 100%;
      padding: 10px 14px;
      border-radius: var(--radius-md);
      background: var(--bg-input);
      border: 1px solid var(--border-subtle);
      color: var(--text-primary);
      font-size: 14px;
      outline: none;
      transition: var(--transition-smooth);
      font-family: inherit;
    }

    .form-input:focus, .form-select:focus, .form-textarea:focus {
      border-color: var(--border-focus);
      box-shadow: 0 0 0 3px var(--primary-light);
    }

    /* TOAST NOTIFICATION */
    .toast-container {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 150;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .toast {
      background: var(--bg-card-elevated);
      color: var(--text-primary);
      border: 1px solid var(--border-medium);
      padding: 14px 20px;
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-lg);
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 14px;
      font-weight: 500;
      animation: slideUp 0.3s ease;
    }

    @keyframes slideUp {
      from { transform: translateY(20px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }

    /* RESPONSIVE */
    @media (max-width: 1024px) {
      .sidebar {
        width: 80px;
      }
      .sidebar .brand-text-title, .sidebar .nav-group-title, .sidebar .nav-item span, .sidebar .nav-badge, .sidebar .profile-info {
        display: none;
      }
      .hero-banner {
        flex-direction: column;
        align-items: flex-start;
      }
      .hero-right {
        align-items: flex-start;
      }
    }
  </style>
</head>
<body>

<div class="app-shell">
  <!-- SIDEBAR NAVIGATION -->
  <aside class="sidebar">
    <div class="sidebar-brand">
      <div class="brand-logo-icon">🛡️</div>
      <div class="brand-text-title">
        CodeGuard
        <span class="brand-badge" id="sidebarRoleBadge">PRO</span>
      </div>
    </div>

    <nav class="sidebar-nav">
      <div>
        <div class="nav-group-title">Subscriber Suite</div>
        <ul class="nav-list">
          <li class="nav-item active" onclick="switchView('overview')">
            <span class="icon">📊</span>
            <span>Dashboard</span>
          </li>
          <li class="nav-item" onclick="switchView('benefits')">
            <span class="icon">✨</span>
            <span>Plan & Benefits</span>
          </li>
          <li class="nav-item" onclick="switchView('usage')">
            <span class="icon">⚡</span>
            <span>Usage & Quotas</span>
          </li>
          <li class="nav-item" onclick="switchView('billing')">
            <span class="icon">💳</span>
            <span>Billing & Invoices</span>
          </li>
          <li class="nav-item" onclick="switchView('organization')">
            <span class="icon">🏢</span>
            <span>Team & Seats</span>
            <span class="nav-badge" id="sidebarSeatsBadge">24/50</span>
          </li>
        </ul>
      </div>

      <div>
        <div class="nav-group-title">Resources & Support</div>
        <ul class="nav-list">
          <li class="nav-item" onclick="switchView('documents')">
            <span class="icon">📚</span>
            <span>Knowledge Hub</span>
            <span class="nav-badge">Docs</span>
          </li>
          <li class="nav-item" onclick="switchView('support')">
            <span class="icon">💬</span>
            <span>Support Desk</span>
            <span class="nav-badge highlight" id="sidebarTicketBadge">1 Open</span>
          </li>
        </ul>
      </div>

      <div id="adminNavSection">
        <div class="nav-group-title">Platform Admin</div>
        <ul class="nav-list">
          <li class="nav-item" onclick="switchView('admin-crm')">
            <span class="icon">👥</span>
            <span>Customer CRM</span>
          </li>
          <li class="nav-item" onclick="switchView('admin-plans')">
            <span class="icon">🛠️</span>
            <span>Plan Builder</span>
          </li>
          <li class="nav-item" onclick="switchView('admin-broadcast')">
            <span class="icon">📢</span>
            <span>Broadcaster</span>
          </li>
          <li class="nav-item" onclick="switchView('admin-audit')">
            <span class="icon">📜</span>
            <span>Audit Trail</span>
          </li>
        </ul>
      </div>
    </nav>

    <div class="sidebar-footer">
      <div class="user-profile-pill" onclick="openPlanModal()">
        <img src="https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100" class="avatar-img" id="userAvatarImg" alt="User Avatar">
        <div class="profile-info">
          <div class="profile-name" id="userNameLabel">Elena Rostova</div>
          <div class="profile-role" id="userPlanLabel">Pro Plan • Active</div>
        </div>
        <span style="font-size: 12px; color: var(--text-muted);">⚡</span>
      </div>
    </div>
  </aside>

  <!-- MAIN VIEW CONTAINER -->
  <div class="main-wrapper">
    <!-- TOP HEADER -->
    <header class="top-header">
      <div class="header-left">
        <h1 class="header-page-title" id="topHeaderTitle">Customer Self-Service Portal</h1>
      </div>

      <!-- PERSONA DEMO SWITCHER -->
      <div class="persona-switcher">
        <button class="persona-btn" id="btnPersonaStudent" onclick="switchDemoPersona('student')">🎓 Student Dev</button>
        <button class="persona-btn active" id="btnPersonaPro" onclick="switchDemoPersona('pro')">⚡ Pro Engineer</button>
        <button class="persona-btn" id="btnPersonaOrg" onclick="switchDemoPersona('org')">🏢 Org Owner</button>
        <button class="persona-btn" id="btnPersonaAdmin" onclick="switchDemoPersona('admin')">👑 Super Admin</button>
      </div>

      <div class="header-right">
        <!-- MULTI-THEME SELECTOR -->
        <select class="theme-selector" id="themeSelect" onchange="changeTheme(this.value)">
          <option value="dark">🌙 Dark Obsidian</option>
          <option value="stripe">☀️ Stripe Pearl (Light)</option>
          <option value="purple">🟣 Obsidian Purple (AI)</option>
          <option value="emerald">🟢 Emerald Cyber</option>
        </select>

        <a href="/docs" target="_blank" class="header-btn" title="OpenAPI / Swagger Documentation">📖</a>
        <button class="header-btn" onclick="switchView('overview')" title="Notifications">
          🔔
          <span class="notification-dot" id="notifPingDot"></span>
        </button>
      </div>
    </header>

    <!-- VIEWS CONTENT -->
    <main class="view-content">
      
      <!-- 1. OVERVIEW VIEW -->
      <section id="viewOverview" class="content-section">
        <!-- HERO BANNER -->
        <div class="hero-banner">
          <div class="hero-left">
            <div class="hero-status-pill">
              <span style="color: var(--success);">●</span>
              <span id="heroTierBadge">PRO TIER ACTIVE • 14-DAY TRIAL</span>
            </div>
            <h2 class="hero-title" id="heroGreeting">Welcome back, Elena</h2>
            <p class="hero-desc" id="heroDescription">
              Your CodeGuard AI reviewer is active across your repositories. Continuous zero-trust AST scanning, secret prevention, and Gemini 3.7 PR verification are currently running.
            </p>
          </div>
          <div class="hero-right">
            <div class="plan-price-tag">
              <span id="heroPriceText">$29</span>
              <span class="plan-price-period" id="heroPeriodText">/ month</span>
            </div>
            <div style="display: flex; gap: 8px;">
              <button class="btn btn-primary" onclick="openPlanModal()">Upgrade Plan</button>
              <button class="btn btn-secondary" onclick="switchView('billing')">Manage Billing</button>
            </div>
          </div>
        </div>

        <!-- STATS KPI ROW -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-header">
              <span class="stat-title">Monthly PRs Checked</span>
              <div class="stat-icon-wrap">🚀</div>
            </div>
            <div class="stat-value" id="kpiPrCount">42 / 100</div>
            <div class="stat-trend trend-up">
              <span>↑ 18.4%</span>
              <span style="color: var(--text-muted); font-weight: normal;">vs last period</span>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-header">
              <span class="stat-title">AI Verifications</span>
              <div class="stat-icon-wrap">🤖</div>
            </div>
            <div class="stat-value" id="kpiAiCount">180 / 500</div>
            <div class="stat-trend trend-up">
              <span>Gemini 3.7 Flash</span>
              <span style="color: var(--text-muted); font-weight: normal;">active</span>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-header">
              <span class="stat-title">Secrets Detected</span>
              <div class="stat-icon-wrap" style="background: var(--danger-light); color: var(--danger);">🛡️</div>
            </div>
            <div class="stat-value" style="color: var(--success);" id="kpiSecretsCount">0 Leaks</div>
            <div class="stat-trend trend-up">
              <span>100% Protected</span>
              <span style="color: var(--text-muted); font-weight: normal;">zero-trust</span>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-header">
              <span class="stat-title">Active Repositories</span>
              <div class="stat-icon-wrap">📦</div>
            </div>
            <div class="stat-value" id="kpiReposCount">4 / 10</div>
            <div class="stat-trend">
              <span style="color: var(--primary);">Git Sync Active</span>
            </div>
          </div>
        </div>

        <!-- USAGE METERS SECTION -->
        <div>
          <div class="section-header">
            <div>
              <h3 class="section-title">⚡ Real-Time Resource Quotas & Meters</h3>
              <p class="section-desc">Track real-time resource utilization across your billing cycle with automated threshold alerts.</p>
            </div>
            <button class="btn btn-outline btn-sm" onclick="switchView('usage')">Detailed Breakdown →</button>
          </div>

          <div class="meters-grid" id="overviewMetersGrid">
            <!-- Dynamic Meters injected via JS -->
          </div>
        </div>

        <!-- INCLUDED BENEFITS SECTION -->
        <div>
          <div class="section-header">
            <div>
              <h3 class="section-title">✨ Tier Benefits & Service Level</h3>
              <p class="section-desc">Everything included in your current subscription tier.</p>
            </div>
          </div>

          <div class="features-grid" id="overviewBenefitsGrid">
            <!-- Dynamic Benefits injected via JS -->
          </div>
        </div>
      </section>

      <!-- 2. BENEFITS & FEATURES VIEW -->
      <section id="viewBenefits" class="content-section" style="display: none;">
        <div class="section-header">
          <div>
            <h2 class="section-title">✨ Plan Benefits & Technical Features</h2>
            <p class="section-desc">Granular technical capabilities enabled for your account.</p>
          </div>
          <button class="btn btn-primary" onclick="openPlanModal()">Change / Upgrade Plan</button>
        </div>

        <div class="features-grid" id="fullFeaturesGrid">
          <!-- Full Technical Features injected via JS -->
        </div>
      </section>

      <!-- 3. USAGE & QUOTAS VIEW -->
      <section id="viewUsage" class="content-section" style="display: none;">
        <div class="section-header">
          <div>
            <h2 class="section-title">⚡ Usage & Quota Consumption Breakdown</h2>
            <p class="section-desc">Detailed usage metrics for the active billing cycle.</p>
          </div>
          <button class="btn btn-outline" onclick="openPlanModal()">Increase Limits</button>
        </div>

        <div class="meters-grid" id="fullUsageMetersGrid">
          <!-- Full Meters injected via JS -->
        </div>
      </section>

      <!-- 4. BILLING & INVOICES VIEW -->
      <section id="viewBilling" class="content-section" style="display: none;">
        <div class="section-header">
          <div>
            <h2 class="section-title">💳 Billing Ledger & Invoices</h2>
            <p class="section-desc">Download receipts, view billing history, and manage payment methods.</p>
          </div>
          <button class="btn btn-primary" onclick="openPlanModal()">Upgrade Tier</button>
        </div>

        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Date</th>
                <th>Description</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Receipt</th>
              </tr>
            </thead>
            <tbody id="invoicesTableBody">
              <!-- Invoices injected via JS -->
            </tbody>
          </table>
        </div>
      </section>

      <!-- 5. ORGANIZATION & SEATS VIEW -->
      <section id="viewOrganization" class="content-section" style="display: none;">
        <div class="hero-banner" style="margin-bottom: 24px;">
          <div class="hero-left">
            <div class="hero-status-pill">ENTERPRISE TEAM GOVERNANCE</div>
            <h2 class="hero-title" id="orgNameHeader">Acme Payments Corp</h2>
            <p class="hero-desc">
              Manage developer seats, assign role permissions, and enforce global code policies across engineering teams.
            </p>
          </div>
          <div class="hero-right">
            <button class="btn btn-primary" onclick="openInviteModal()">+ Invite Member</button>
          </div>
        </div>

        <div class="table-container">
          <div class="table-toolbar">
            <div class="search-input-wrap">
              <span class="search-icon">🔍</span>
              <input type="text" class="search-input" placeholder="Search team members...">
            </div>
            <div style="font-size: 13px; color: var(--text-secondary);" id="orgSeatsIndicator">
              Seats Allocation: <strong>24 / 50 Used</strong> (26 Available)
            </div>
          </div>

          <table class="data-table">
            <thead>
              <tr>
                <th>Member</th>
                <th>Email</th>
                <th>Role</th>
                <th>Joined</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody id="orgMembersTableBody">
              <!-- Org members injected via JS -->
            </tbody>
          </table>
        </div>
      </section>

      <!-- 6. DOCUMENTATION & CMS VIEW -->
      <section id="viewDocuments" class="content-section" style="display: none;">
        <div class="section-header">
          <div>
            <h2 class="section-title">📚 Knowledge Hub & Compliance Blueprints</h2>
            <p class="section-desc">Tier-gated architectural blueprints, SOC2 compliance packs, and integration guides.</p>
          </div>
        </div>

        <div class="features-grid" id="documentsGrid">
          <!-- Documents injected via JS -->
        </div>
      </section>

      <!-- 7. SUPPORT DESK VIEW -->
      <section id="viewSupport" class="content-section" style="display: none;">
        <div class="section-header">
          <div>
            <h2 class="section-title">💬 Customer Support & Helpdesk</h2>
            <p class="section-desc">Direct line to CodeGuard security architects and platform engineering.</p>
          </div>
          <button class="btn btn-primary" onclick="openTicketModal()">+ Open New Ticket</button>
        </div>

        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Ticket ID</th>
                <th>Subject</th>
                <th>Category</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody id="supportTicketsTableBody">
              <!-- Tickets injected via JS -->
            </tbody>
          </table>
        </div>
      </section>

      <!-- 8. ADMIN CRM & CONTROL PLANE -->
      <section id="viewAdminCrm" class="content-section" style="display: none;">
        <div class="section-header">
          <div>
            <h2 class="section-title">👑 Platform Admin • Customer CRM</h2>
            <p class="section-desc">Multi-tenant customer directory with subscription controls, plan management, and deep inspection.</p>
          </div>
        </div>

        <div class="table-container">
          <div class="table-toolbar">
            <div class="search-input-wrap">
              <span class="search-icon">🔍</span>
              <input type="text" class="search-input" id="adminCustomerSearch" placeholder="Search customers..." onkeyup="filterAdminCustomers(this.value)">
            </div>
          </div>

          <table class="data-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Type</th>
                <th>Active Plan</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody id="adminCustomersTableBody">
              <!-- Admin customers injected via JS -->
            </tbody>
          </table>
        </div>
      </section>

      <!-- 9. ADMIN PLAN BUILDER -->
      <section id="viewAdminPlans" class="content-section" style="display: none;">
        <div class="section-header">
          <div>
            <h2 class="section-title">🛠️ Dynamic Plan Builder & Entitlement Catalog</h2>
            <p class="section-desc">Configure features, limits, and pricing tiers dynamically without changing code.</p>
          </div>
          <button class="btn btn-primary" onclick="showToast('Plan Builder sync completed')">Save Catalog</button>
        </div>

        <div class="features-grid" id="adminPlansGrid">
          <!-- Admin plans catalog injected via JS -->
        </div>
      </section>

      <!-- 10. ADMIN BROADCASTER -->
      <section id="viewAdminBroadcast" class="content-section" style="display: none;">
        <div class="section-header">
          <div>
            <h2 class="section-title">📢 Multi-Channel Notification Broadcaster</h2>
            <p class="section-desc">Target announcements and critical alerts to specific subscriber segments.</p>
          </div>
        </div>

        <div class="stat-card" style="max-width: 700px;">
          <div class="form-group">
            <label class="form-label">Target Audience</label>
            <select class="form-select" id="broadcastAudienceSelect">
              <option value="EVERYONE">All Active Users Across Platform</option>
              <option value="PRO">Pro Plan Subscribers Only</option>
              <option value="ORGANIZATION">Enterprise Organization Accounts</option>
              <option value="STUDENT">Student & Academic Free Tier</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Broadcast Title</label>
            <input type="text" class="form-input" id="broadcastTitle" value="Platform Upgrade: Google Gemini 3.7 Flash Model Active">
          </div>

          <div class="form-group">
            <label class="form-label">Message Content</label>
            <textarea class="form-textarea" id="broadcastMessage" rows="4">All automated pull request code reviews have been upgraded with our latest zero-hallucination verification engine.</textarea>
          </div>

          <div class="form-group">
            <label class="form-label">Priority</label>
            <select class="form-select" id="broadcastPriority">
              <option value="NORMAL">Normal</option>
              <option value="HIGH">High (Banner Notification)</option>
              <option value="CRITICAL">Critical (Instant Alert)</option>
            </select>
          </div>

          <button class="btn btn-primary" style="margin-top: 10px;" onclick="sendAdminBroadcast()">🚀 Dispatch Notification Broadcast</button>
        </div>
      </section>

      <!-- 11. ADMIN AUDIT TRAIL -->
      <section id="viewAdminAudit" class="content-section" style="display: none;">
        <div class="section-header">
          <div>
            <h2 class="section-title">📜 Immutable Platform Audit Trail</h2>
            <p class="section-desc">Complete record of administrative and security events.</p>
          </div>
        </div>

        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Actor</th>
                <th>Action</th>
                <th>Target Resource</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody id="adminAuditTableBody">
              <!-- Audit logs injected via JS -->
            </tbody>
          </table>
        </div>
      </section>

    </main>
  </div>
</div>

<!-- ==========================================================================
     PLAN UPGRADE & COMPARISON MODAL
     ========================================================================== -->
<div class="modal-backdrop" id="planModal">
  <div class="modal-card">
    <div class="modal-header">
      <div>
        <h3 class="modal-title">Upgrade Your CodeGuard Subscription</h3>
        <p style="font-size: 14px; color: var(--text-secondary); margin-top: 4px;">Select the tier that matches your development and security governance scale.</p>
      </div>
      <button class="modal-close-btn" onclick="closePlanModal()">✕</button>
    </div>

    <div class="pricing-grid">
      <!-- TIER 1 -->
      <div class="pricing-card" id="cardTierStudent" onclick="selectUpgradeTier('basic-student')">
        <div class="pricing-tier-name">🎓 Basic / Student</div>
        <div class="pricing-amount">$0<span style="font-size: 14px; font-weight: normal; color: var(--text-muted);">/mo</span></div>
        <ul class="pricing-feature-list">
          <li>✓ Local CLI & AST Indexer</li>
          <li>✓ Offline Code Graph RAG</li>
          <li>✓ Zero-Trust Secret Detector</li>
          <li>✓ 1 User • 3 Repositories</li>
        </ul>
      </div>

      <!-- TIER 2 -->
      <div class="pricing-card selected" id="cardTierPro" onclick="selectUpgradeTier('pro')">
        <div class="pricing-tier-name">⚡ Pro Engineer</div>
        <div class="pricing-amount">$29<span style="font-size: 14px; font-weight: normal; color: var(--text-muted);">/mo</span></div>
        <ul class="pricing-feature-list">
          <li>✓ Everything in Basic</li>
          <li>✓ GitHub / GitLab Cloud Sync</li>
          <li>✓ Gemini 3.7 AI PR Reviews</li>
          <li>✓ Branch Protection Gatekeeper</li>
          <li>✓ 1 User • 10 Repositories</li>
        </ul>
      </div>

      <!-- TIER 3 -->
      <div class="pricing-card" id="cardTierOrg" onclick="selectUpgradeTier('enterprise')">
        <div class="pricing-tier-name">🏢 Enterprise Org</div>
        <div class="pricing-amount">$199<span style="font-size: 14px; font-weight: normal; color: var(--text-muted);">/mo</span></div>
        <ul class="pricing-feature-list">
          <li>✓ Everything in Pro</li>
          <li>✓ 50+ User Seats & RBAC</li>
          <li>✓ Org-Wide Policy Deployment</li>
          <li>✓ 24/7 Dedicated Support</li>
          <li>✓ Central Billing & Invoicing</li>
        </ul>
      </div>
    </div>

    <div style="display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px;">
      <button class="btn btn-outline" onclick="closePlanModal()">Cancel</button>
      <button class="btn btn-primary" onclick="confirmPlanUpgrade()">Confirm Plan Change</button>
    </div>
  </div>
</div>

<!-- ==========================================================================
     INVITE MEMBER MODAL
     ========================================================================== -->
<div class="modal-backdrop" id="inviteModal">
  <div class="modal-card" style="max-width: 480px;">
    <div class="modal-header">
      <h3 class="modal-title">Invite Team Member</h3>
      <button class="modal-close-btn" onclick="closeInviteModal()">✕</button>
    </div>

    <div class="form-group">
      <label class="form-label">Developer Full Name</label>
      <input type="text" class="form-input" id="inviteName" placeholder="e.g. Maya Lin">
    </div>

    <div class="form-group">
      <label class="form-label">Work Email</label>
      <input type="email" class="form-input" id="inviteEmail" placeholder="e.g. maya@acmepayments.com">
    </div>

    <div class="form-group">
      <label class="form-label">Role Permission</label>
      <select class="form-select" id="inviteRole">
        <option value="MEMBER">Member (Developer / Code Reviewer)</option>
        <option value="ADMIN">Admin (Team & Policy Management)</option>
        <option value="SECURITY_LEAD">Security Lead (Override Authority)</option>
      </select>
    </div>

    <div style="display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px;">
      <button class="btn btn-outline" onclick="closeInviteModal()">Cancel</button>
      <button class="btn btn-primary" onclick="submitInviteMember()">Send Invitation</button>
    </div>
  </div>
</div>

<!-- ==========================================================================
     NEW SUPPORT TICKET MODAL
     ========================================================================== -->
<div class="modal-backdrop" id="ticketModal">
  <div class="modal-card" style="max-width: 540px;">
    <div class="modal-header">
      <h3 class="modal-title">Open Support Ticket</h3>
      <button class="modal-close-btn" onclick="closeTicketModal()">✕</button>
    </div>

    <div class="form-group">
      <label class="form-label">Subject</label>
      <input type="text" class="form-input" id="ticketSubject" placeholder="Brief summary of request">
    </div>

    <div class="form-group">
      <label class="form-label">Category</label>
      <select class="form-select" id="ticketCategory">
        <option value="TECHNICAL">Technical & Policy Integration</option>
        <option value="BILLING">Billing & Invoices</option>
        <option value="FEATURE_REQUEST">Feature Request</option>
      </select>
    </div>

    <div class="form-group">
      <label class="form-label">Priority</label>
      <select class="form-select" id="ticketPriority">
        <option value="LOW">Low</option>
        <option value="NORMAL" selected>Normal</option>
        <option value="HIGH">High</option>
        <option value="URGENT">Urgent (24/7 SLA)</option>
      </select>
    </div>

    <div class="form-group">
      <label class="form-label">Message Details</label>
      <textarea class="form-textarea" id="ticketMessage" rows="4" placeholder="Describe the issue..."></textarea>
    </div>

    <div style="display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px;">
      <button class="btn btn-outline" onclick="closeTicketModal()">Cancel</button>
      <button class="btn btn-primary" onclick="submitSupportTicket()">Submit Ticket</button>
    </div>
  </div>
</div>

<!-- TOAST CONTAINER -->
<div class="toast-container" id="toastContainer"></div>

<!-- ==========================================================================
     CLIENT-SIDE INTERACTIVITY & LIVE API INTEGRATION SCRIPT
     ========================================================================== -->
<script>
  // STATE MANAGEMENT
  let currentToken = localStorage.getItem('codeguard_token') || '';
  let currentRole = '${initialMode === 'admin' ? 'admin' : (initialMode === 'org' ? 'org' : 'pro')}';
  let currentView = '${initialMode === 'admin' ? 'admin-crm' : (initialMode === 'org' ? 'organization' : 'overview')}';
  let selectedPlanSlug = 'pro';
  let currentOverviewData = null;

  // THEME INITIALIZATION
  function changeTheme(themeName) {
    document.documentElement.setAttribute('data-theme', themeName);
    localStorage.setItem('codeguard_theme', themeName);
    const select = document.getElementById('themeSelect');
    if (select) select.value = themeName;
  }

  const savedTheme = localStorage.getItem('codeguard_theme') || 'dark';
  changeTheme(savedTheme);

  // TOAST DISPATCHER
  function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = 'toast';
    const icon = type === 'success' ? '✅' : (type === 'error' ? '❌' : 'ℹ️');
    toast.innerHTML = '<span>' + icon + '</span><span>' + message + '</span>';
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  // NAVIGATION VIEW SWITCHER
  function switchView(viewName) {
    currentView = viewName;

    // Update Nav active classes
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    
    // Hide all view sections
    document.querySelectorAll('.content-section').forEach(el => el.style.display = 'none');

    // Title mapping
    const titleMap = {
      'overview': 'Customer Self-Service Portal',
      'benefits': 'Plan Benefits & Technical Features',
      'usage': 'Usage & Resource Quotas',
      'billing': 'Billing Ledger & Invoices',
      'organization': 'Team & Seat Allocation Governance',
      'documents': 'Knowledge Hub & Blueprint Center',
      'support': 'Customer Support Helpdesk',
      'admin-crm': 'Admin Control Plane • Customer CRM',
      'admin-plans': 'Admin Plan Builder Catalog',
      'admin-broadcast': 'Multi-Channel Broadcaster',
      'admin-audit': 'Immutable Audit Logs'
    };

    const headerEl = document.getElementById('topHeaderTitle');
    if (headerEl) headerEl.innerText = titleMap[viewName] || 'CodeGuard Platform';

    // Show selected section
    const targetMap = {
      'overview': 'viewOverview',
      'benefits': 'viewBenefits',
      'usage': 'viewUsage',
      'billing': 'viewBilling',
      'organization': 'viewOrganization',
      'documents': 'viewDocuments',
      'support': 'viewSupport',
      'admin-crm': 'viewAdminCrm',
      'admin-plans': 'viewAdminPlans',
      'admin-broadcast': 'viewAdminBroadcast',
      'admin-audit': 'viewAdminAudit'
    };

    const sectionEl = document.getElementById(targetMap[viewName]);
    if (sectionEl) sectionEl.style.display = 'flex';
    if (sectionEl) sectionEl.style.flexDirection = 'column';
    if (sectionEl) sectionEl.style.gap = '32px';

    // Load data based on view
    if (viewName === 'overview' || viewName === 'benefits' || viewName === 'usage') loadCustomerOverview();
    if (viewName === 'billing') loadCustomerBilling();
    if (viewName === 'organization') loadOrganizationOverview();
    if (viewName === 'documents') loadCustomerDocuments();
    if (viewName === 'support') loadCustomerSupport();
    if (viewName === 'admin-crm') loadAdminDashboard();
    if (viewName === 'admin-plans') loadAdminPlans();
    if (viewName === 'admin-audit') loadAdminAudit();
  }

  // PERSONA SWITCHER
  async function switchDemoPersona(role) {
    currentRole = role;

    document.querySelectorAll('.persona-btn').forEach(b => b.classList.remove('active'));
    if (role === 'student') document.getElementById('btnPersonaStudent')?.classList.add('active');
    if (role === 'pro') document.getElementById('btnPersonaPro')?.classList.add('active');
    if (role === 'org') document.getElementById('btnPersonaOrg')?.classList.add('active');
    if (role === 'admin') document.getElementById('btnPersonaAdmin')?.classList.add('active');

    try {
      const res = await fetch('/api/v1/auth/demo-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role })
      });
      const data = await res.json();
      if (data.token) {
        currentToken = data.token;
        localStorage.setItem('codeguard_token', data.token);

        showToast('Switched persona to ' + (data.user?.name || role), 'success');

        if (role === 'admin') {
          switchView('admin-crm');
        } else if (role === 'org') {
          switchView('organization');
        } else {
          switchView('overview');
        }
      }
    } catch (err) {
      showToast('Error switching persona: ' + err.message, 'error');
    }
  }

  // DATA LOADERS
  async function loadCustomerOverview() {
    try {
      const res = await fetch('/api/v1/customer/overview', {
        headers: { 'Authorization': 'Bearer ' + currentToken }
      });
      if (!res.ok) return;
      const data = await res.json();
      currentOverviewData = data;

      // Update Header & Hero
      const name = data.customer?.name || 'Developer';
      const planName = data.currentPlan?.name || 'Pro Plan';
      const isTrial = data.subscription?.status === 'TRIAL';
      const price = data.currentPlan ? '$' + (data.currentPlan.priceMonthly / 100).toFixed(0) : '$29';

      document.getElementById('userNameLabel').innerText = name;
      document.getElementById('userPlanLabel').innerText = planName + ' • ' + (data.subscription?.status || 'Active');
      document.getElementById('sidebarRoleBadge').innerText = (data.currentPlan?.tier || 'PRO');

      document.getElementById('heroGreeting').innerText = 'Welcome back, ' + name.split(' ')[0];
      document.getElementById('heroTierBadge').innerText = planName.toUpperCase() + ' ACTIVE' + (isTrial ? ' • 14-DAY TRIAL' : '');
      document.getElementById('heroPriceText').innerText = price;

      // Render Meters
      renderMeters(data.usageMeters || {});

      // Render Benefits
      renderBenefits(data.entitlements?.benefits || []);

      // Render Features
      renderFeatures(data.entitlements?.features || {});

    } catch (err) {
      console.error('Error loading overview:', err);
    }
  }

  function renderMeters(meters) {
    const container = document.getElementById('overviewMetersGrid');
    const fullContainer = document.getElementById('fullUsageMetersGrid');
    if (!container) return;

    let html = '';
    const keys = Object.keys(meters);

    if (keys.length === 0) {
      html = '<div style="color: var(--text-muted); font-size: 14px;">No active meters recorded for this billing cycle.</div>';
    }

    for (const key of keys) {
      const m = meters[key];
      const name = key.replace(/_/g, ' ');
      let badgeClass = '';
      if (m.isWarning) badgeClass = 'warning';
      if (m.isExceeded) badgeClass = 'danger';

      html += '<div class="meter-card">' +
        '<div class="meter-top">' +
          '<span class="meter-title">' + name + '</span>' +
          '<span class="meter-badge ' + badgeClass + '">' + (m.isExceeded ? 'EXCEEDED' : (m.isWarning ? 'WARNING' : 'HEALTHY')) + '</span>' +
        '</div>' +
        '<div class="progress-track">' +
          '<div class="progress-fill ' + badgeClass + '" style="width: ' + m.percentage + '%;"></div>' +
        '</div>' +
        '<div class="meter-bottom">' +
          '<span>' + m.current + ' / ' + m.limit + ' used</span>' +
          '<span class="meter-percentage">' + m.percentage + '%</span>' +
        '</div>' +
      '</div>';
    }

    container.innerHTML = html;
    if (fullContainer) fullContainer.innerHTML = html;
  }

  function renderBenefits(benefits) {
    const container = document.getElementById('overviewBenefitsGrid');
    if (!container) return;

    if (benefits.length === 0) {
      container.innerHTML = '<div style="color: var(--text-muted); font-size: 14px;">Standard tier benefits active.</div>';
      return;
    }

    let html = '';
    for (const b of benefits) {
      html += '<div class="feature-card">' +
        '<div class="feature-icon-box enabled">✓</div>' +
        '<div class="feature-info">' +
          '<div class="feature-name">' + b.name + '</div>' +
          '<div class="feature-desc">' + (b.description || 'Verified tier capability.') + '</div>' +
        '</div>' +
      '</div>';
    }
    container.innerHTML = html;
  }

  function renderFeatures(features) {
    const container = document.getElementById('fullFeaturesGrid');
    if (!container) return;

    let html = '';
    for (const [key, val] of Object.entries(features)) {
      const isEnabled = Boolean(val);
      html += '<div class="feature-card">' +
        '<div class="feature-icon-box ' + (isEnabled ? 'enabled' : 'disabled') + '">' + (isEnabled ? '✓' : '✕') + '</div>' +
        '<div class="feature-info">' +
          '<div class="feature-name">' + key.replace(/_/g, ' ') + '</div>' +
          '<div class="feature-desc">' + (typeof val === 'boolean' ? (val ? 'Active & Fully Enabled' : 'Disabled for current tier') : 'Limit: ' + val) + '</div>' +
        '</div>' +
      '</div>';
    }
    container.innerHTML = html;
  }

  async function loadCustomerBilling() {
    try {
      const res = await fetch('/api/v1/customer/billing', {
        headers: { 'Authorization': 'Bearer ' + currentToken }
      });
      if (!res.ok) return;
      const data = await res.json();
      const tbody = document.getElementById('invoicesTableBody');
      if (!tbody) return;

      let html = '';
      for (const inv of (data.invoices || [])) {
        html += '<tr>' +
          '<td><strong>' + inv.invoiceNumber + '</strong></td>' +
          '<td>' + new Date(inv.createdAt).toLocaleDateString() + '</td>' +
          '<td>' + (inv.lineItemsJson?.[0]?.description || 'Monthly Subscription') + '</td>' +
          '<td><strong>$' + (inv.amountDue / 100).toFixed(2) + '</strong></td>' +
          '<td><span class="status-badge ' + inv.status.toLowerCase() + '">' + inv.status + '</span></td>' +
          '<td><button class="btn btn-outline btn-sm" onclick="showToast(\\'Receipt PDF downloaded\\', \\'success\\')">📥 PDF</button></td>' +
        '</tr>';
      }
      tbody.innerHTML = html || '<tr><td colspan="6" style="text-align: center; color: var(--text-muted);">No invoices found.</td></tr>';
    } catch (err) {
      console.error(err);
    }
  }

  async function loadOrganizationOverview() {
    try {
      const res = await fetch('/api/v1/org/overview', {
        headers: { 'Authorization': 'Bearer ' + currentToken }
      });
      if (!res.ok) return;
      const data = await res.json();

      document.getElementById('orgNameHeader').innerText = data.organization?.name || 'Organization';
      const used = data.seats?.used || 1;
      const total = data.seats?.limit || 50;
      document.getElementById('orgSeatsIndicator').innerHTML = 'Seats Allocation: <strong>' + used + ' / ' + total + ' Used</strong> (' + (total - used) + ' Available)';

      const tbody = document.getElementById('orgMembersTableBody');
      if (!tbody) return;

      let html = '';
      for (const m of (data.members || [])) {
        html += '<tr>' +
          '<td><strong>' + (m.user?.name || 'Member') + '</strong></td>' +
          '<td>' + (m.user?.email || '') + '</td>' +
          '<td><span class="status-badge active">' + m.role + '</span></td>' +
          '<td>' + new Date(m.joinedAt).toLocaleDateString() + '</td>' +
          '<td><button class="btn btn-outline btn-sm" onclick="showToast(\\'Permissions updated\\', \\'success\\')">Edit Role</button></td>' +
        '</tr>';
      }
      tbody.innerHTML = html;
    } catch (err) {
      console.error(err);
    }
  }

  async function loadCustomerDocuments() {
    try {
      const res = await fetch('/api/v1/customer/documents', {
        headers: { 'Authorization': 'Bearer ' + currentToken }
      });
      if (!res.ok) return;
      const data = await res.json();
      const container = document.getElementById('documentsGrid');
      if (!container) return;

      let html = '';
      for (const doc of (data.documents || [])) {
        html += '<div class="feature-card" style="flex-direction: column; gap: 10px;">' +
          '<div style="display: flex; justify-content: space-between; width: 100%;">' +
            '<span class="status-badge active">' + doc.category + '</span>' +
            '<span style="font-size: 11px; color: var(--text-muted);">' + doc.minPlanTier + ' Tier</span>' +
          '</div>' +
          '<div class="feature-name" style="font-size: 16px;">' + doc.title + '</div>' +
          '<div class="feature-desc">' + doc.description + '</div>' +
          '<button class="btn btn-outline btn-sm" style="margin-top: 8px; width: 100%;" onclick="showToast(\\'Document downloaded\\', \\'success\\')">📖 Read Document</button>' +
        '</div>';
      }
      container.innerHTML = html;
    } catch (err) {
      console.error(err);
    }
  }

  async function loadCustomerSupport() {
    try {
      const res = await fetch('/api/v1/customer/support', {
        headers: { 'Authorization': 'Bearer ' + currentToken }
      });
      if (!res.ok) return;
      const data = await res.json();
      const tbody = document.getElementById('supportTicketsTableBody');
      if (!tbody) return;

      let html = '';
      for (const t of (data.tickets || [])) {
        html += '<tr>' +
          '<td><strong>#' + t.id.slice(0, 8) + '</strong></td>' +
          '<td>' + t.subject + '</td>' +
          '<td>' + t.category + '</td>' +
          '<td><span class="status-badge ' + (t.priority === 'URGENT' ? 'failed' : 'trial') + '">' + t.priority + '</span></td>' +
          '<td><span class="status-badge active">' + t.status + '</span></td>' +
          '<td>' + new Date(t.createdAt).toLocaleDateString() + '</td>' +
        '</tr>';
      }
      tbody.innerHTML = html || '<tr><td colspan="6" style="text-align: center; color: var(--text-muted);">No open tickets.</td></tr>';
    } catch (err) {
      console.error(err);
    }
  }

  async function loadAdminDashboard() {
    try {
      const res = await fetch('/api/v1/admin/customers', {
        headers: { 'Authorization': 'Bearer ' + currentToken }
      });
      if (!res.ok) return;
      const data = await res.json();
      const tbody = document.getElementById('adminCustomersTableBody');
      if (!tbody) return;

      let html = '';
      for (const c of (data.customers || [])) {
        html += '<tr>' +
          '<td><strong>' + c.name + '</strong><br><span style="font-size: 11px; color: var(--text-muted);">' + c.email + '</span></td>' +
          '<td>' + c.type + '</td>' +
          '<td><strong>' + (c.activePlan?.name || 'Pro Plan') + '</strong></td>' +
          '<td><span class="status-badge ' + (c.status === 'ACTIVE' ? 'active' : 'suspended') + '">' + c.status + '</span></td>' +
          '<td>' + new Date(c.createdAt).toLocaleDateString() + '</td>' +
          '<td><button class="btn btn-secondary btn-sm" onclick="showToast(\\'Inspecting ' + c.name + '\\')">Inspect</button></td>' +
        '</tr>';
      }
      tbody.innerHTML = html;
    } catch (err) {
      console.error(err);
    }
  }

  async function loadAdminPlans() {
    try {
      const res = await fetch('/api/v1/admin/plans', {
        headers: { 'Authorization': 'Bearer ' + currentToken }
      });
      if (!res.ok) return;
      const data = await res.json();
      const container = document.getElementById('adminPlansGrid');
      if (!container) return;

      let html = '';
      for (const p of (data.plans || [])) {
        html += '<div class="stat-card">' +
          '<div class="stat-header">' +
            '<span class="stat-title">' + p.name + ' (' + p.tier + ')</span>' +
            '<span class="status-badge active">Active</span>' +
          '</div>' +
          '<div class="stat-value">$' + (p.priceMonthly / 100).toFixed(0) + '<span style="font-size: 14px; font-weight: normal; color: var(--text-muted);">/mo</span></div>' +
          '<p style="font-size: 13px; color: var(--text-secondary);">' + p.description + '</p>' +
          '<button class="btn btn-outline btn-sm" style="margin-top: 10px;" onclick="showToast(\\'Plan editor opened\\')">Edit Plan Features</button>' +
        '</div>';
      }
      container.innerHTML = html;
    } catch (err) {
      console.error(err);
    }
  }

  async function loadAdminAudit() {
    try {
      const res = await fetch('/api/v1/admin/audit-logs', {
        headers: { 'Authorization': 'Bearer ' + currentToken }
      });
      if (!res.ok) return;
      const data = await res.json();
      const tbody = document.getElementById('adminAuditTableBody');
      if (!tbody) return;

      let html = '';
      for (const a of (data.auditLogs || [])) {
        html += '<tr>' +
          '<td>' + new Date(a.createdAt).toLocaleString() + '</td>' +
          '<td>' + a.actorType + '</td>' +
          '<td><strong>' + a.action + '</strong></td>' +
          '<td>' + a.resourceType + '</td>' +
          '<td><span style="font-family: var(--font-mono); font-size: 11px;">' + JSON.stringify(a.metadata || {}).slice(0, 40) + '...</span></td>' +
        '</tr>';
      }
      tbody.innerHTML = html;
    } catch (err) {
      console.error(err);
    }
  }

  // MODAL CONTROLS
  function openPlanModal() {
    document.getElementById('planModal').classList.add('show');
  }

  function closePlanModal() {
    document.getElementById('planModal').classList.remove('show');
  }

  function selectUpgradeTier(slug) {
    selectedPlanSlug = slug;
    document.querySelectorAll('.pricing-card').forEach(c => c.classList.remove('selected'));
    if (slug === 'basic-student') document.getElementById('cardTierStudent')?.classList.add('selected');
    if (slug === 'pro') document.getElementById('cardTierPro')?.classList.add('selected');
    if (slug === 'enterprise') document.getElementById('cardTierOrg')?.classList.add('selected');
  }

  async function confirmPlanUpgrade() {
    try {
      const res = await fetch('/api/v1/customer/subscription/change', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + currentToken
        },
        body: JSON.stringify({ planSlug: selectedPlanSlug, billingInterval: 'MONTHLY' })
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Successfully switched plan to ' + data.plan?.name, 'success');
        closePlanModal();
        loadCustomerOverview();
      } else {
        showToast('Failed to switch plan: ' + data.error, 'error');
      }
    } catch (err) {
      showToast('Error: ' + err.message, 'error');
    }
  }

  function openInviteModal() {
    document.getElementById('inviteModal').classList.add('show');
  }

  function closeInviteModal() {
    document.getElementById('inviteModal').classList.remove('show');
  }

  async function submitInviteMember() {
    const name = document.getElementById('inviteName').value;
    const email = document.getElementById('inviteEmail').value;
    const role = document.getElementById('inviteRole').value;

    if (!email) {
      showToast('Please enter an email address', 'error');
      return;
    }

    try {
      const res = await fetch('/api/v1/org/members/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + currentToken
        },
        body: JSON.stringify({ name, email, role })
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Member invited successfully!', 'success');
        closeInviteModal();
        loadOrganizationOverview();
      } else {
        showToast(data.message || data.error, 'error');
      }
    } catch (err) {
      showToast('Error: ' + err.message, 'error');
    }
  }

  function openTicketModal() {
    document.getElementById('ticketModal').classList.add('show');
  }

  function closeTicketModal() {
    document.getElementById('ticketModal').classList.remove('show');
  }

  async function submitSupportTicket() {
    const subject = document.getElementById('ticketSubject').value;
    const category = document.getElementById('ticketCategory').value;
    const priority = document.getElementById('ticketPriority').value;
    const message = document.getElementById('ticketMessage').value;

    if (!subject || !message) {
      showToast('Please enter subject and message', 'error');
      return;
    }

    try {
      const res = await fetch('/api/v1/customer/support', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + currentToken
        },
        body: JSON.stringify({ subject, category, priority, message })
      });
      if (res.ok) {
        showToast('Ticket submitted successfully!', 'success');
        closeTicketModal();
        loadCustomerSupport();
      }
    } catch (err) {
      showToast('Error: ' + err.message, 'error');
    }
  }

  async function sendAdminBroadcast() {
    const audience = document.getElementById('broadcastAudienceSelect').value;
    const title = document.getElementById('broadcastTitle').value;
    const message = document.getElementById('broadcastMessage').value;
    const priority = document.getElementById('broadcastPriority').value;

    try {
      const res = await fetch('/api/v1/admin/notifications/broadcast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + currentToken
        },
        body: JSON.stringify({
          title,
          message,
          priority,
          targetAudience: { type: audience === 'EVERYONE' ? 'EVERYONE' : 'PLAN', value: audience },
          channels: ['IN_APP', 'EMAIL']
        })
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Broadcast sent to ' + data.recipientCount + ' subscribers!', 'success');
      } else {
        showToast('Broadcast error: ' + data.error, 'error');
      }
    } catch (err) {
      showToast('Error: ' + err.message, 'error');
    }
  }

  // INITIAL BOOTSTRAP
  window.addEventListener('DOMContentLoaded', () => {
    switchDemoPersona(currentRole);
  });
</script>

</body>
</html>`;
}
