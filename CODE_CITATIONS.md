# Code Citations

## License: unknown
https://github.com/earthly/website/tree/18a9301748cd9d51174e773f162ae5c245ccfc0b/blog/_posts/2023-01-15-k8s-distributed-tracing.md

```
require('@opentelemetry/sdk-node');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');
const { Resource
```


## License: unknown
https://github.com/SigNoz/signoz/tree/d7d4000240695c35a8d8a3b335b0eecd0796c823/frontend/src/container/OnboardingContainer/APM/Javascript/md-docs/express.md

```
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');
const { Resource } = require('@opentelemetry/resources');
const { SemanticResourceAttributes } = require('@opentelemetry/semantic-conventions');

//
```


## License: unknown
https://github.com/SoftwareMaker1909/actions/tree/e318daa94eda355939836ee1aba88733ab892709/tracing.cjs

```
node');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');
const { Resource } = require('@opentelemetry/
```


## License: unknown
https://github.com/azar-intelops/signoz-next-opentelemetry/tree/929e9d757c2d1d07b45c1a9ef73d004f2f083b25/tracing.js

```
;
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');
const { Resource } = require('@opentelemetry/resources');
const { SemanticResourceAttributes } = require('@opentelemetry/semantic-conventions');

/
```


## License: CC_BY_SA_4_0
https://github.com/wenerme/wener/tree/7f8915b14f2b6e46218968b484bb20fc21bf817a/notes/service/observability/tracing/opentelemetry/README.md

```
=> {
  sdk.shutdown()
    .then(() => console.log('Tracing terminated'))
    .catch((error) => console.log('Error terminating tracing', error))
    .finally(() => process.
```

