export default {
  slug: 'jove-performance-dashboard',
  order: 8,
  featured: false,
  source: 'projects/work/jove-performance-dashboard.md',

  title: 'JoVE Performance Dashboard',
  summary:
    'A Power BI star-schema model and report over a Cassandra source for an educational video platform, built around rank change between any two periods the user picks.',
  figure: { value: '2 periods', label: 'compared, any two windows' },
  context: 'IMPRODATA, for JoVE',
  period: 'Aug 2023 – Apr 2024',
  role: 'Data Analyst',
  status: { kind: 'shipped', label: 'Shipped' },
  // One row: drawn as the diagram on the case study and as icons on the home card.
  chain: [
    { i: 'apachecassandra', t: 'Cassandra', s: 'usage data' },
    { i: 'flow', t: 'ODBC', s: 'driver' },
    { i: 'table', t: 'Star schema', s: 'fact + dimensions' },
    { i: 'powerbi', t: 'Power BI', s: 'rank change' },
  ],
  stack: ['Cassandra (ODBC)', 'Power BI', 'DAX', 'Power Query'],

  sections: [
    {
      title: 'Problem',
      blocks: [
        'JoVE runs an educational video platform sold by institutional subscription. They needed to see which subjects, articles and institutions were pulling views and, more importantly, which way those numbers were moving. A flat "top articles this month" list does not tell you whether a subject is rising or an institution is going quiet before renewal.',
      ],
    },
    {
      title: 'What I built',
      blocks: [
        'A Power BI report over the platform\'s Cassandra store, on three pages.',
        {
          ul: [
            '**General**: institution engagement, subject and product-type breakdowns, headline movement.',
            '**Deep dive**: drill-down into individual institutions, subjects and articles.',
            '**QC**: a data-quality page for validating the numbers, plus a refresh timestamp so users could see how fresh the data was.',
          ],
        },
        'The model is a star schema: one usage fact, with institution, article, subject, geography and subscription-status dimensions, plus two disconnected period tables.',
      ],
    },
    {
      title: 'Key decisions',
      blocks: [
        {
          decisions: [
            {
              title: 'Two disconnected period tables, not one date dimension',
              body: 'The report\'s central question is comparison. The user picks any two windows independently and every measure evaluates twice. A single connected date dimension can filter to one window at a time; it cannot express "compare these two arbitrary ranges" without hard-coding the offset.',
            },
            {
              title: 'Rank change as the headline, not rank',
              body: 'A rank on its own is a leaderboard. A rank change is a signal that something needs attention.',
            },
            {
              title: 'Star schema in the model, not a flat table',
              body: 'Cassandra is built for fast lookups on a known key, not the group-by queries a dashboard fires. Modelling facts and dimensions kept aggregation inside Power BI\'s engine.',
            },
            {
              title: 'A QC page shipped with the report',
              body: 'It costs a page and buys the ability to answer "is this broken, or is the business actually down?" without opening the model.',
            },
          ],
        },
      ],
    },
    {
      title: 'Impact',
      blocks: [
        'Used by management as a commissioning input: which subjects and articles were being consumed, and so what to produce more of. With subscription status in the model next to usage and rank change, it also gave the usage evidence behind renewal conversations with institutions.',
      ],
    },
    {
      title: 'What I would do differently',
      blocks: [
        'Land the Cassandra data in a warehouse and model it there, not inside Power BI over ODBC. Same star schema, but reusable by more than this one report.',
      ],
    },
  ],
};
