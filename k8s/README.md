# Kubernetes Manifests for beauty-crafter

This directory contains Kubernetes manifests for deploying the beauty-crafter platform in an enterprise environment.

## Files
- `deployment.yaml`: Main app deployment and service
- `ingress.yaml`: Ingress resource for external access
- `secrets.yaml`: Kubernetes secrets (base64-encoded)
- `redis.yaml`: Redis deployment and service
- `postgres.yaml`: Postgres deployment and service
- `monitoring.yaml`: Prometheus ServiceMonitor and alert rules
- `prometheus.yaml`: Prometheus deployment
- `alertmanager.yaml`: Alertmanager deployment and service
- `grafana.yaml`: Grafana deployment and service
- `rbac.yaml`: RBAC roles and bindings
- `networkpolicy.yaml`: Network policy for security

## Usage
1. **Set secrets**: Edit `secrets.yaml` and base64-encode your secrets.
2. **Apply manifests**:
   ```sh
   kubectl apply -f .
   ```
3. **Monitor**: Prometheus, Alertmanager, and Grafana are included for observability.
4. **Update images**: Set the correct Docker image in `deployment.yaml`.

## Security & Compliance
- RBAC, network policies, and secrets are included.
- Monitoring and alerting are preconfigured for reliability.
