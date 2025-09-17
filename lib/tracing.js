// lib/tracing.js
// OpenTelemetry tracing setup for Next.js (Node.js)
// This is a robust starter for distributed tracing in production environments.

const { NodeSDK } = require('@opentelemetry/sdk-node');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');
const { SemanticResourceAttributes } = require('@opentelemetry/semantic-conventions');


// Configure the OTLP exporter (change endpoint as needed)
const traceExporter = new OTLPTraceExporter({
  url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318/v1/traces',
});

const resource = {
  attributes: {
    [SemanticResourceAttributes.SERVICE_NAME]: process.env.OTEL_SERVICE_NAME || 'beauty-crafter-nextjs',
  },
  merge: function () { return this; } // No-op merge to satisfy SDK
};

const sdk = new NodeSDK({
  resource,
  traceExporter,
  instrumentations: [getNodeAutoInstrumentations()],
});


const maybePromise = sdk.start();
if (maybePromise && typeof maybePromise.then === 'function') {
  maybePromise
    .then(() => {
      console.log('OpenTelemetry tracing initialized');
    })
    .catch((error) => {
      console.warn('OpenTelemetry tracing failed to initialize:', error);
    });
} else {
  console.log('OpenTelemetry tracing initialized (sync or undefined return)');
}

// Optional: Graceful shutdown
process.on('SIGTERM', () => {
  sdk.shutdown()
    .then(() => console.log('Tracing terminated'))
    .catch((error) => console.log('Error terminating tracing', error))
    .finally(() => process.exit(0));
});