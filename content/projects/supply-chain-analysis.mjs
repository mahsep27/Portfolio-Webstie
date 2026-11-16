export default {
  slug: 'supply-chain-analysis',
  order: 11,
  featured: false,
  source: 'projects/work/supply-chain-analysis-lucky-core.md',

  title: 'Supply Chain Analysis',
  summary:
    'An analysis of 15 months of supply chain data that traced a Q1 sales decline to lapsed repeat customers, after first fixing a CRM migration that had split customer identities in two.',
  figure: { value: '15 months', label: 'of supply chain data' },
  // Filter chips on the home page. Keys are defined in site.mjs work.tags.
  tags: ['bi'],
  // The three-line version at the top of the case study.
  brief: {
    problem: "Sales were down and nobody could say why.",
    did: "Analysed 15 months of supply chain data, after first repairing customer identities that a CRM migration had split in two.",
    result: "Traced the decline to repeat customers who had stopped ordering, located inventory bottlenecks, and surfaced a gap in refund policy controls.",
  },
  context: 'Alikhan Consultants, for Lucky Core Industries',
  period: 'Jul – Aug 2024',
  role: 'Data Analyst',
  status: { kind: 'shipped', label: 'Delivered' },
  // One row: drawn as the diagram on the case study and as icons on the home card.
  chain: [
    { i: 'file', t: '15 months of data', s: 'sales, refunds' },
    { i: 'user', t: 'Entity resolution', s: 'fix split customers' },
    { i: 'filter', t: 'Recency cohorts', s: 'who stopped buying' },
    { i: 'powerbi', t: 'Findings', s: 'delivered' },
  ],
  stack: ['Excel', 'Power BI'],

  sections: [
    {
      title: 'Problem',
      blocks: ['Sales were down and nobody could say why.'],
    },
    {
      title: 'Method',
      blocks: [
        { h: 'Entity resolution first' },
        'The client had migrated CRM systems partway through the period, and the migration rewrote customer names to uppercase. The same customer appeared as two entities either side of the switch, so a straight match on name split one customer\'s history in two.',
        'That produced exactly the wrong answer: a long-standing customer looked like a churned customer plus a new one, which inflated new business and hid the real churn. Normalizing before matching is what made every later number trustworthy.',
        'The general lesson: a system migration is a data-quality event. Check whether identifiers survived it before trusting any trend that crosses the migration date.',
        { h: 'Isolating the Q1 decline' },
        'I segmented customers by purchase recency: who had bought repeatedly through the previous year but placed no order in the current quarter. That cohort accounted for the shortfall.',
        'This flipped the diagnosis. The story was not "we are failing to win new business". It was "customers we already had quietly stopped re-ordering". One is an acquisition problem; the other is an account-management problem.',
        { h: 'A refund-timing pattern' },
        'Looking at sales and refunds over time surfaced a repeating shape: sales booked in the last days of a month and refunded early in the next. The data shows a timing pattern and nothing about intent. What the analysis establishes is that the refund policy had no control preventing that shape.',
      ],
    },
    {
      title: 'Findings',
      blocks: [
        {
          ul: [
            'The Q1 decline came from lapsed repeat customers, not weak new business.',
            'Inventory bottlenecks identified and located.',
            'A month-end sale and next-month refund pattern that revealed a gap in refund policy controls.',
          ],
        },
        'The findings were delivered to the client. It was a two-month analysis contract and I had no visibility after handover, so I do not know what changed as a result.',
      ],
    },
  ],
};
