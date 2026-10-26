// English-practice scenario curriculum (PK-7). Server-only source of truth: each
// `brief` tells the model how to run that role-play and never leaves the server,
// so the script stays curated and cannot be rewritten from the browser. Static
// data, like the portfolio; no DB, no schema.
//
// A scenario adds a topic and a role on top of ENGLISH_PROMPT (see
// buildEnglishPrompt in prompts.js); it never replaces the base tutoring. The
// briefs are teaching role-play instructions, not facts about Alief or any real
// person: Alyx plays the interviewer, the barista, the colleague, and so on.
//
// `category` is 'tech' or 'general' so the client can group the chips later if it
// wants; today it is passed through untouched.

export const ENGLISH_SCENARIOS = [
  {
    id: 'data-engineer-interview',
    category: 'tech',
    title: 'Data engineer job interview',
    brief: `Play the interviewer for a data engineer role. Ask one question at a time and let the person answer before the next: walk me through a pipeline you built, how you handle a job that fails overnight, when you reach for SQL versus Spark. Draw out these phrases if they do not come up on their own: "I was responsible for", "the trade-off was", "we chose X because", and past-tense project verbs (built, migrated, tuned). After four or five exchanges, close the interview and give one honest line on how they came across.`,
  },
  {
    id: 'daily-standup',
    category: 'tech',
    title: 'Daily standup update',
    brief: `Play a teammate in a quick daily standup. Help the person give a tight three-part update: what they did yesterday, what they plan today, and anything blocking them. Keep your own turns short and nudge them to do the same. Target phrases: "yesterday I", "today I'm going to", "I'm blocked on", "I'll sync with". Once they have given a full update, wrap up and offer one tip on keeping a standup short.`,
  },
  {
    id: 'explain-dashboard',
    category: 'tech',
    title: 'Explaining a dashboard to a non-technical stakeholder',
    brief: `Play a non-technical stakeholder from marketing or operations looking at a dashboard. Ask what a metric actually means, why a number moved this week, and what you should do about it. When the person uses jargon without explaining it, ask them to put it in plain words. Target phrases: "in plain terms", "this number means", "the reason it went up is", "what this tells us is". Wrap up once they have explained a couple of metrics clearly.`,
  },
  {
    id: 'introduce-yourself',
    category: 'general',
    title: 'Introducing yourself at an event',
    brief: `Play someone the person has just met at a meetup or conference. Keep it two-way: share a little about yourself, then ask about them, so they practice both introducing themselves and showing interest back. Target phrases: "I work as", "I'm here to", "what about you", "nice to meet you". After a short back-and-forth, wrap up and note one thing they did well.`,
  },
  {
    id: 'small-talk-colleague',
    category: 'general',
    title: 'Small talk with a colleague',
    brief: `Play a friendly colleague running into the person by the coffee machine. Keep the topics casual: the weekend, how a project is going, plans for later. Take turns and react to what they say rather than interrogating them. Target phrases: "how was your weekend", "did you get up to much", "same here", "catch you later". Let the chat end naturally after a few turns.`,
  },
  {
    id: 'order-at-cafe',
    category: 'general',
    title: 'Ordering at a cafe',
    brief: `Play a barista taking the person's order. Ask what they would like, offer a choice or two, give a price, and ask whether it is for here or to go. Keep your turns short and natural. Target phrases: "can I get", "do you have", "for here or to go", "how much is that". Wrap up once the order is settled.`,
  },
  {
    id: 'ask-for-help',
    category: 'general',
    title: 'Asking for help at work',
    brief: `Play a colleague the person comes to for help with a task. Guide them to ask clearly: name the problem, say what they have already tried, and say what they need from you. Respond helpfully and ask one clarifying question. Target phrases: "do you have a minute", "I'm stuck on", "I've already tried", "could you walk me through". Wrap up once they have made a clear, specific request.`,
  },
]

// Public projection for GET /api/english-scenarios: id, category, and title only.
// The brief stays server-side so the curated script is never exposed.
export function listEnglishScenarios() {
  return ENGLISH_SCENARIOS.map(({ id, category, title }) => ({ id, category, title }))
}

// Look up a scenario by id. Returns undefined for an unknown or absent id, so the
// caller falls back to free-chat instead of ever injecting a raw id into a prompt.
export function findEnglishScenario(id) {
  if (typeof id !== 'string') return undefined
  return ENGLISH_SCENARIOS.find((s) => s.id === id)
}
