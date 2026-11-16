export default {
  slug: 'ai-voice-setter',
  order: 7,
  featured: true,
  source: 'projects/work/salespeak-voice-agent.md',

  title: 'AI Voice Setter',
  summary:
    'A phone agent built as a pitch demo for a prospective US sales client. It looks callers up in the CRM, qualifies them, books a strategy call and writes the outcome back, with a flow derived from 1,382 of the client\'s sales-call transcripts.',
  figure: { value: '1,382', label: 'call transcripts analysed' },
  context: 'IMPRODATA, for a prospective US sales client',
  period: 'Sep – Oct 2026',
  role: 'Sole developer',
  status: { kind: 'demo', label: 'Pitch demo · no real customer calls' },
  // One row: drawn as the diagram on the case study and as icons on the home card.
  chain: [
    { i: 'phone', t: 'Caller', s: 'inbound lead' },
    { i: 'twilio', t: 'Twilio', s: 'media stream' },
    { i: 'cloudflare-workers', t: 'Durable Object', s: 'one per call' },
    { i: 'user', t: 'CRM lookup', s: 'by caller ID' },
    { i: 'calendly', t: 'Calendly', s: 'book the call' },
    { i: 'check', t: 'CRM outcome', s: 'written back' },
  ],
  stack: [
    'TypeScript',
    'Cloudflare Workers',
    'Durable Objects',
    'KV',
    'Twilio Media Streams',
    'Close CRM API',
    'Calendly API',
    'Google Sheets API',
    'Vitest',
  ],

  sections: [
    {
      title: 'Problem',
      blocks: [
        'The client\'s "setters" phone inbound leads, qualify them and book a strategy call with a closer. It is a scripted, high-volume job. The pitch was an AI setter that runs the same playbook, books into the same calendar and writes the same outcome into the CRM, built before they signed so they could call it and hear it.',
      ],
    },
    {
      title: 'What I built',
      blocks: [
        '**Start from the data, not a guess at the script.** I pulled the reps\' calls read-only through the CRM API and analysed the 1,382 that had transcripts against the client\'s sales playbook. The discovery questions and qualification flow come from that.',
        {
          ul: [
            'Looks the caller up by caller ID while the greeting plays. A repeat caller is greeted by name, is not re-asked what the CRM already covers, and cannot double-book.',
            'Runs discovery, qualifies, and checks the caller\'s preferred time against the calendar, offering the nearest open slots if it is taken.',
            'Saves a call outcome with the same fields as the client\'s own CRM form. Do-not-contact and hand-off are tools too.',
            'Built on my own [Vocodine](work:vocodine-voice-agent) agent, reusing its Twilio audio bridge and tests.',
          ],
        },
        '**A safe sandbox.** A script copies the client\'s CRM schema into a test organisation. It is re-runnable without duplicating, and both the script and the agent refuse to run against the live organisation.',
      ],
    },
    {
      title: 'Key decisions',
      blocks: [
        {
          decisions: [
            {
              title: 'Latency over model size',
              body: 'A small fast model with a fallback. The greeting is pre-rendered and cached, so the agent answers in about 0.2 seconds.',
            },
            {
              title: 'Word-gated barge-in',
              body: 'The agent stops talking only after the caller says two real words, so line noise and "uh" do not cut it off.',
            },
            {
              title: 'Generous end-of-turn timing',
              body: 'On a sales call, a slower turn beats cutting a caller off mid-sentence.',
            },
            {
              title: 'Every integration is optional',
              body: 'Without the calendar it offers times from a knowledge file. That made it testable piece by piece and demoable before the client handed over keys.',
            },
          ],
        },
      ],
    },
    {
      title: 'Impact',
      blocks: [
        'No business numbers, because it is a pitch demo and not production. What exists: a deployed agent that takes phone calls end to end (lookup → qualify → book → CRM write) against a sandboxed copy of the client\'s CRM, built in about two weeks, with a scripted text-mode caller and smoke tests for the CRM sync.',
      ],
    },
    {
      title: 'What I would do differently',
      blocks: [
        'The qualification thresholds are my reading of the transcripts, not the client\'s sign-off. I would get them written down before building, the way the [cross-border warehouse](work:cross-border-ecommerce-warehouse) project did for metrics.',
      ],
    },
  ],
};
