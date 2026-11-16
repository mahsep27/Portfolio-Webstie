export default {
  slug: 'merchant-data-pipeline',
  order: 2,
  featured: true,
  source: 'projects/work/funding-fixed-merchant-data-pipeline.md',

  title: 'US Merchant Data Pipeline',
  summary:
    'The data layer for a client\'s US merchant-outreach pilot: about 1M rows from seven exports cleaned and deduplicated into 274K unique merchants, then validated so money is only spent enriching the ones that are still real.',
  figure: { value: '1M → 274K', label: 'rows to unique merchants' },
  context: 'IMPRODATA, for a US merchant-payments client',
  period: 'Sep 2026 – present',
  role: 'Data Engineer, built the data layer',
  status: { kind: 'progress', label: 'Loaded · validation in progress' },
  // One row: drawn as the diagram on the case study and as icons on the home card.
  chain: [
    { i: 'file', t: '7 CSV exports', s: '~1.01M rows' },
    { i: 'pandas', t: 'Clean + dedupe', s: 'one row per domain' },
    { i: 'supabase', t: 'Postgres', s: '274K merchants' },
    { i: 'python', t: 'Async validator', s: 'site · platform · MX' },
    { i: 'filter', t: 'Flag', s: 'ready · review · dead' },
    { i: 'check', t: 'Paid enrichment', s: 'only "ready"' },
  ],
  stack: ['Python', 'pandas', 'asyncio', 'aiohttp', 'dnspython', 'PostgreSQL (Supabase)'],

  sections: [
    {
      title: 'Problem',
      blocks: [
        'The client is piloting outbound sales to US merchants. The raw material was seven exports of merchant websites, split by vertical: **about 1.01M rows and 43 columns**. Three things had to be solved before the pilot could target anyone.',
        {
          ul: [
            'The same merchant appeared in several files.',
            'Contact columns were broken: emails truncated to the local part, scraper artifacts like `ainfo@`, phone numbers cut short.',
            'The data was years old, so many of the sites would be dead.',
          ],
        },
      ],
    },
    {
      title: 'What I built',
      blocks: [
        { h: 'Phase 1: clean, deduplicate, load' },
        {
          ul: [
            '**One row per merchant domain.** Domains are normalized (scheme, `www.` and path stripped) and deduplicated across files. A merchant found in several files keeps all its segment classifications and gets one primary segment by business priority.',
            '**Contacts rebuilt, not dropped.** Emails are classified as generic or personal and checked against the merchant\'s own domain. Where only a local part survived, the address is rebuilt on the merchant domain and tagged `reconstructed`, so it is never mistaken for a verified address.',
            '**Phones normalized to E.164**, with toll-free numbers flagged. A truncated number keeps its raw value but gets no E.164, so a broken number never looks diallable.',
            '**Do-not-contact at load time.** GDPR-flagged and confirmed non-US merchants are marked in the data, so compliance does not depend on the caller remembering.',
            'Its own Postgres schema, so the auto-generated REST API does not expose it. Re-runnable from source.',
          ],
        },
        { h: 'Phase 2: is this merchant still real?' },
        'An asyncio validator checks each merchant\'s site and email domain and writes the result back.',
        {
          ul: [
            '**Site status**: live, redirected, blocked by bot protection (not dead), parked or for sale, dead.',
            '**Platform and payment signals** read from the page: Shopify, WooCommerce, Stripe, PayPal and so on. That shows what the merchant processes with today, which is what a payments pitch needs.',
            '**MX checks** on the merchant domain and on every contact email\'s domain.',
            'One flag per merchant decides who moves on to paid enrichment. Resumable: checked merchants are skipped on the next run.',
          ],
        },
      ],
    },
    {
      title: 'Problems that only showed up at scale',
      blocks: [
        {
          decisions: [
            {
              title: 'The local DNS resolver timed out under load',
              body: 'The validator resolves through public resolvers, with a shared cap on queries in flight because those resolvers drop bursts past about 100.',
            },
            {
              title: 'Healthy Shopify stores looked dead',
              body: 'Shopify hosts most stores on a few IPs and drops connection bursts. Fixed with a per-IP semaphore of 4 connections.',
            },
            {
              title: 'Regexes starved the event loop',
              body: 'Regexes over 500 KB pages took about 90 ms each, so fast sites timed out while the loop was busy. Switched to plain substring checks over the first 150 KB.',
            },
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
              title: 'Domain as the primary key',
              body: 'The files had no shared ID, and the website is the one thing a merchant cannot have two of.',
            },
            {
              title: 'Tag doubtful data, do not delete it',
              body: 'Reconstructed emails, blocked sites and DNS timeouts are kept and labelled. A DNS timeout goes to `review`, not `dead`, so a slow resolver cannot silently remove a real merchant.',
            },
            {
              title: 'Skip the 715K-row low-revenue file by default',
              body: 'The client targets merchants with real volume. Loading 715K small stores would have slowed every later step for leads nobody will call. It is one flag away.',
            },
            {
              title: 'Validate before enriching',
              body: 'Enrichment APIs charge per record, so a free check first is the cost control.',
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
            '**About 1.01M source rows → 297,682 in-scope rows → 274,154 unique merchants**, with 245,622 contacts (3,058 reconstructed) and 111,926 phone numbers (105,383 valid E.164).',
            '**1,201 merchants flagged do-not-contact** before anyone could dial them.',
            '**Validation so far, 22,300 checked:** 12,541 ready (56%), 6,610 dead, 3,143 for review. About 30% of the dataset is dead, and each of those is spend avoided at the paid-enrichment step.',
          ],
        },
        'Validation of the remaining e-commerce merchants is still running, so these are interim numbers.',
      ],
    },
    {
      title: 'What I would do differently',
      blocks: [
        'The loader truncates the merchants table, which wipes the validation results with it. That is documented, but it is a trap. Validation results belong in their own table keyed by domain, so reloading the source never destroys work that took hours of network time.',
      ],
    },
  ],
};
