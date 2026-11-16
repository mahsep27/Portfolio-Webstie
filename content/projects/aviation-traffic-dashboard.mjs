export default {
  slug: 'aviation-traffic-dashboard',
  order: 10,
  featured: false,
  source: 'projects/work/global-aviation-traffic-dashboard.md',

  title: 'Global Aviation Traffic Dashboard',
  summary:
    'A near-real-time Amazon QuickSight dashboard over Hive, tracking in-flight and on-ground aircraft and ranking the busiest airports worldwide in 15-minute windows.',
  figure: { value: '15 min', label: 'windows, matched to the client' },
  context: 'IMPRODATA',
  period: 'Aug 2023 – Apr 2024',
  role: 'Data Analyst, dashboard layer',
  status: { kind: 'shipped', label: 'Shipped' },
  stack: ['Hive (SQL)', 'Amazon QuickSight'],

  sections: [
    {
      title: 'Problem',
      blocks: [
        'The client needed a near-real-time view of global aviation traffic: what is in the air, what is on the ground, and which airports are busiest right now.',
      ],
    },
    {
      title: 'What I built',
      blocks: [
        'A QuickSight dashboard on a 15-minute refresh, tracking in-flight and on-ground aircraft and surfacing the busiest airports globally. Traffic data was queried out of Hive.',
        { h: 'Scope of my contribution' },
        'I built the dashboard layer, not the Hive platform underneath it. The tables and ingestion were already in place. My work was the metric modelling, the quarter-hour bucketing, the airport rankings and the QuickSight build.',
      ],
    },
    {
      title: 'Key decisions',
      blocks: [
        {
          decisions: [
            {
              title: '15 minutes is the grain of the question, not a technical limit',
              body: 'The client reasoned about traffic in quarter-hour blocks. Refreshing faster would show partial buckets; refreshing slower would leave completed ones invisible.',
            },
            {
              title: 'Query Hive where the data already landed',
              body: 'No separate store was stood up for the dashboard.',
            },
          ],
        },
      ],
    },
    {
      title: 'Impact',
      blocks: [
        'Not measured. This was early-career work and I never asked who used the dashboard or what it changed. That is the lesson I took from it: ask what decision a dashboard is supposed to change before building it.',
      ],
    },
  ],
};
