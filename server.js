const express = require("express");
const path = require("node:path");
const crypto = require("node:crypto");
const movies = require("./data/movies.json");
const { getProfile, saveProfile, resetProfile } = require("./src/profileStore");
const { createSessionState, runConversationTurn } = require("./src/recommender");

const app = express();
const port = process.env.PORT || 3000;

const sessions = new Map();

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    movies: movies.length
  });
});

app.post("/api/chat", (req, res) => {
  const message = String(req.body?.message || "").trim();
  const requestedUserId = String(req.body?.userId || "").trim();
  const userId = requestedUserId || `guest-${crypto.randomUUID()}`;
  const limit = Math.max(1, Math.min(Number(req.body?.limit || 3), 5));

  if (!message) {
    return res.status(400).json({
      error: "Message is required."
    });
  }

  const profile = getProfile(userId);
  const session = sessions.get(userId) || createSessionState();

  const turn = runConversationTurn({
    message,
    profile,
    session,
    movies,
    limit
  });

  saveProfile(userId, turn.profile);
  sessions.set(userId, turn.session);

  return res.json({
    userId,
    reply: turn.reply,
    recommendations: turn.recommendations,
    askedQuestion: turn.askedQuestion,
    question: turn.question,
    personaDepth: turn.personaDepth,
    profileSnapshot: {
      interactionCount: turn.profile.interactionCount,
      askedQuestionsCount: turn.profile.askedQuestionsCount,
      recommendationCount: turn.profile.recommendationCount
    }
  });
});

app.post("/api/reset", (req, res) => {
  const userId = String(req.body?.userId || "").trim();
  if (!userId) {
    return res.status(400).json({ error: "userId is required." });
  }

  sessions.delete(userId);
  resetProfile(userId);

  return res.json({
    ok: true
  });
});

app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Conversational movie search app running on http://localhost:${port}`);
});
