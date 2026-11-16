export default {
  slug: 'real-estate-sales-dashboard',
  order: 9,
  featured: false,
  source: 'projects/work/real-estate-sales-dashboard.md',

  title: 'Real Estate Sales Performance Dashboard',
  summary:
    'Power BI dashboards on BigQuery covering the full funnel, from leads captured to client payment progress against build phase, used by the sales manager across a team of 10–14 reps.',
  figure: { value: '10–14 reps', label: 'tracked per salesperson' },
  // Filter chips on the home page. Keys are defined in site.mjs work.tags.
  tags: ['bi'],
  // The three-line version at the top of the case study.
  brief: {
    problem: "Leads, sales, mortgages, construction progress and client payments were tracked separately, if at all.",
    did: "Built Power BI dashboards on an existing BigQuery warehouse, putting the sales funnel and the delivery timeline side by side.",
    result: "Used by the sales manager to review 10–14 salespeople and to spot clients behind on payment and builds behind schedule.",
  },
  context: 'IMPRODATA',
  period: 'Aug 2023 – Apr 2024',
  role: 'Data Analyst, dashboard layer',
  status: { kind: 'shipped', label: 'Shipped' },
  // One row: drawn as the diagram on the case study and as icons on the home card.
  chain: [
    { i: 'bigquery', t: 'BigQuery', s: 'existing warehouse' },
    { i: 'table', t: 'Metric model', s: 'import mode' },
    { i: 'powerbi', t: 'Power BI', s: 'funnel + delivery' },
    { i: 'user', t: 'Sales manager', s: 'daily review' },
  ],
  stack: ['BigQuery', 'Power BI'],

  sections: [
    {
      title: 'Problem',
      blocks: [
        'There was no single view of the sales funnel or of pipeline health. Lead volume, conversion, salesperson performance and how long properties had been in construction were all tracked separately, if at all.',
      ],
    },
    {
      title: 'What I built',
      blocks: [
        { h: 'Funnel: is the business converting?' },
        {
          ul: [
            'Leads captured, and which salesperson called each one.',
            'Leads closed, so capture-to-close conversion overall and per rep.',
          ],
        },
        { h: 'Pipeline and delivery: what is the state of what we are selling?' },
        {
          ul: [
            'Houses sold per salesperson, pending mortgages, outstanding inventory.',
            'Construction milestone dates per property, and how long each had sat in its current phase.',
            'Client payment progress against the build phase.',
          ],
        },
        'The construction view is what made this more than a sales report. It put lead generation, sales and delivery timelines side by side, so a stalled build showed up next to the pipeline it was blocking.',
        { h: 'Scope of my contribution' },
        'Dashboard layer only. The BigQuery warehouse was built and populated by another team. My work was the metric modelling and the Power BI build: defining what "conversion", "time in phase" and "payment progress" meant in terms of the columns available.',
      ],
    },
    {
      title: 'Key decisions',
      blocks: [
        {
          decisions: [
            {
              title: 'Import, not DirectQuery',
              body: 'Nothing here changes minute to minute, so there was no reason to fire a live BigQuery query for every click on a dashboard a manager uses repeatedly.',
            },
            {
              title: 'Refresh cadence follows decision cadence',
              body: 'The manager reviews in daily cycles, so once or twice a day is the honest refresh rate. It should match how often the decision is made, not how fresh the data could be.',
            },
          ],
        },
      ],
    },
    {
      title: 'Impact',
      blocks: [
        'Used by the sales manager as an operational review tool, to answer three questions the business could not see in one place.',
        {
          ul: [
            'Is this salesperson converting?',
            'Is this client behind on payment?',
            'Are we behind on the build?',
          ],
        },
      ],
    },
  ],
};
