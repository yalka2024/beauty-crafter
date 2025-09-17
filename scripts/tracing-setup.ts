// Distributed Tracing Setup Example (OpenTelemetry)
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { JaegerExporter } from '@opentelemetry/exporter-jaeger';

const provider = new NodeTracerProvider();
provider.addSpanProcessor(new SimpleSpanProcessor(new JaegerExporter({
  serviceName: 'beauty-crafter',
  endpoint: process.env.JAEGER_ENDPOINT || 'http://localhost:14268/api/traces',
})));
provider.register();

// Use OpenTelemetry API in your app for tracing
