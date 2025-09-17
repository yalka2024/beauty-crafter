# Code & Dependency Hygiene Checklist

- [ ] Review and merge Dependabot PRs regularly.
- [ ] Run Snyk scans and address all critical/high vulnerabilities.
- [ ] Remove unused dependencies from `package.json`.
- [ ] Remove dead code and unused files.
- [ ] Run `pnpm audit` and `pnpm outdated` regularly.
- [ ] Document all major dependency upgrades in [incident-log.md](../incident-log.md).
