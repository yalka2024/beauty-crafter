// OpenTelemetry tracing setup for Node.js/Next.js
// @ts-ignore
import { NodeSDK } from '@opentelemetry/sdk-node';
// @ts-ignore
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
// @ts-ignore
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
// @ts-ignore
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
// @ts-ignore
import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';

diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.INFO);

const traceExporter = new OTLPTraceExporter({
  url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318/v1/traces',
});

const prometheusExporter = new PrometheusExporter({
  port: 9464,
  startServer: true,
});

const sdk = new NodeSDK({
  traceExporter,
  metricExporter: prometheusExporter,
  instrumentations: [getNodeAutoInstrumentations()],
});

sdk.start()
  .then(() => {
    console.log('OpenTelemetry tracing initialized');
  })
  .catch((error: any) => {
    console.error('Error initializing OpenTelemetry', error);
  });

// Export for manual span creation if needed
export default sdk;
