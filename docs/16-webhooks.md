# Webhook Ingestion & Event Processing

## Cryptographic Webhook Security

The `/api/webhooks/github` and `/api/webhooks/gitlab` endpoints validate payloads using HMAC-SHA256 signatures before processing.

### GitHub Webhook Signature Verification
```typescript
const hmac = crypto.createHmac('sha256', secret);
hmac.update(rawBody);
const expectedSignature = `sha256=${hmac.digest('hex')}`;
const isValid = crypto.timingSafeEqual(
  Buffer.from(signatureHeader, 'utf8'),
  Buffer.from(expectedSignature, 'utf8')
);
```

### Supported Webhook Events
- `pull_request.opened` / `pull_request.synchronize`: Triggers full review pipeline.
- `pull_request_review.submitted`: Triggers merge gate re-evaluation.
- `branch_protection_rule.edited` / `branch_protection_rule.deleted`: Triggers instant drift detection and auto-remediation.
- `ping`: Health verification.
