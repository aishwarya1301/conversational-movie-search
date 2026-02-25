const test = require("node:test");
const assert = require("node:assert/strict");
const movies = require("../data/movies.json");
const {
  createEmptyProfile,
  createSessionState,
  runConversationTurn
} = require("../src/recommender");

test("agent asks fewer questions as persona depth grows", () => {
  let profile = createEmptyProfile();
  let session = createSessionState();

  const firstTurn = runConversationTurn({
    message: "What should I watch?",
    profile,
    session,
    movies
  });
  assert.equal(firstTurn.askedQuestion, true);

  profile = firstTurn.profile;
  session = firstTurn.session;

  const preferenceMessages = [
    "I love Korean thrillers and crime dramas.",
    "Tonight I want dark, intense stories.",
    "I also enjoy Japanese mysteries.",
    "I usually like 2000s movies."
  ];

  for (const message of preferenceMessages) {
    const turn = runConversationTurn({
      message,
      profile,
      session,
      movies
    });
    profile = turn.profile;
    session = turn.session;
  }

  const laterTurn = runConversationTurn({
    message: "Pick something for me now.",
    profile,
    session,
    movies
  });

  assert.ok(laterTurn.personaDepth >= 0.6);
  assert.equal(laterTurn.askedQuestion, false);
});

test("short-term signals bias recommendations to requested lane", () => {
  const profile = createEmptyProfile();
  const session = createSessionState();

  const turn = runConversationTurn({
    message: "korean thriller tonight",
    profile,
    session,
    movies
  });

  const topThree = turn.recommendations.slice(0, 3);
  assert.ok(topThree.length > 0);
  assert.ok(topThree.some((movie) => movie.language === "Korean"));
  assert.ok(topThree.some((movie) => movie.genres.includes("thriller")));
});
