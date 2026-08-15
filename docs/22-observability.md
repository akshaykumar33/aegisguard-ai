# Observability, Metrics & Telemetry

## Telemetry Architecture

CodeGuard emits structured JSON logs via Pino and tracks key operational metrics:

### Key Metrics
1. **Review Latency**: Time from webhook receipt to review comment publication (target: $< 30$ seconds).
2. **Queue Depth**: Number of pending review jobs in BullMQ / Redis.
3. **Secret Catch Rate**: Total high-confidence secrets intercepted before code merged.
4. **Drift Frequency**: Rate of branch protection drift events across connected repositories.
5. **Break-Glass Usage**: Frequency and duration of emergency override sessions.
