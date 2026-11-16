// Everything on the home page that isn't a project.
// Source of truth: ../My Career/cv/cv.md and the project docs (see CLAUDE.md before editing)

export default {
  name: 'Muhammad Ahmed Hassan',
  role: 'Data Engineer',
  location: 'Karachi, Pakistan',
  timezone: 'UTC+5',
  // Where the site is deployed. Used for the canonical link and the link-preview image.
  url: 'https://portfolio-website.mahsep27.workers.dev',
  email: 'mahsep27@gmail.com',
  linkedin: 'https://www.linkedin.com/in/muhammad-ahmed-hassan-56321523b',
  cv: 'Muhammad_Ahmed_Hassan_CV.pdf', // copied from ../My Career/cv/ into public/

  description:
    'Data engineer in Karachi with over three years building production data pipelines on AWS and GCP: ingestion, warehouses, PostgreSQL performance work and GPU inference.',

  hero: {
    headline: 'I build data pipelines, and rebuild them when the constraint moves.',
    intro:
      'Over three years building production pipelines on AWS and GCP. I own a review-enrichment platform handling 66M+ reviews from nine e-commerce sources, and I have built warehouses and their BI layers end to end for e-commerce, restaurant-franchise and real-estate clients.',
    evolutionFrom: 'review-intelligence-pipeline', // project whose `evolution` is shown under the hero
  },

  // The card beside the headline: what a recruiter checks in the first ten seconds.
  // Every row must match cv/cv.md.
  glance: [
    { label: 'Now', value: 'Data Engineer at IMPRODATA', note: 'since Sep 2024, plus a weekend automation contract' },
    { label: 'Experience', value: 'Over 3 years in data', note: 'analyst from Aug 2023, engineer from Sep 2024' },
    { label: 'Core stack', value: 'AWS · GCP · PostgreSQL · Python · SQL · Power BI' },
    { label: 'Based in', value: 'Karachi, Pakistan', note: 'UTC+5' },
    { label: 'Education', value: 'BSc Computer Science', note: 'Iqra University, expected 2027' },
    { label: 'Languages', value: 'English, Urdu' },
  ],

  // The band of numbers under the hero. Every value must come from a project doc.
  stats: [
    { value: '66.4M', label: 'Reviews', note: 'enriched across about 1M products and nine e-commerce sources' },
    { value: '95 → 20 GB', label: 'Postgres', note: 'largest maintenance unit after partitioning a 199M-row table' },
    { value: '1M → 274K', label: 'Merchants', note: 'rows from seven exports deduplicated into unique merchants' },
    { value: '~10 h/week', label: 'Automation', note: 'of manual operations work removed for a tutoring business (estimate)' },
  ],

  work: {
    heading: 'Pipelines, warehouses and automation',
    intro:
      'Most of this is client work, so I can describe it but not show the code. Each case study opens with a three-line summary, and the status says how far each project actually got.',
    // Filter chips above the cards. Each project lists the keys it belongs to in `tags`.
    tags: [
      { key: 'pipelines', label: 'Data pipelines' },
      { key: 'bi', label: 'Analytics and BI' },
      { key: 'automation', label: 'Automation' },
      { key: 'voice', label: 'Voice AI' },
    ],
  },

  // "What broke" cards. `project` is the slug of the case study the story comes from.
  stories: {
    heading: 'What broke, and how I found it',
    intro:
      'The parts of the job that do not show up in an architecture diagram. Each of these is written up in full in its case study.',
    items: [
      {
        project: 'review-intelligence-pipeline',
        evidence: '0%',
        evidenceLabel: 'of stored hashes reproduced on six of nine platforms',
        title: 'Three hash formulas hiding in one column',
        body: 'Before the first run of a rebuilt pipeline, I checked whether its dedup hash matched what was already stored. On most platforms it did not match at all.',
        fix: 'Held the launch for a backfill. Running first would have duplicated reviews in production.',
      },
      {
        project: 'review-intelligence-pipeline',
        evidence: '40M',
        evidenceLabel: 'dead rows before autovacuum would even start',
        title: 'Autovacuum that could never catch up',
        body: 'Query plans were degrading on a 199M-row table. I compared `backend_xmin` age against dead tuples and found GPU workers holding transactions open.',
        fix: 'Tuned the thresholds as a stopgap, then partitioned the table so the defaults work again.',
      },
      {
        project: 'review-intelligence-pipeline',
        evidence: '0.84',
        evidenceLabel: 'confidence that a review was negative about price. It never mentioned price.',
        title: 'A model that invents opinions',
        body: 'The aspect-sentiment model has no "not mentioned" class, so it scores every aspect you ask about, whether or not the review discusses it.',
        fix: 'A keyword mention-gate in front of the model. It only scores what was actually said.',
      },
      {
        project: 'merchant-data-pipeline',
        evidence: '4',
        evidenceLabel: 'connections per IP before healthy stores stopped looking dead',
        title: 'Live Shopify stores marked as dead',
        body: 'A site validator flagged thousands of working stores as dead. Shopify hosts most stores on a few IPs and drops connection bursts.',
        fix: 'A per-IP semaphore, and a rule that a timeout means "review", never "dead".',
      },
      {
        project: 'supply-chain-analysis',
        evidence: '1 → 2',
        evidenceLabel: 'customers, after a CRM migration uppercased every name',
        title: 'One customer counted as two',
        body: 'A sales decline looked like weak new business. A system migration had split each customer\'s history in two, hiding the real cause: repeat customers had stopped ordering.',
        fix: 'Resolved identities before analysing anything that crossed the migration date.',
      },
      {
        project: 'keep-tutors-automation',
        evidence: '10–15',
        evidenceLabel: 'messages at once is enough to look like spam',
        title: 'The limit was policy, not throughput',
        body: 'Automating WhatsApp messages for a tutoring business risked getting the account banned, because simultaneous sends look like spam.',
        fix: 'A queue in front of the messaging API that spaces the sends out.',
      },
    ],
  },

  experienceHeading: 'Where I have worked',
  experienceIntro: 'Two current roles and two earlier ones, newest first.',
  experience: [
    {
      title: 'Data Engineer',
      org: 'IMPRODATA',
      dates: 'Sep 2024 – Present',
      current: true,
      place: 'Karachi, Pakistan · Data and AI services company',
      summary:
        'Own the review analytics platform behind a consumer product, and build client data platforms: warehouses on BigQuery, event-driven ingestion on GCP, data cleaning and validation pipelines in Python and Postgres.',
      projects: [
        'review-intelligence-pipeline',
        'merchant-data-pipeline',
        'cross-border-ecommerce-warehouse',
        'gcp-event-driven-pipeline',
        'ai-voice-setter',
        'weekly-postgres-snapshot',
      ],
    },
    {
      title: 'Automation Engineer (contract)',
      org: 'Keep Tutors',
      dates: 'Sep 2025 – Present',
      current: true,
      place: 'Remote · Weekend engagement alongside the full-time role',
      summary:
        'Sole developer. Automated the operations of a tutoring business on top of Airtable, then migrated its system of record into Postgres and built the platform that replaces Airtable.',
      projects: ['keep-tutors-automation'],
    },
    {
      title: 'Data Analyst (contract)',
      org: 'Alikhan Consultants',
      dates: 'Jul – Aug 2024',
      place: 'Karachi, Pakistan',
      summary:
        'Two-month analysis contract diagnosing a sales decline and supply chain bottlenecks for Lucky Core Industries.',
      projects: ['supply-chain-analysis'],
    },
    {
      title: 'Data Analyst',
      org: 'IMPRODATA',
      dates: 'Aug 2023 – Apr 2024',
      place: 'Karachi, Pakistan',
      summary:
        'Built star-schema models and dashboards in Power BI and Amazon QuickSight over Cassandra, BigQuery and Hive sources.',
      projects: ['jove-performance-dashboard', 'real-estate-sales-dashboard', 'aviation-traffic-dashboard'],
    },
  ],

  education: {
    degree: 'BSc Computer Science',
    school: 'Iqra University, Karachi',
    dates: 'March 2022 – expected 2027',
    note: 'Coursework completed; Final Year Project II remaining',
  },

  certifications: ['SQL Associate, DataCamp', 'SQL (Intermediate), HackerRank'],
  languages: ['Urdu (native)', 'English (professional)'],

  // Each item is "Name" or "Name|icon". Must match the skills list in cv/cv.md.
  skillsHeading: 'Tools I have used in production',
  skillsIntro: 'Every tool here is tied to at least one project above.',
  skills: [
    {
      group: 'AWS',
      items: ['S3|s3', 'Glue|glue', 'Lambda|lambda', 'Step Functions|flow', 'SQS|queue', 'SageMaker|chip', 'RDS|rds', 'OpenSearch|opensearch', 'DynamoDB|table', 'EventBridge|eventbridge', 'CloudFormation|file'],
    },
    {
      group: 'GCP and Databricks',
      items: ['BigQuery|bigquery', 'Pub/Sub|pubsub', 'Cloud Functions|cloud-functions', 'Databricks Workflows|databricks', 'Databricks GPU inference|databricks'],
    },
    {
      group: 'Databases',
      items: ['PostgreSQL|postgresql', 'Partitioning, indexing, autovacuum tuning|postgresql', 'MySQL|mysql', 'Cassandra|apachecassandra', 'Hive|apachehive'],
    },
    {
      group: 'Programming',
      items: ['SQL|db', 'Python|python', 'Pandas, NumPy|pandas', 'Bash|gnubash', 'JavaScript|javascript', 'Google Apps Script|apps-script'],
    },
    {
      group: 'Analytics and BI',
      items: ['Power BI (DAX, Power Query)|powerbi', 'Star-schema modelling|table', 'Metabase|metabase', 'Amazon QuickSight|chart', 'Looker Studio|looker', 'Excel|googlesheets'],
    },
    {
      group: 'ML and inference',
      items: ['vLLM|chip', '4-bit AWQ quantization|mistral', 'DeBERTa, MiniLM|huggingface', 'RunPod GPU infrastructure|chip'],
    },
    {
      group: 'Automation and integration',
      items: ['Cloudflare Workers, R2|cloudflare-workers', 'Supabase|supabase', 'Airtable|airtable', 'Twilio|twilio', 'WhatsApp API|whatsapp', 'QStash|upstash', 'Vercel|vercel', 'Weld|flow', 'REST APIs, cron|clock'],
    },
  ],

  contact: {
    heading: 'Hiring for a data role, or need a pipeline built?',
    body: 'I am happy to talk about data engineering roles, contract pipeline or automation work, or any project on this site. Email is the fastest way to reach me.',
  },
};
