export default {
  slug: 'cross-border-ecommerce-warehouse',
  order: 3,
  featured: true,
  source: 'projects/work/ecommerce-financial-dashboard.md',

  title: 'Cross-Border E-commerce Warehouse and Analytics',
  shortTitle: 'Cross-Border E-commerce Warehouse',
  summary:
    'A BigQuery warehouse, SQL model layer and Metabase dashboards for a direct-to-consumer watch brand selling internationally, answering the question no single system could: what did we actually keep on that sale?',
  figure: { value: '4 systems', label: 'joined into one view' },
  // Filter chips on the home page. Keys are defined in site.mjs work.tags.
  tags: ['bi', 'pipelines'],
  // The three-line version at the top of the case study.
  brief: {
    problem: "Sales lived in Shopify, cross-border costs in Global-e, returns in spreadsheets and stock in another tool, so nobody could see what a sale actually kept.",
    did: "Built a BigQuery warehouse, the SQL models and four Metabase dashboards, specified KPI by KPI against a requirements document agreed with the client.",
    result: "Used by the CEO and senior management as the single cross-system view of the business, with metrics such as revenue quality that no single source could produce.",
  },
  context: 'IMPRODATA, for a D2C watch brand',
  period: 'Nov 2024 – Feb 2025',
  role: 'Data Engineer: warehouse, models and dashboards',
  status: { kind: 'shipped', label: 'Shipped' },
  // One row: drawn as the diagram on the case study and as icons on the home card.
  chain: [
    { i: 'shopify', t: 'Shopify', s: 'sales' },
    { i: 'googlesheets', t: 'Global-e exports', s: 'cost, returns' },
    { i: 'flow', t: 'Weld', s: 'ELT' },
    { i: 'bigquery', t: 'BigQuery', s: 'warehouse' },
    { i: 'db', t: 'SQL models', s: 'one join, once' },
    { i: 'metabase', t: 'Metabase', s: '4 dashboards' },
  ],
  stack: ['BigQuery', 'Weld (ELT)', 'Shopify', 'Global-e / Borderfree', 'Google Sheets', 'Metabase', 'SQL'],

  sections: [
    {
      title: 'Problem',
      blocks: [
        'The client sells watches direct to consumers, internationally, through Shopify. Cross-border fulfilment, duties and shipping are handled by Global-e. That split means the thing the business most needs to know is the thing no single system can tell it.',
        'Shopify knows what was sold. Global-e knows what it cost to get there: shipping cost against shipping the customer paid, duties against duties the customer contributed, subsidies and fees. Returns and replacements lived in spreadsheets, and stock levels in a separate inventory tool. Nobody could answer "what did we keep on that sale?" without assembling four systems by hand.',
      ],
    },
    {
      title: 'What I built',
      blocks: [
        'A BigQuery warehouse on GCP with every source landed in it, a layer of SQL models on top, and Metabase dashboards over those, delivered in phases against a written requirements document.',
        'I owned both ends: ingestion and warehouse, and the Metabase models and dashboards. That mattered more than usual here, because most of the metrics are defined by how the sources are joined. The person deciding the warehouse shape and the person writing the metric had to agree, and they were the same person.',
        { h: 'Sources' },
        {
          ul: [
            '**Shopify**: orders, order lines, refunds, adjustments, products. The sales side.',
            '**Global-e / Borderfree**: orders, shipping per parcel, refunds, returns, service fees and invoicing, pulled in through Weld. The cost side.',
            '**Inventory management system**: stock positions, extracted from its API.',
            '**Google Sheets**: revenue targets maintained by the client.',
          ],
        },
        { h: 'Dashboards' },
        {
          ul: [
            '**Revenue quality and sales**: revenue quality nominal and %, shipping subsidies and cost, duties and taxes, and pending-shipment exposure.',
            '**Shopify sales**: total sales composition, AOV, orders by country, new against repeat customers, revenue against target, sales velocity and coverage.',
            '**Product deep dive**: sales by product and collection over time, with breakdowns by product attributes.',
            '**Returns, replacements and non-receipt**: return, replacement and defective rates, reasons, US against international.',
          ],
        },
      ],
    },
    {
      title: 'Key decisions',
      blocks: [
        {
          decisions: [
            {
              title: 'Build the warehouse, do not point the BI tool at four sources',
              body: 'Connecting the dashboard to everything directly is faster. Then each source\'s quirks live inside the report and the reconciliation is redone every time the model is rebuilt. Landing everything in BigQuery meant the join happened once.',
            },
            {
              title: 'Revenue quality as the headline metric, not revenue',
              body: 'Everything the customer handed over (net item price, duties paid, shipping paid) minus the actual shipping cost and total duties and taxes. For a cross-border brand, two orders of the same value can have completely different outcomes depending on destination and who absorbed the duty.',
            },
            {
              title: 'Pending shipment modelled as an anti-join',
              body: 'An order pending shipment is present in Shopify and absent from Global-e. No status field anywhere says this. It exists only as a gap between two systems, which is the kind of question a warehouse can answer and neither source can.',
            },
            {
              title: 'Non-receipt rate with a lag-aware denominator',
              body: 'Non-receipts in the last 7 days divided by orders from 7–14 days ago. Something ordered today cannot be reported missing today, so dividing by the current window would understate the rate.',
            },
            {
              title: 'Deduplicate returns and exclude return-to-sender',
              body: 'An RTS is a delivery failure, not a customer returning a product. Counting it inflates the return rate the business is judged on.',
            },
            {
              title: 'Carve zero-value orders out of the margin metric',
              body: 'Orders discounted 100% (replacements, comps) made revenue quality negative. They were excluded from those visuals and given their own treatment with a replacement cost model. The cost was real, so it got measured, just not inside a metric it would distort.',
            },
            {
              title: 'Sales coverage joins inventory to sales',
              body: 'Inventory available divided by sales velocity turns a stock number into a time: how long stock lasts at the current rate. That is the form a buying decision takes.',
            },
          ],
        },
      ],
    },
    {
      title: 'How it was specified',
      blocks: [
        'The engagement ran off a written requirements document with one row per KPI: dashboard, grain, source tables, exact formula, status, and a column of open questions and answers. Questions like "does gross item price include taxes and shipping?" look trivial and are not.',
        'Nearly every metric here depends on a definition like that. Getting them written down and answered by the client before building is why the numbers held up.',
      ],
    },
    {
      title: 'Impact',
      blocks: [
        'Used by the CEO and senior management as a single view of the business.',
        'To be precise about the value: this did not create reporting where none existed. Shopify reports its own sales KPIs. Returns were charted in Excel. Any one question, asked of any one system, already had an answer. What none of those could do is the two things this delivered.',
        {
          ul: [
            '**One place.** The CEO stopped assembling a picture of the business out of three tools and a spreadsheet.',
            '**Metrics that only exist across sources**: revenue quality, orders pending shipment, sales coverage, a lag-corrected non-receipt rate and a deduplicated return rate. None of them has a home in any single tool.',
          ],
        },
        'So I claim no before-and-after time saving. The contribution was consolidation for the people who should not be doing the consolidating, plus a set of cross-system metrics that were new.',
      ],
    },
  ],
};
