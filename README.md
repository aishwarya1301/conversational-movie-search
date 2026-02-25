# conversational-movie-search

Conversational movie discovery web tool with a **witty videotape shop guy** persona.

## What this app does

- Runs a browser chat UI + Node backend.
- Recommends movies from a curated multilingual movie database.
- Keeps two layers of memory:
  - **Short-term taste** (what you want tonight).
  - **Long-term taste** (what you consistently like over time).
- Asks short follow-up questions early, then asks fewer questions after it understands your persona better.

## Persona behavior

The assistant intentionally speaks like a sharp, playful video store clerk:

- Fast, punchy responses.
- Opinionated but friendly recommendations.
- Short clarification questions (mood, genre, language, era).
- Better personalization over repeat interactions for the same `userId`.

## Tech stack

- Node.js
- Express
- Vanilla JS frontend
- Local JSON movie database (`data/movies.json`)
- Local profile storage (`data/userProfiles.json`, ignored in git)

## Run locally

```bash
npm install
npm start
```

Open `http://localhost:3000`.

## Tests

```bash
npm test
```

The test suite validates:

1. The agent asks fewer questions as persona depth grows.
2. Short-term signals steer recommendations toward requested lanes.
