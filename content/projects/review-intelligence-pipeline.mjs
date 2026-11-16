export default {
  slug: 'review-intelligence-pipeline',
  order: 1,
  featured: true,
  source: 'projects/work/ecommerce-review-intelligence-pipeline.md',

  title: 'E-commerce Product Review Intelligence Pipeline',
  shortTitle: 'Review Intelligence Pipeline',
  summary:
    'A review analytics platform behind a consumer product: 66.4M reviews across about 1M products and nine e-commerce sources, each review run through fake-review detection, sentiment and characteristics scoring.',
  figure: { value: '66.4M', label: 'reviews, 9 sources' },
  context: 'IMPRODATA',
  period: 'Oct 2024 – present',
  role: 'Data Engineer, owner of the pipeline',
  status: { kind: 'live', label: 'v1–v4 ran in production · v5 awaiting first run' },
  stack: [
    'AWS S3',
    'SQS',
    'Lambda',
    'Step Functions',
    'Glue',
    'SageMaker Processing',
    'RDS PostgreSQL',
    'OpenSearch',
    'DynamoDB',
    'CloudFormation',
    'Databricks',
    'RunPod',
    'vLLM',
    'Python',
  ],

  // Shown under the home-page hero and inside the case study.
  evolution: {
    title: 'One pipeline, five architectures',
    intro:
      'The review pipeline I own has been rebuilt four times. Each rebuild removed the biggest cost or bottleneck the previous design exposed, and each time the constraint moved somewhere else.',
    versions: [
      {
        v: 'v1',
        short: 'Glue + Databricks',
        name: 'Glue and Databricks, inference on CPU',
        flow: [
          'Scrapers',
          'S3',
          { t: 'Glue', note: 'flatten' },
          { t: 'Databricks', note: 'classifiers on CPU', hot: true },
          { t: 'External GPU VM', note: 'extraction' },
          { t: 'Glue', note: 'join stage files' },
          'Postgres + OpenSearch',
        ],
        removedLabel: 'Starting point',
        removed:
          'Every step wrote its own Parquet file to S3 and Glue joined them at the end.',
        exposed:
          'The classifiers ran on CPU for GPU-shaped work, and Databricks was only a courier for the extraction stage: it shipped data out to a VM and waited for results.',
      },
      {
        v: 'v2',
        short: 'GPU on Databricks',
        name: 'Classifiers moved onto a Databricks GPU',
        flow: [
          'Scrapers',
          'S3',
          { t: 'Glue', note: 'flatten' },
          { t: 'Databricks GPU', note: 'DBU charge on top of EC2', hot: true },
          { t: 'Glue', note: 'join stage files' },
          'Postgres + OpenSearch',
        ],
        removed: 'CPU inference. Same shape as v1, with the models on the hardware they need.',
        exposed:
          'Cost was counted twice. Databricks provisions VMs on AWS, so the EC2 bill arrived with a DBU charge on top, for a workload that is just "run these models over a batch".',
      },
      {
        v: 'v3',
        short: 'RunPod',
        name: 'Self-hosted RunPod GPUs, one Parquet handoff',
        flow: [
          'Scrapers',
          { t: 'Glue', note: 'flatten' },
          { t: 'S3', note: 'crossed the public internet', hot: true },
          { t: 'RunPod GPU', note: 'all three models' },
          { t: 'S3', hot: true },
          { t: 'Glue' },
          'Postgres + OpenSearch',
        ],
        removed:
          'The platform markup. Per-stage files also collapsed to one in, one out. Mistral 7B, quantized to 4-bit AWQ and served with vLLM, fit next to the classifiers on a single 24 GB GPU.',
        exposed:
          'RunPod sits outside AWS, so every S3 read and write paid standard egress. Egress scaled with volume and became the biggest line on the bill.',
      },
      {
        v: 'v4',
        short: 'GPU on the database',
        name: 'GPU workers claim work straight from Postgres',
        flow: [
          'Scrapers',
          { t: 'Glue', note: 'flatten' },
          { t: 'Postgres', note: 'shared with the live app', hot: true },
          { t: 'GPU workers', note: 'FOR UPDATE SKIP LOCKED' },
          'OpenSearch',
        ],
        removed:
          'S3 egress. The usual fix is to move compute into AWS. I asked why files were crossing a network boundary at all, and took the transfer out of the loop.',
        exposed:
          'Batch inference and the live application shared one database. Free before launch, but under real traffic an inference run would starve the website, and long-lived worker sessions were already stalling autovacuum.',
      },
      {
        v: 'v5',
        short: 'Event-driven',
        name: 'Event-driven and serverless, no standing GPU',
        flow: [
          { t: 'S3 event' },
          'SQS',
          { t: 'Lambda', note: 'collects a batch' },
          'Step Functions',
          { t: 'Glue', note: 'dedup, uniform chunks' },
          { t: 'SageMaker Processing', note: 'GPU for the batch only' },
          'RDS + OpenSearch',
        ],
        removed:
          'Database contention, always-on GPU cost and manual operation. The GPU stage reads Parquet and never touches the database, and instances exist only while a batch runs.',
        exposedLabel: 'Where it stands',
        exposed:
          'Deployed, but it has not run a production batch yet. It is blocked on a 66M-row hash backfill that I chose to diagnose before the first run and not after.',
      },
    ],
  },

  sections: [
    {
      title: 'Problem',
      blocks: [
        'Reviews are scraped from nine e-commerce platforms and are only useful once they are normalized, deduplicated and enriched with structured signals. The pipeline turns deeply nested scraper JSON into classified, scored, searchable review data behind a consumer product.',
        'Scale is **66.4M reviews across about 1M products**. Scraper drops are unbounded and unpredictable: a handful of reviews in one file, millions in the next. Nothing downstream can assume a file is a safe unit of work.',
      ],
    },
    {
      title: 'Five architectures',
      blocks: [
        'I have rebuilt this pipeline four times. Each version was correct for the constraint it was built under, and each one moved the constraint somewhere new.',
        { evolution: true },
        'The thread across all five: compute placement (v1 to v2), platform markup (v2 to v3), network egress (v3 to v4), then database contention and handover (v4 to v5).',
      ],
    },
    {
      title: 'The current design (v5)',
      blocks: [
        {
          pre: `scrapers → S3 (one prefix per platform)
  → S3 ObjectCreated event → SQS (+ dead-letter queue)
  → collector Lambda (EventBridge tick every 15 min, concurrency 1)
      drains pending events into one batch, starts an execution
  → Step Functions
      ├─ Stage A: Glue (Spark, CPU)
      │    flatten · normalize · DEDUP via INSERT … ON CONFLICT … RETURNING
      │    → silver/<batch_id>/chunk_*.parquet + manifest
      │    (zero new reviews → stop here, no GPU job at all)
      └─ Stage B: SageMaker Processing (ephemeral GPU)
           authenticity → sentiment → characteristics, in memory
           background writer: UPDATE reviews · recompute product
           aggregates · upsert OpenSearch docs
  → DynamoDB control table (batch / chunk / file log)
  → failure handler Lambda → SNS → Slack`,
        },
        { h: 'Two ideas carry the design' },
        '**Dedup by inserting.** The Glue stage does not read existing hashes and hope its filter is right. It inserts every candidate against the database\'s own unique index and keeps only what `RETURNING` hands back. A repeat cannot duplicate a row however bad the scraper is, and "reaches the GPU" means "the database says it is new". A fully repeated drop produces zero chunks and never starts a GPU.',
        '**One bounded unit of work.** Spark absorbs the variance in drop size and repartitions everything into uniform chunks of about 20k reviews. Every later stage is bounded, the same size, and retryable per chunk. A big file means more chunks and more parallelism, with no manual sizing.',
        { h: 'Inference' },
        {
          table: {
            head: ['Stage', 'Model', 'Output'],
            rows: [
              ['Authenticity', 'DistilBERT fake-review detector', 'real or fake'],
              ['Sentiment', 'RoBERTa, 3-class', 'positive, negative or neutral, on real reviews only'],
              [
                'Characteristics',
                'Keyword mention-gate, then DeBERTa-v3 ABSA with a MiniLM embedding gate',
                'per-product characteristics with a 0–5 score per review',
              ],
            ],
          },
        },
        'The mention-gate is mandatory. The ABSA model has no "not mentioned" class, so asked about an aspect a review never discusses it invents a polarity. I measured `price → Negative 0.84` on a review that never mentions price. Gate first, score only what was mentioned.',
        { h: 'Reliability' },
        {
          ul: [
            '**Idempotent writes.** `UPDATE` keyed on the composite primary key, aggregates recomputed and not incremented, OpenSearch upserted by id. That is what makes retries safe.',
            '**Resume from Parquet.** The dedup insert consumes the "newness" it deduped on, so a retry must never re-run it. Retries resume at the GPU stage from the retained Parquet and skip chunks already done.',
            '**Orphan backstop.** A review with no classification is itself a durable "needs enrichment" marker in the database. A reconcile sweep finds anything stranded and re-enqueues it through the normal path.',
            '**Config selects behaviour, code holds behaviour.** Per-platform mappings are schema-validated JSON. Adding a platform is a reviewed pull request with one file.',
            '**82 tests** that run with no GPU, no models and no AWS credentials, plus CI that validates every mapping and deploys on merge.',
          ],
        },
        { h: 'Status' },
        'v5 is deployed, but it has not run a production batch. The blocker is data, not code: the canonical `review_hash` reproduces only 92% of stored hashes on one platform, 58% on another, 14% on a third and 0% on the other six. At least three hash formulas were used historically, and an earlier migration copied the column verbatim. Until a backfill recomputes it, re-scraped reviews would miss the unique index, duplicates would land in production and the GPU would re-enrich the back catalogue. Finding that before the first run is the reason it has not shipped.',
      ],
    },
    {
      title: 'Database engineering',
      blocks: [
        { h: 'Partitioning a 199M-row table' },
        'Queries were timing out and maintenance was degrading, so I partitioned the reviews table by LIST on `platform_id`. The old table is still in the database next to the new one, so this is a direct comparison.',
        {
          table: {
            head: ['', 'Before', 'After'],
            rows: [
              ['Structure', 'single heap', 'LIST-partitioned, 10 partitions + default'],
              ['Total size', '**95 GB** (69 GB heap + 26 GB indexes)', 'largest partition **20 GB**'],
              ['Largest maintenance unit', 'the whole 95 GB table', 'one 27.1M-row partition'],
              ['Primary key', '`review_id`', '`(platform_id, review_id)`'],
              ['Autovacuum', 'needed per-table overrides', 'server defaults on every partition'],
            ],
          },
        },
        'The number that matters is not total size. It is the largest unit any single maintenance operation has to touch: 95 GB down to 20 GB, and under 5 GB for six of the ten partitions. VACUUM, ANALYZE and index builds now run per partition and in parallel.',
        'PostgreSQL cannot convert a table to partitioned in place, so this was a rebuild. I wrote the copy to be resumable and re-runnable: a per-platform work queue, `INSERT … SELECT … WHERE NOT EXISTS` so each product is all-or-nothing, and `ON CONFLICT DO NOTHING` so a re-run after a crash cannot duplicate. Where a review had duplicates, the copy kept the row with enrichment already done.',
        'A later migration changed uniqueness from per-platform to per-product. That one used `CREATE UNIQUE INDEX CONCURRENTLY` per partition, attached to an `ON ONLY` parent index, so the pipeline kept writing throughout.',
        { h: 'An autovacuum stall' },
        'Bloat grew and query plans degraded because autovacuum could not reclaim dead tuples. The v4 GPU workers sat on long-lived sessions, claiming work with `FOR UPDATE SKIP LOCKED`, and held back the oldest transaction. I traced it by comparing `backend_xmin` age in `pg_stat_activity` against dead tuple counts per table.',
        'The interim fix was tuning. On a 199M-row table the default scale factor of 0.2 waits for roughly 40M dead tuples before autovacuum starts, so I dropped it to 0.01 on that table and shortened the naptime server-wide. The real fix was architectural: partitioning made the overrides unnecessary, and v5 no longer holds long transactions at all.',
      ],
    },
    {
      title: 'Key decisions',
      blocks: [
        {
          decisions: [
            {
              title: 'Leave Databricks (v2 to v3)',
              body: 'The DBU charge sat on top of the EC2 bill it provisioned, for a workload that was only batch inference.',
            },
            {
              title: 'Remove the transfer, do not optimise it (v3 to v4)',
              body: 'Moving compute into AWS is the standard fix for egress. Taking the network boundary out of the loop was cheaper still, until launch changed the constraint.',
            },
            {
              title: 'Dropping the LLM was the architectural decision (v5)',
              body: 'vLLM needs a persistent GPU server, and that server was the only reason the pipeline had to be always-on. Swapping Mistral for DeBERTa ABSA is what made "no standing GPU" possible.',
            },
            {
              title: 'Glue for reshaping, SageMaker Processing for inference',
              body: 'Running everything on one GPU job would pay GPU rates for CPU data-wrangling and lose Spark\'s handling of unbounded file sizes.',
            },
            {
              title: 'Dedup against a unique index, not in application code',
              body: 'Duplicate-free becomes a property of a constraint, not of my filter being right.',
            },
            {
              title: 'Control state in DynamoDB, not a mutable S3 manifest',
              body: 'Atomic per-item writes, after ETag contention made the S3 version fragile.',
            },
            {
              title: 'Partition instead of tuning autovacuum forever',
              body: 'The overrides worked, but they were compensating for a table that had outgrown a single heap.',
            },
          ],
        },
      ],
    },
    {
      title: 'Impact',
      blocks: [
        {
          ul: [
            '**66.4M reviews, about 1M products, nine platforms** under management.',
            '**Largest maintenance unit cut from 95 GB to 20 GB**, and the autovacuum overrides the old table needed are gone.',
            '**Nine per-platform ingest scripts became one generic Glue job** plus config files. Adding a platform went from a code change to one JSON file.',
            'In v5, **idle GPU cost and manual operation are designed out**: instances exist only for a batch, and new scrapes are processed unattended. Cost and throughput numbers will come with the first production run.',
          ],
        },
      ],
    },
    {
      title: 'What I would do differently',
      blocks: [
        {
          ul: [
            '**Pin the hash definition on day one.** Three divergent formulas accumulated across the old per-platform scripts, and that is what blocks v5 today. One canonical definition pinned by a test would have cost nothing.',
            '**Normalize the hash during the migration.** The partitioning copy was the one moment every row was already being rewritten. Recomputing the column there would have been almost free. Deferring it turned a free fix into a separate 66M-row backfill on the critical path.',
            '**Set up a staging environment before rebuilding.** Every v5 decision had to be conservative because there was nowhere to try it that was not user-visible.',
            '**Measure the drop-size distribution first.** Chunk size, instance count and retry counts are reasoned placeholders until real volumes per drop are characterised.',
          ],
        },
      ],
    },
  ],
};
