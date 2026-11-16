// Everything on the home page that isn't a project.
// Source of truth: ../My Career/cv/cv.md  (see CLAUDE.md before editing)

export default {
  name: 'Muhammad Ahmed Hassan',
  role: 'Data Engineer',
  location: 'Karachi, Pakistan',
  email: 'mahsep27@gmail.com',
  linkedin: 'https://www.linkedin.com/in/muhammad-ahmed-hassan-56321523b',
  cv: 'Muhammad_Ahmed_Hassan_CV.pdf', // copied from ../My Career/cv/ into public/

  description:
    'Data engineer in Karachi with over three years building production data pipelines on AWS and GCP: ingestion, warehouses, PostgreSQL performance work and GPU inference.',

  hero: {
    headline: 'I build data pipelines, and rebuild them when the constraint moves.',
    intro:
      'Data engineer with over three years building production pipelines on AWS and GCP. I own a review-enrichment platform handling 66M+ reviews from nine e-commerce sources, and I have built warehouses and their BI layers end to end for e-commerce, restaurant-franchise and real-estate clients.',
    evolutionFrom: 'review-intelligence-pipeline', // project whose `evolution` is shown under the hero
  },

  workIntro:
    'Most of this is client work, so I can describe it but not show the code. Each page covers the problem, what I built, the decisions behind it and what I would do differently. The status on each one says how far it actually got.',

  experience: [
    {
      title: 'Data Engineer',
      org: 'IMPRODATA',
      dates: 'Sep 2024 – Present',
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

  skillsIntro: 'Tools I have used on the projects above.',
  skills: [
    {
      group: 'Cloud and data engineering',
      items:
        'AWS (S3, Glue, Lambda, Step Functions, SQS, SageMaker, RDS, OpenSearch, DynamoDB, EventBridge, CloudFormation) · GCP (Pub/Sub, Cloud Functions, BigQuery) · Databricks (Workflows, GPU inference) · ETL/ELT pipelines · event-driven architecture',
    },
    {
      group: 'Databases',
      items:
        'PostgreSQL (partitioning, indexing, autovacuum tuning) · BigQuery · MySQL · Cassandra · OpenSearch · Hive',
    },
    {
      group: 'Programming',
      items: 'SQL · Python (Pandas, NumPy) · Bash · JavaScript · Google Apps Script',
    },
    {
      group: 'Analytics and BI',
      items:
        'Power BI (DAX, Power Query, star-schema modelling) · Metabase · Amazon QuickSight · Google Looker Studio · Excel',
    },
    {
      group: 'ML and inference',
      items:
        'vLLM · model quantization (4-bit AWQ) · transformer models (DeBERTa, MiniLM) · RunPod GPU infrastructure',
    },
    {
      group: 'Automation and integration',
      items:
        'Weld · Airtable · Supabase · Cloudflare (Workers, R2) · Twilio · WhatsApp API · QStash · Vercel · REST APIs · cron',
    },
  ],

  contact: {
    heading: 'Get in touch',
    body: 'If you have a pipeline that needs an owner, or a question about anything on this site, email is the fastest way to reach me.',
  },
};
