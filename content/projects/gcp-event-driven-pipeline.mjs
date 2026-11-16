export default {
  slug: 'gcp-event-driven-pipeline',
  order: 5,
  featured: true,
  source: 'projects/work/gcp-event-driven-pipeline-peachtree.md',

  title: 'GCP Event-Driven Pipeline and Store Scorecard',
  shortTitle: 'GCP Event-Driven Pipeline',
  summary:
    'An event-driven pipeline (Pub/Sub → Cloud Functions → BigQuery) ingesting a restaurant-franchise client\'s SFTP file drops, with a Power BI scorecard that rates each store 1–5 and sets its manager\'s commission.',
  figure: { value: '4 feeds', label: 'schema-validated into BigQuery' },
  context: 'IMPRODATA, for Peachtree Partners',
  period: '2024 – 2025',
  role: 'Designer and developer',
  status: { kind: 'shipped', label: 'Shipped' },
  stack: ['GCP Pub/Sub', 'Cloud Functions', 'BigQuery', 'SFTP', 'Python', 'Power BI', 'DAX'],

  sections: [
    {
      title: 'Problem',
      blocks: [
        'The client operates restaurant franchises in the US. Financial and operational data for the stores arrived from several sources as SFTP file drops, mostly weekly, with one file monthly. Four Excel sources in total.',
        'Two manual processes sat on that: getting the files into a warehouse at all, and the Excel work that turned them into the store performance scores driving manager commission.',
      ],
    },
    {
      title: 'What I built',
      blocks: [
        {
          pre: `file drop → Pub/Sub event → Cloud Function fetches from SFTP
          → schema validation → transformations → BigQuery → Power BI scorecard`,
        },
        'Four file-to-table mappings, each with its own transformation path. Malformed input is caught by schema checks at the transformation step and never reaches BigQuery.',
        'On top sits a Power BI scorecard: a star-schema model with DAX measures for weighted KPI scoring and bonus tiers. It rates each store 1–5, and that rating determines the store manager\'s commission.',
      ],
    },
    {
      title: 'Key decisions',
      blocks: [
        {
          decisions: [
            {
              title: 'Event-driven, not scheduled',
              body: 'The cadences are mixed, so a cron would have meant either stale data or runs that find nothing. Reacting to the drop itself also makes a late file a non-event: it processes when it lands.',
            },
            {
              title: 'One transformation path per mapping',
              body: 'The four sources had different shapes. A single generalised transform would have been a config format pretending to be a pipeline.',
            },
            {
              title: 'Schema validation before load',
              body: 'The output drives commission payments, so wrong data reaching the model is worse than data not arriving.',
            },
            {
              title: 'Scoring logic in DAX, not in the warehouse',
              body: 'Bonus tiers and KPI weights are business rules the client changes. Keeping them in the model meant they could be revised without a pipeline deploy.',
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
            'Four feeds automated end to end, removing the manual ingest step for every weekly drop and the monthly file.',
            'Replaced the Excel process that produced store performance scores.',
            'Used by the client\'s management to rate each store, which sets the manager\'s commission. The output is a payment input, not just a report.',
          ],
        },
      ],
    },
    {
      title: 'What I would do differently',
      blocks: [
        {
          ul: [
            '**Alert on a file that never arrives.** Event-driven means a drop that does not happen produces no event and no failure. The scorecard quietly shows last period\'s data. A per-source expected-cadence check would close the one gap the architecture creates.',
            '**Version the scoring rules.** With weights living in DAX, a change silently restates every past period. If the numbers set commission, last quarter\'s score should stay reproducible.',
          ],
        },
      ],
    },
  ],
};
