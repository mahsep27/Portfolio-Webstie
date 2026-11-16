export default {
  slug: 'vocodine-voice-agent',
  order: 6,
  featured: true,
  source: 'projects/personal/vocodine-voice-agent.md',

  title: 'Vocodine: AI Phone Agent',
  shortTitle: 'Vocodine AI Phone Agent',
  summary:
    'A voice agent that takes restaurant orders on the phone. A group final-year project, plus my own work on top: a latency and cost benchmark from 13 locations and a solo rebuild on Cloudflare with no server to run.',
  figure: { value: '500 ms', label: 'voice pipeline budget' },
  // Filter chips on the home page. Keys are defined in site.mjs work.tags.
  tags: ['voice'],
  // The three-line version at the top of the case study.
  brief: {
    problem: "Restaurants miss phone orders at peak hours, and a voice agent only feels natural if it answers within about a second.",
    did: "Benchmarked speech and LLM providers from 13 locations, got the group project deployed, then rebuilt the agent on Cloudflare on my own.",
    result: "The rebuild works end to end in the browser and on the phone, and became the base of a client pitch demo. Its repository is not public yet.",
  },
  context: 'Final-year project (group) and personal rebuild',
  period: 'Apr – Jul 2026',
  role: 'Group member on the project; sole author of the benchmark, the deploy and the Cloudflare rebuild',
  status: { kind: 'progress', label: 'Works end to end · repo not public yet' },
  // One row: drawn as the diagram on the case study and as icons on the home card.
  chain: [
    { i: 'phone', t: 'Caller', s: 'Urdu / English' },
    { i: 'twilio', t: 'Twilio', s: 'media stream' },
    { i: 'cloudflare-workers', t: 'Durable Object', s: 'one per call' },
    { i: 'wave', t: 'STT → LLM → TTS', s: '500 ms budget' },
    { i: 'db', t: 'D1', s: 'orders, billing' },
  ],
  stack: [
    'TypeScript',
    'Cloudflare Workers',
    'Durable Objects',
    'D1',
    'Twilio Media Streams',
    'Soniox',
    'LiveKit Agents',
    'Python',
    'Docker',
    'Vitest',
  ],

  sections: [
    {
      title: 'Problem',
      blocks: [
        'Restaurants miss phone orders at peak hours. Vocodine is a voice agent that takes the order on the phone, checks it against the menu and writes it to the restaurant\'s system. The first version was built as a group for our final-year project. This page covers my part of it and what I built on top.',
      ],
    },
    {
      title: 'What I built',
      blocks: [
        { h: 'A latency and cost benchmark that decided the stack' },
        'A phone call feels natural under about 1 second end to end. After telephony takes 200–400 ms, the AI pipeline (speech to text → LLM first token → first audio) gets about 500 ms. I wrote a harness that measures each provider from 13 locations and prices each one per hour of call.',
        {
          ul: [
            'Premium speech-to-text and text-to-speech providers all cost about the same. The only lever that really moves cost is the cheapest text-to-speech option, and that depends on whether it sounds good on an 8 kHz phone line.',
            'The US meets the 500 ms target (about 480 ms p50). Canada and Australia are about 70 ms over. The UK is hardest, because LLM time-to-first-token is the bottleneck there.',
            'The "rate limit" errors in testing turned out to be the free tier\'s daily quota, not a scaling limit. Worth knowing before redesigning for it.',
          ],
        },
        { h: 'Getting the group project running' },
        'A self-hosted deploy on DigitalOcean. I fixed the agent never joining the call (a 10-second timeout: connect to the room before bootstrapping), baked the models into the Docker image, and built a voice-only web client with a live latency panel.',
        { h: 'A Cloudflare-native rebuild, solo' },
        {
          ul: [
            '**One Durable Object per call** runs speech-to-text → LLM → text-to-speech. The same pipeline serves the browser demo and real phone calls through a Twilio Media Streams bridge.',
            '**Urdu and English code-switching** speech-to-text for Pakistani callers, chosen per tenant.',
            '**Multi-tenant backend over D1**: tenants, phone numbers, menus, transcripts, orders, bookings. Three verticals, each a pure function that returns prompt, greeting and tools.',
            '**Per-second billing that cannot double-charge.** A `billed_seconds IS NULL` gate plus a unique ledger reference make webhook replays safe.',
            '**Outbound campaigns**: a cron dials due contacts, skips do-not-call numbers, closed hours and empty wallets, and turns "stop calling me" into an automatic do-not-call entry.',
            '**Security on the call path**: Twilio signature validation, plus an HMAC token checked before any billable AI runs.',
          ],
        },
        'It became the base of the [AI voice setter](work:ai-voice-setter) pitch demo, which reuses the audio bridge and tests.',
      ],
    },
    {
      title: 'Key decisions',
      blocks: [
        {
          decisions: [
            {
              title: 'Measure before choosing providers',
              body: 'The benchmark showed vendor choice is mostly cost noise and latency depends on region. That is what made consolidating on one platform a safe call.',
            },
            {
              title: 'A Durable Object per call',
              body: 'Call state lives with the call. No session store and no sticky routing.',
            },
            {
              title: 'Idempotency in the schema, not in code',
              body: 'The same lesson as the review pipeline and the Keep Tutors migration: let a constraint make replays harmless.',
            },
          ],
        },
      ],
    },
    {
      title: 'Impact',
      blocks: [
        'The benchmark turned "which provider?" from opinion into a per-market table with prices. The rebuild proves the pipeline runs serverless, and it became the base of a client pitch demo within three months.',
      ],
    },
    {
      title: 'What I would do differently',
      blocks: [
        'Publish sooner. The rebuild and its benchmark report are in a private repository that I am preparing to make public.',
      ],
    },
  ],
};
