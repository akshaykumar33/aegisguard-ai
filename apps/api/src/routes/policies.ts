import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db, policies, policyRules, branchPolicies, auditLogs } from '@codeguard/database';
import { eq } from 'drizzle-orm';
import { authenticateTenant, resolveOrganizationId } from '../middleware/tenantAuth.js';
import { PolicyEngine, DEFAULT_PROTECTED_BRANCH_PATTERNS } from '@codeguard/policy-engine';
import type { Policy, BranchProtectionRule } from '@codeguard/types';

const createPolicySchema = z.object({
  organizationId: z.string().uuid(),
  repositoryId: z.string().uuid().optional(),
  name: z.string().min(2).max(100),
  description: z.string().optional(),
  isDefault: z.boolean().default(false),
  enabled: z.boolean().default(true),
  rules: z.array(
    z.object({
      name: z.string(),
      ruleType: z.enum([
        'SEVERITY_THRESHOLD',
        'SECRET_BLOCK',
        'SAST_BLOCK',
        'ARCHITECTURE_VIOLATION',
        'BRANCH_NAMING',
        'COMMIT_CONVENTION',
        'PROTECTED_BRANCH',
        'HUMAN_APPROVAL_GATE',
        'CUSTOM'
      ]),
      condition: z.record(z.unknown()),
      action: z.enum(['ALLOW', 'WARN', 'BLOCK', 'REQUIRE_APPROVAL']),
      enabled: z.boolean().default(true)
    })
  )
});

export async function policyRoutes(server: FastifyInstance) {
  // List policies
  server.get('/policies', { preHandler: [authenticateTenant] }, async (request, reply) => {
    const queryOrgId = (request.query as { organizationId?: string })?.organizationId;
    const targetOrgId = resolveOrganizationId(request, reply, queryOrgId);
    if (!targetOrgId) return;

    const list = await db.select().from(policies).where(eq(policies.organizationId, targetOrgId));

    // Fetch rules for each policy
    const result = await Promise.all(
      list.map(async (p) => {
        const rules = await db.select().from(policyRules).where(eq(policyRules.policyId, p.id));
        const bps = await db.select().from(branchPolicies).where(eq(branchPolicies.organizationId, p.organizationId));
        return {
          ...p,
          rules,
          branchPolicies: bps.map((b) => ({
            pattern: b.pattern,
            requirePullRequest: b.requirePullRequest,
            requiredApprovals: b.requiredApprovals,
            requireCodeOwners: b.requireCodeOwners,
            requireAiReview: b.requireAiReview,
            requireSecurityScan: b.requireSecurityScan,
            requireTests: b.requireTests,
            requireSecretScan: b.requireSecretScan,
            enforceAdmins: b.enforceAdmins,
            preventForcePush: b.preventForcePush,
            preventDeletion: b.preventDeletion,
            requireSignedCommits: b.requireSignedCommits,
            requireLinearHistory: b.requireLinearHistory,
            requiredStatusChecks: (b.requiredStatusChecks as string[]) || []
          }))
        };
      })
    );

    return { data: result };
  });

  // CLI Policy Sync: Downloads cryptographically signed organization policy
  server.get('/cli/sync', { preHandler: [authenticateTenant] }, async (request, reply) => {
    const queryOrgId = (request.query as { organizationId?: string })?.organizationId;
    // Previously unauthenticated and defaulted to a hardcoded organization id,
    // so it served signed branch policy to anyone who asked.
    const orgId = resolveOrganizationId(request, reply, queryOrgId);
    if (!orgId) return;

    const defaultBranchPolicies: BranchProtectionRule[] = [
      {
        pattern: 'main',
        requirePullRequest: true,
        requiredApprovals: 2,
        requireCodeOwners: true,
        requireAiReview: true,
        requireSecurityScan: true,
        requireTests: true,
        requireSecretScan: true,
        enforceAdmins: true,
        preventForcePush: true,
        preventDeletion: true,
        requireSignedCommits: false,
        requireLinearHistory: true,
        requiredStatusChecks: ['CodeGuard Security & Review', 'CI / Tests']
      },
      {
        pattern: 'master',
        requirePullRequest: true,
        requiredApprovals: 2,
        requireCodeOwners: true,
        requireAiReview: true,
        requireSecurityScan: true,
        requireTests: true,
        requireSecretScan: true,
        enforceAdmins: true,
        preventForcePush: true,
        preventDeletion: true,
        requireSignedCommits: false,
        requireLinearHistory: true,
        requiredStatusChecks: ['CodeGuard Security & Review', 'CI / Tests']
      },
      {
        pattern: 'production',
        requirePullRequest: true,
        requiredApprovals: 2,
        requireCodeOwners: true,
        requireAiReview: true,
        requireSecurityScan: true,
        requireTests: true,
        requireSecretScan: true,
        enforceAdmins: true,
        preventForcePush: true,
        preventDeletion: true,
        requireSignedCommits: true,
        requireLinearHistory: true,
        requiredStatusChecks: ['CodeGuard Security & Review', 'CI / Tests']
      },
      {
        pattern: 'release/*',
        requirePullRequest: true,
        requiredApprovals: 2,
        requireCodeOwners: true,
        requireAiReview: true,
        requireSecurityScan: true,
        requireTests: true,
        requireSecretScan: true,
        enforceAdmins: true,
        preventForcePush: true,
        preventDeletion: true,
        requireSignedCommits: false,
        requireLinearHistory: true,
        requiredStatusChecks: ['CodeGuard Security & Review', 'CI / Tests']
      }
    ];

    const policyPayload: Policy = {
      id: 'pol-org-root',
      organizationId: orgId,
      name: 'Enterprise Zero-Trust Branch & Code Governance Policy',
      description: 'Authoritative organizational security policy with mandatory 2-person human approval and branch protection.',
      version: '1.2.0',
      level: 'ORGANIZATION',
      isDefault: true,
      enabled: true,
      branchPolicies: defaultBranchPolicies,
      rules: [
        {
          id: 'rule-sec-block',
          policyId: 'pol-org-root',
          name: 'Deterministic Secret Blocking',
          ruleType: 'SECRET_BLOCK',
          condition: {},
          action: 'BLOCK',
          enabled: true
        },
        {
          id: 'rule-sast-block',
          policyId: 'pol-org-root',
          name: 'High & Critical SAST Blocking',
          ruleType: 'SAST_BLOCK',
          condition: { minSeverity: 'HIGH' },
          action: 'BLOCK',
          enabled: true
        }
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const secretKey = process.env.CODEGUARD_SIGNING_KEY || 'codeguard-enterprise-policy-secret-key';
    const signedPolicy = PolicyEngine.signPolicy(policyPayload, secretKey);

    return {
      status: 'SUCCESS',
      data: signedPolicy
    };
  });

  // Create policy
  server.post('/policies', { preHandler: [authenticateTenant] }, async (request, reply) => {
    const body = createPolicySchema.parse(request.body);
    const targetOrgId = resolveOrganizationId(request, reply, body.organizationId);
    if (!targetOrgId) return;

    const [newPolicy] = await db
      .insert(policies)
      .values({
        organizationId: targetOrgId,
        repositoryId: body.repositoryId,
        name: body.name,
        description: body.description,
        isDefault: body.isDefault,
        enabled: body.enabled
      })
      .returning();

    // Insert rules
    if (body.rules.length > 0) {
      await db.insert(policyRules).values(
        body.rules.map((r) => ({
          policyId: newPolicy.id,
          name: r.name,
          ruleType: r.ruleType,
          condition: r.condition,
          action: r.action,
          enabled: r.enabled
        }))
      );
    }

    // Audit log
    await db.insert(auditLogs).values({
      organizationId: newPolicy.organizationId,
      actorId: request.tenant?.userId || 'system',
      actorType: 'USER',
      action: 'POLICY_CREATED',
      resourceType: 'POLICY',
      resourceId: newPolicy.id,
      metadata: { name: newPolicy.name, rulesCount: body.rules.length }
    });

    const rules = await db.select().from(policyRules).where(eq(policyRules.policyId, newPolicy.id));
    return reply.status(201).send({ data: { ...newPolicy, rules } });
  });
}
