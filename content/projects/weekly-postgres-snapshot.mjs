export default {
  slug: 'weekly-postgres-snapshot',
  order: 12,
  featured: false,
  source: 'projects/work/weekly-postgres-snapshot-automation.md',

  title: 'Weekly Postgres Snapshot Automation',
  summary:
    'A weekly as-of-date PostgreSQL snapshot feeding a client\'s Metabase reporting, built inside a scoped-user, IP-whitelisted access boundary and verified entirely through SQL.',
  figure: { value: 'Weekly', label: 'append-only snapshot' },
  context: 'IMPRODATA, client engagement',
  period: 'Dec 2025',
  role: 'Developer',
  status: { kind: 'shipped', label: 'Shipped' },
  // One row: drawn as the diagram on the case study and as icons on the home card.
  chain: [
    { i: 'postgresql', t: 'Postgres', s: 'live tables' },
    { i: 'clock', t: 'cron', s: 'weekly' },
    { i: 'python', t: 'Python script', s: 'query + append' },
    { i: 'table', t: 'Snapshot table', s: 'append-only' },
    { i: 'metabase', t: 'Metabase', s: 'week-over-week' },
  ],
  stack: ['Python', 'PostgreSQL', 'cron', 'DigitalOcean', 'Metabase'],

  sections: [
    {
      title: 'Problem',
      blocks: [
        'The client\'s Metabase reporting needed an as-of-date view the live tables could not provide. Current rows only ever show today, so week-over-week movement was unrecoverable after the fact.',
      ],
    },
    {
      title: 'What I built',
      blocks: [
        'A small Python script that connects to Postgres, runs a query and appends the result to a dedicated snapshot table, scheduled with cron on an always-on droplet. Metabase reports off the snapshot table.',
        'It is deliberately unremarkable engineering: a script and a cron entry. What was worth noting is the boundary it was built inside: a scoped database user, IP whitelisting, and no admin or dashboard access. Correctness had to be provable from the database side alone.',
      ],
    },
    {
      title: 'Key decisions',
      blocks: [
        {
          decisions: [
            {
              title: 'Append-only, never mutate history',
              body: 'The point of the table is that past rows never change. An update path would defeat it.',
            },
            {
              title: 'cron on an existing droplet',
              body: 'It was already always-on for other work, so this added no infrastructure and no cost.',
            },
            {
              title: 'Verified through SQL, not the BI tool',
              body: 'No dashboard access was granted, so I checked the snapshot table with direct queries.',
            },
          ],
        },
      ],
    },
    {
      title: 'Impact',
      blocks: [
        'Made week-over-week trend reporting possible in Metabase at all. Before the snapshot table existed, the reporting could only describe the present.',
      ],
    },
    {
      title: 'What I would do differently',
      blocks: [
        'Alert on a missed run. A cron job that fails leaves no gap anyone notices: the table stops growing and the trend line flattens. Since a week\'s row can never be reconstructed later, a silent failure is permanent data loss. A check on the latest snapshot date would cost almost nothing.',
      ],
    },
  ],
};
