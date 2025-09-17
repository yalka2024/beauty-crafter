# Runbook: Chaos Engineering (Gremlin/Chaos Mesh)

## Purpose
- Proactively test reliability by injecting controlled failures.

## Steps
1. Choose a chaos tool (e.g., Gremlin, Chaos Mesh).
2. Plan a failure scenario (e.g., kill DB pod, network latency, CPU spike).
3. Notify team/on-call before running tests.
4. Run chaos experiment (see tool docs for commands).
5. Monitor system behavior, alerts, and recovery.
6. Document results and lessons learned in [incident-log.md](../incident-log.md)
