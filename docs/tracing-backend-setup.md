# Observability & Tracing Backend Setup

## Deploy a Trace Backend
- Choose Jaeger, Tempo, or Honeycomb.
- Deploy using Helm, Docker, or managed service.
- Example (Jaeger with Helm):
  ```sh
  helm repo add jaegertracing https://jaegertracing.github.io/helm-charts
  helm install jaeger jaegertracing/jaeger
  ```

## Configure Export Endpoint
- Set `OTEL_EXPORTER_OTLP_ENDPOINT` in your environment (e.g., `http://jaeger-collector:4318/v1/traces`).

## Verify Traces
- Access the Jaeger UI and confirm traces are being collected from your app.

## Add Custom Spans
- In `lib/tracing.ts` or business logic:
  ```ts
  import { trace } from '@opentelemetry/api';
  const tracer = trace.getTracer('beauty-crafter');
  const span = tracer.startSpan('custom-business-operation');
  // ... business logic ...
  span.end();
  ```
