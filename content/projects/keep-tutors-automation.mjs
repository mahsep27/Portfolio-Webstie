export default {
  slug: 'keep-tutors-automation',
  order: 4,
  featured: true,
  source: 'projects/work/keep-tutors-automation.md',

  title: 'Keep Tutors: Operations Automation and Airtable to Postgres Migration',
  shortTitle: 'Keep Tutors Automation and Migration',
  summary:
    'Sole developer for a tutoring business. First automated its operations on top of Airtable, removing an estimated 10 hours of manual work a week, then migrated its system of record into Postgres with idempotent importers.',
  figure: { value: '~10 h/week', label: 'manual work removed (estimate)' },
  // Filter chips on the home page. Keys are defined in site.mjs work.tags.
  tags: ['automation', 'pipelines'],
  // The three-line version at the top of the case study.
  brief: {
    problem: "A tutoring business ran messaging, invoicing, attendance and feedback by hand in Airtable, so operations work grew with every new student.",
    did: "Automated all four on top of Airtable, then migrated the system of record into Postgres with re-runnable importers and built the platform that replaces Airtable.",
    result: "An estimated 10 hours of manual work removed per week. The migration moved 5,208 tutors, 9,381 applications and 1,054 invoices. The new platform is built but not live yet.",
  },
  context: 'Keep Tutors (contract)',
  period: 'Sep 2025 – present',
  role: 'Sole developer',
  status: { kind: 'progress', label: 'Phase 1 running · phase 2 built, not live' },
  // One row: drawn as the diagram on the case study and as icons on the home card.
  chain: [
    { i: 'airtable', t: 'Airtable', s: 'system of record' },
    { i: 'upstash', t: 'QStash queue', s: 'paced sends' },
    { i: 'whatsapp', t: 'WhatsApp API', s: 'messages' },
    { i: 'apps-script', t: 'Apps Script', s: 'PDF invoices' },
    { i: 'supabase', t: 'Postgres', s: 'phase 2 migration' },
    { i: 'cloudflare-workers', t: 'Workers API', s: 'new platform' },
  ],
  stack: [
    'Airtable',
    'Google Apps Script',
    'QStash',
    'Vercel',
    'WhatsApp API',
    'Supabase Postgres',
    'Cloudflare Workers',
    'R2',
    'Next.js',
    'Expo',
    'GitHub Actions',
  ],

  sections: [
    {
      title: 'Problem',
      blocks: [
        'A growing tutoring business run by hand out of Airtable: messaging students and tutors, producing invoices one at a time, assembling attendance sheets, chasing feedback. Every one of these scaled with student count, so operations cost grew in step with revenue.',
      ],
    },
    {
      title: 'Phase 1: automation on top of Airtable',
      blocks: [
        {
          pre: `Airtable (system of record)
  ├─ automation → QStash queue → WhatsApp API           (paced messaging)
  ├─ automation → Apps Script (PDF) → Vercel → Airtable (invoicing)
  ├─ scheduled  → attendance sheet generation
  └─ forms      → feedback → tutor ratings → ops assignment view

  All four write status back to an automation tracking table.`,
        },
        {
          ul: [
            '**Paced messaging.** Segmented sends plus messages triggered along the lead lifecycle. The constraint is not throughput: firing 10–15 messages at once looks like spam to WhatsApp and risks the account being banned. A queue spaces the sends out.',
            '**Invoicing.** Monthly generation from session records: Apps Script renders a template to PDF, a Vercel endpoint handles delivery, and the result is written back so every invoice has a record.',
            '**Attendance.** Scheduled sheet generation from the session table.',
            '**Feedback and tutor ratings.** Post-session feedback aggregates into a rating per tutor, so allocation is driven by recorded performance.',
            '**Automation tracking.** A registry of what ran, when, and whether it succeeded, readable by non-technical staff. It is what made four unattended systems debuggable without a developer in the loop.',
          ],
        },
        { h: 'Decisions' },
        {
          decisions: [
            {
              title: 'Airtable stays the system of record',
              body: 'The ops team already worked in it daily. Moving them off early would have meant building an admin UI before delivering any value.',
            },
            {
              title: 'A queue in front of the messaging API',
              body: 'Airtable automations have no pacing or backoff, so delivery spacing had to live outside the platform.',
            },
            {
              title: 'Write results back where the client can see them',
              body: 'Non-technical users can audit what happened without asking me. That is what makes it handed over and not dependent on me.',
            },
          ],
        },
        { h: 'Impact' },
        'An estimated **10 hours of manual work removed per week**. It is an estimate, not a measurement. Volume is about 100 leads a month, and the hours come from the long tail of triggered messages on every lead, each of which used to be typed by hand, more than from the 20 or so invoices.',
        'The claim that needs no number: four processes that scaled with student count now run unattended.',
      ],
    },
    {
      title: 'Phase 2: replacing Airtable',
      blocks: [
        'Phase 1 made Airtable work, but Airtable was the ceiling: about 3,500 active tutors, no tutor-facing app, and a planned expansion it could not carry. I built the replacement platform as a monorepo (Next.js portals, an Expo tutor app, an API on Cloudflare Workers, Postgres on Supabase, files in R2, CI on GitHub Actions). The data work is the part I want to talk about.',
        { h: 'Migration' },
        'A read-only audit first, then staged importers in dependency order. Every importer writes through a mapping table (Airtable record id → Postgres id), so a re-run updates in place and does not duplicate. Verified against the live database:',
        {
          table: {
            head: ['Table', 'Rows'],
            rows: [
              ['Tutors (two source tables merged, deduped on email and phone)', '5,208'],
              ['Inquiries (every lead, converted or not)', '5,741'],
              ['Tuitions', '2,958'],
              ['Applications', '9,381'],
              ['Invoices', '1,054 (PKR 21.3M)'],
              ['Tutor ↔ subject links', '29,823'],
            ],
          },
        },
        'Plus about 14,600 files copied into R2. Airtable attachment URLs expire within hours, so the file pass re-reads each record live. The one loss: 4 files belonging to a record deleted from Airtable after the extract.',
        { h: 'Running both systems side by side' },
        {
          ul: [
            '**No big-bang cutover.** Airtable stays live and is mirrored into Postgres: a full re-import sweep (safe because the importers are idempotent), plus a signed Airtable webhook built to write changes within seconds.',
            '**Only one side may message a client.** An automation switch (global, per type, per city) gates the worker, so cities can move across one at a time. Held messages go back to pending without spending a retry.',
            '**Deletions are reported, never applied automatically.** A record deleted in Airtable may be invoiced or paid.',
            '**Messy reference data.** Cities and areas were free text. I resolved them against a location dataset, with a review file for anything ambiguous instead of a silent guess.',
            '**Inventoried the old system first**: all 41 Airtable automations and 16 interface pages, so the new one replaces what ops actually use.',
          ],
        },
        { h: 'Status' },
        'Built and loaded with real data, but not in use yet. The ops team is still on Airtable, the automation switch is off, and the webhook is not registered until the API is deployed publicly. Launch is waiting on business decisions.',
      ],
    },
    {
      title: 'What I would do differently',
      blocks: [
        {
          ul: [
            '**Phase 1: add retry handling.** Airtable triggers each automation once, so there is no duplicate risk but also no recovery when a downstream call fails. The tracking table already records failures. The next step is consuming that state to re-drive them.',
            '**Phase 2: write the sync as change-data-capture from day one.** The full sweep was the right first step, but the webhook had to be retrofitted once the apps needed fresh data.',
          ],
        },
      ],
    },
  ],
};
