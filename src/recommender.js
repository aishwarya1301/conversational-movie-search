const POSITIVE_CUES = [
  "love",
  "like",
  "enjoy",
  "adore",
  "prefer",
  "want",
  "craving",
  "into",
  "favorite",
  "favourite"
];

const NEGATIVE_CUES = [
  "hate",
  "dislike",
  "avoid",
  "skip",
  "not into",
  "dont like",
  "don't like",
  "do not like",
  "no"
];

const IMMEDIATE_CUES = ["tonight", "right now", "today", "atm", "in the mood", "for now"];

const LANGUAGE_ALIASES = {
  korean: "korean",
  japanese: "japanese",
  french: "french",
  spanish: "spanish",
  mandarin: "mandarin",
  chinese: "mandarin",
  cantonese: "cantonese",
  hindi: "hindi",
  telugu: "telugu",
  tamil: "tamil",
  german: "german",
  italian: "italian",
  portuguese: "portuguese",
  brazilian: "portuguese",
  persian: "persian",
  farsi: "persian",
  russian: "russian",
  swedish: "swedish",
  danish: "danish",
  indonesian: "indonesian",
  arabic: "arabic",
  english: "english"
};

const GENRE_ALIASES = {
  drama: "drama",
  thriller: "thriller",
  romance: "romance",
  comedy: "comedy",
  action: "action",
  crime: "crime",
  mystery: "mystery",
  horror: "horror",
  fantasy: "fantasy",
  "sci-fi": "sci-fi",
  scifi: "sci-fi",
  sciencefiction: "sci-fi",
  animation: "animation",
  adventure: "adventure",
  historical: "historical",
  war: "war",
  musical: "musical",
  family: "family",
  "coming-of-age": "coming-of-age",
  comingofage: "coming-of-age",
  road: "road",
  music: "music"
};

const VIBE_CUES = {
  cozy: ["cozy", "comfort", "warm", "feel good", "light", "gentle"],
  dark: ["dark", "bleak", "grim", "disturbing"],
  intense: ["intense", "tense", "gritty", "hardcore", "adrenaline"],
  playful: ["fun", "playful", "quirky", "witty", "charming"],
  romantic: ["romantic", "love", "yearning", "sensual", "tender"],
  cerebral: ["thoughtful", "philosophical", "meditative", "slow", "brainy"],
  scary: ["scary", "creepy", "eerie", "horror", "spooky"],
  epic: ["epic", "grand", "sweeping", "large-scale"]
};

const OPENERS = [
  "Ah, welcome back to the aisle of excellent taste.",
  "You came to the right dusty shelf, my friend.",
  "Tape guru on duty. I pulled a few winners already.",
  "I can smell good taste from three aisles away.",
  "You whisper a mood, I summon cinema."
];

const QUICK_QUESTIONS = [
  "Quick one: cozy, dark, or mind-bendy?",
  "Fast pick: thriller, romance, or offbeat comedy?",
  "Language lane tonight: Korean, Japanese, French, or surprise me?",
  "Pace check: slow burn or full chaos?",
  "Era check: classic, 90s, 2000s, or recent?"
];

function createEmptyProfile() {
  return {
    likedGenres: {},
    dislikedGenres: {},
    preferredLanguages: {},
    dislikedLanguages: {},
    preferredDecades: {},
    vibeScores: {},
    interactionCount: 0,
    askedQuestionsCount: 0,
    recommendationCount: 0,
    lastUpdated: new Date().toISOString()
  };
}

function createSessionState() {
  return {
    shortTerm: {
      genres: {},
      languages: {},
      vibes: {},
      decades: {}
    },
    recentRecommendations: []
  };
}

function ensureProfileShape(profile) {
  const base = createEmptyProfile();
  return {
    ...base,
    ...profile,
    likedGenres: { ...base.likedGenres, ...(profile?.likedGenres ?? {}) },
    dislikedGenres: { ...base.dislikedGenres, ...(profile?.dislikedGenres ?? {}) },
    preferredLanguages: {
      ...base.preferredLanguages,
      ...(profile?.preferredLanguages ?? {})
    },
    dislikedLanguages: { ...base.dislikedLanguages, ...(profile?.dislikedLanguages ?? {}) },
    preferredDecades: { ...base.preferredDecades, ...(profile?.preferredDecades ?? {}) },
    vibeScores: { ...base.vibeScores, ...(profile?.vibeScores ?? {}) }
  };
}

function ensureSessionShape(session) {
  const base = createSessionState();
  return {
    ...base,
    ...session,
    shortTerm: {
      ...base.shortTerm,
      ...(session?.shortTerm ?? {}),
      genres: { ...base.shortTerm.genres, ...(session?.shortTerm?.genres ?? {}) },
      languages: { ...base.shortTerm.languages, ...(session?.shortTerm?.languages ?? {}) },
      vibes: { ...base.shortTerm.vibes, ...(session?.shortTerm?.vibes ?? {}) },
      decades: { ...base.shortTerm.decades, ...(session?.shortTerm?.decades ?? {}) }
    },
    recentRecommendations: [...(session?.recentRecommendations ?? [])]
  };
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalize(value) {
  return String(value || "").toLowerCase().trim();
}

function tokenize(text) {
  return normalize(text)
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 2);
}

function classifyMention(normalizedText, phrase) {
  const escaped = escapeRegex(phrase);
  const mentionPattern = new RegExp(`\\b${escaped}\\b`, "i");
  if (!mentionPattern.test(normalizedText)) {
    return 0;
  }

  const positiveCuePattern = POSITIVE_CUES.map(escapeRegex).join("|");
  const negativeCuePattern = NEGATIVE_CUES.map(escapeRegex).join("|");
  const positivePattern = new RegExp(
    `(?:${positiveCuePattern})[^.?!]{0,30}\\b${escaped}\\b|\\b${escaped}\\b[^.?!]{0,30}(?:${positiveCuePattern})`,
    "i"
  );
  const negativePattern = new RegExp(
    `(?:${negativeCuePattern})[^.?!]{0,30}\\b${escaped}\\b|\\b${escaped}\\b[^.?!]{0,20}(?:not|no|avoid|skip)`,
    "i"
  );

  if (negativePattern.test(normalizedText)) {
    return -1;
  }
  if (positivePattern.test(normalizedText)) {
    return 1;
  }
  return 1;
}

function getDecadesFromText(normalizedText) {
  const decades = [];
  const yearMatches = normalizedText.match(/\b(19|20)\d{2}\b/g) || [];
  for (const yearValue of yearMatches) {
    const year = Number(yearValue);
    const decade = Math.floor(year / 10) * 10;
    decades.push(`${decade}s`);
  }

  const explicitDecades = normalizedText.match(/\b(?:19\d0s|20\d0s|[6-9]0s)\b/g) || [];
  for (const value of explicitDecades) {
    if (value.length === 3) {
      decades.push(`19${value}`);
    } else {
      decades.push(value);
    }
  }
  return Array.from(new Set(decades));
}

function upsertScore(target, key, delta) {
  if (!key) {
    return;
  }
  const current = Number(target[key] || 0);
  target[key] = Number((current + delta).toFixed(3));
}

function applyDecay(weightMap, factor = 0.72) {
  for (const key of Object.keys(weightMap)) {
    const nextValue = Number((weightMap[key] * factor).toFixed(3));
    if (nextValue <= 0.12) {
      delete weightMap[key];
    } else {
      weightMap[key] = nextValue;
    }
  }
}

function collectTaxonomy(movies) {
  const genres = new Set(Object.values(GENRE_ALIASES));
  const languages = new Set(Object.values(LANGUAGE_ALIASES));

  for (const movie of movies) {
    for (const genre of movie.genres || []) {
      genres.add(normalize(genre));
    }
    if (movie.language) {
      languages.add(normalize(movie.language));
    }
  }

  return {
    genres: Array.from(genres),
    languages: Array.from(languages)
  };
}

function extractSignals(message, movies) {
  const normalizedText = normalize(message);
  const taxonomy = collectTaxonomy(movies);
  const signal = {
    preferredGenres: {},
    dislikedGenres: {},
    preferredLanguages: {},
    dislikedLanguages: {},
    decades: {},
    vibes: {},
    references: {},
    immediate: IMMEDIATE_CUES.some((cue) => normalizedText.includes(cue)),
    capturedSignals: 0
  };

  for (const genre of taxonomy.genres) {
    const sentiment = classifyMention(normalizedText, genre);
    if (sentiment > 0) {
      upsertScore(signal.preferredGenres, genre, sentiment);
      signal.capturedSignals += 1;
    } else if (sentiment < 0) {
      upsertScore(signal.dislikedGenres, genre, Math.abs(sentiment));
      signal.capturedSignals += 1;
    }
  }

  for (const [alias, canonical] of Object.entries(LANGUAGE_ALIASES)) {
    const sentiment = classifyMention(normalizedText, alias);
    if (sentiment > 0) {
      upsertScore(signal.preferredLanguages, canonical, sentiment);
      signal.capturedSignals += 1;
    } else if (sentiment < 0) {
      upsertScore(signal.dislikedLanguages, canonical, Math.abs(sentiment));
      signal.capturedSignals += 1;
    }
  }

  for (const decade of getDecadesFromText(normalizedText)) {
    upsertScore(signal.decades, decade, 1);
    signal.capturedSignals += 1;
  }

  for (const [vibe, terms] of Object.entries(VIBE_CUES)) {
    for (const term of terms) {
      if (normalizedText.includes(term)) {
        upsertScore(signal.vibes, vibe, 1);
        signal.capturedSignals += 1;
        break;
      }
    }
  }

  for (const movie of movies) {
    const title = normalize(movie.title);
    if (!title || !normalizedText.includes(title)) {
      continue;
    }
    signal.references[movie.id] = 1;
    for (const genre of movie.genres || []) {
      upsertScore(signal.preferredGenres, normalize(genre), 0.7);
    }
    if (movie.language) {
      upsertScore(signal.preferredLanguages, normalize(movie.language), 0.6);
    }
    for (const vibe of movie.vibes || []) {
      upsertScore(signal.vibes, normalize(vibe), 0.6);
    }
    signal.capturedSignals += 2;
  }

  return signal;
}

function applySignalsToProfile(profile, signal) {
  profile.interactionCount += 1;

  for (const [genre, score] of Object.entries(signal.preferredGenres)) {
    upsertScore(profile.likedGenres, genre, score);
  }
  for (const [genre, score] of Object.entries(signal.dislikedGenres)) {
    upsertScore(profile.dislikedGenres, genre, score);
  }
  for (const [language, score] of Object.entries(signal.preferredLanguages)) {
    upsertScore(profile.preferredLanguages, language, score);
  }
  for (const [language, score] of Object.entries(signal.dislikedLanguages)) {
    upsertScore(profile.dislikedLanguages, language, score);
  }
  for (const [decade, score] of Object.entries(signal.decades)) {
    upsertScore(profile.preferredDecades, decade, score);
  }
  for (const [vibe, score] of Object.entries(signal.vibes)) {
    upsertScore(profile.vibeScores, vibe, score);
  }

  profile.lastUpdated = new Date().toISOString();
}

function applySignalsToSession(session, signal) {
  applyDecay(session.shortTerm.genres);
  applyDecay(session.shortTerm.languages);
  applyDecay(session.shortTerm.vibes);
  applyDecay(session.shortTerm.decades);

  const immediateBonus = signal.immediate ? 1.4 : 1;
  for (const [genre, score] of Object.entries(signal.preferredGenres)) {
    upsertScore(session.shortTerm.genres, genre, score * immediateBonus);
  }
  for (const [language, score] of Object.entries(signal.preferredLanguages)) {
    upsertScore(session.shortTerm.languages, language, score * immediateBonus);
  }
  for (const [vibe, score] of Object.entries(signal.vibes)) {
    upsertScore(session.shortTerm.vibes, vibe, score * immediateBonus);
  }
  for (const [decade, score] of Object.entries(signal.decades)) {
    upsertScore(session.shortTerm.decades, decade, score * immediateBonus);
  }
}

function getDecadeLabel(year) {
  const decade = Math.floor(Number(year) / 10) * 10;
  return `${decade}s`;
}

function scoreMovie(movie, message, profile, session, signal) {
  let score = 0;
  const normalizedLanguage = normalize(movie.language);
  const movieDecade = getDecadeLabel(movie.year);
  const tokens = tokenize(message);

  for (const genreRaw of movie.genres || []) {
    const genre = normalize(genreRaw);
    score += (profile.likedGenres[genre] || 0) * 1.9;
    score -= (profile.dislikedGenres[genre] || 0) * 2.5;
    score += (session.shortTerm.genres[genre] || 0) * 2.8;
    score += (signal.preferredGenres[genre] || 0) * 2.2;
    score -= (signal.dislikedGenres[genre] || 0) * 3.2;
  }

  score += (profile.preferredLanguages[normalizedLanguage] || 0) * 2.2;
  score -= (profile.dislikedLanguages[normalizedLanguage] || 0) * 3.5;
  score += (session.shortTerm.languages[normalizedLanguage] || 0) * 3;
  score += (signal.preferredLanguages[normalizedLanguage] || 0) * 2.4;
  score -= (signal.dislikedLanguages[normalizedLanguage] || 0) * 3.2;

  score += (profile.preferredDecades[movieDecade] || 0) * 1.3;
  score += (session.shortTerm.decades[movieDecade] || 0) * 2;
  score += (signal.decades[movieDecade] || 0) * 1.5;

  for (const vibeRaw of movie.vibes || []) {
    const vibe = normalize(vibeRaw);
    score += (profile.vibeScores[vibe] || 0) * 1.4;
    score += (session.shortTerm.vibes[vibe] || 0) * 2.1;
    score += (signal.vibes[vibe] || 0) * 1.6;
  }

  const title = normalize(movie.title);
  const director = normalize(movie.director);
  if (title && normalize(message).includes(title)) {
    score += 4.5;
  }
  if (director && normalize(message).includes(director)) {
    score += 3.5;
  }

  const searchable = `${title} ${normalize(movie.blurb)} ${normalize(movie.director)}`;
  for (const token of tokens) {
    if (searchable.includes(token)) {
      score += 0.3;
    }
  }

  return score;
}

function reasonForMovie(movie, profile, session, signal) {
  const reasons = [];
  const normalizedLanguage = normalize(movie.language);

  if (
    (signal.preferredLanguages[normalizedLanguage] || 0) > 0 ||
    (session.shortTerm.languages[normalizedLanguage] || 0) > 0.6
  ) {
    reasons.push(`${movie.language} match`);
  }

  const matchingGenres = (movie.genres || []).filter((genreRaw) => {
    const genre = normalize(genreRaw);
    return (
      (signal.preferredGenres[genre] || 0) > 0 ||
      (session.shortTerm.genres[genre] || 0) > 0.6 ||
      (profile.likedGenres[genre] || 0) > 1.3
    );
  });
  if (matchingGenres.length > 0) {
    reasons.push(matchingGenres.slice(0, 2).join(" + "));
  }

  const matchingVibes = (movie.vibes || []).filter((vibeRaw) => {
    const vibe = normalize(vibeRaw);
    return (session.shortTerm.vibes[vibe] || 0) > 0.6 || (profile.vibeScores[vibe] || 0) > 1.2;
  });
  if (matchingVibes.length > 0) {
    reasons.push(`${matchingVibes[0]} vibe`);
  }

  if (reasons.length === 0) {
    reasons.push("strong all-around fit");
  }
  return reasons.join(", ");
}

function rankMovies(movies, message, profile, session, signal) {
  const scored = movies.map((movie) => ({
    ...movie,
    score: scoreMovie(movie, message, profile, session, signal)
  }));

  const recentSet = new Set(session.recentRecommendations || []);
  for (const candidate of scored) {
    if (recentSet.has(candidate.id)) {
      candidate.score -= 4;
    }
  }

  scored.sort((a, b) => b.score - a.score);
  return scored;
}

function calculatePersonaDepth(profile) {
  const weightedBucketCount =
    Object.keys(profile.likedGenres).length +
    Object.keys(profile.preferredLanguages).length +
    Object.keys(profile.vibeScores).length +
    Object.keys(profile.preferredDecades).length;

  const depthRaw = profile.interactionCount * 0.09 + weightedBucketCount * 0.08;
  return Math.max(0, Math.min(1, Number(depthRaw.toFixed(3))));
}

function shouldAskQuestion(profile, signal, personaDepth) {
  const interaction = profile.interactionCount;

  if (personaDepth < 0.32) {
    return true;
  }
  if (signal.capturedSignals === 0 && personaDepth < 0.55) {
    return true;
  }
  if (personaDepth < 0.58) {
    return interaction % 3 === 0;
  }
  if (personaDepth < 0.8) {
    return interaction % 5 === 0;
  }
  return interaction % 8 === 0;
}

function pickQuestion(profile, session, signal) {
  const hasShortVibe = Object.keys(session.shortTerm.vibes).length > 0;
  const hasGenre = Object.keys(profile.likedGenres).length > 0 || Object.keys(signal.preferredGenres).length > 0;
  const hasLanguage =
    Object.keys(profile.preferredLanguages).length > 0 ||
    Object.keys(session.shortTerm.languages).length > 0;
  const hasDecade = Object.keys(profile.preferredDecades).length > 0;

  if (!hasShortVibe) {
    return QUICK_QUESTIONS[0];
  }
  if (!hasGenre) {
    return QUICK_QUESTIONS[1];
  }
  if (!hasLanguage) {
    return QUICK_QUESTIONS[2];
  }
  if (!hasDecade) {
    return QUICK_QUESTIONS[4];
  }
  return QUICK_QUESTIONS[3];
}

function composeReply(recommendations, profile, personaDepth, question) {
  const opener = OPENERS[profile.interactionCount % OPENERS.length];

  const recLines = recommendations
    .map(
      (movie, index) =>
        `${index + 1}. ${movie.title} (${movie.year}, ${movie.language}) - ${movie.reason}.`
    )
    .join("\n");

  const adaptationLine =
    personaDepth >= 0.65
      ? "I'm dialing into your long-term taste now, so I can recommend faster with fewer questions."
      : "Give me one tiny clue each turn and I will sharpen both your tonight mood and your bigger taste profile.";

  const questionLine = question ? `\n${question}` : "";
  return `${opener}\n${recLines}\n${adaptationLine}${questionLine}`;
}

function runConversationTurn({ message, profile, session, movies, limit = 3 }) {
  const safeProfile = ensureProfileShape(profile);
  const safeSession = ensureSessionShape(session);
  const safeMessage = String(message || "");
  const safeMovies = Array.isArray(movies) ? movies : [];

  const signal = extractSignals(safeMessage, safeMovies);
  applySignalsToProfile(safeProfile, signal);
  applySignalsToSession(safeSession, signal);

  const personaDepth = calculatePersonaDepth(safeProfile);
  const ranked = rankMovies(safeMovies, safeMessage, safeProfile, safeSession, signal);
  const recommendations = ranked.slice(0, limit).map((movie) => ({
    id: movie.id,
    title: movie.title,
    year: movie.year,
    language: movie.language,
    country: movie.country,
    director: movie.director,
    genres: movie.genres,
    vibes: movie.vibes,
    blurb: movie.blurb,
    score: Number(movie.score.toFixed(3)),
    reason: reasonForMovie(movie, safeProfile, safeSession, signal)
  }));

  safeProfile.recommendationCount += recommendations.length;
  safeSession.recentRecommendations = [
    ...new Set([
      ...(safeSession.recentRecommendations || []),
      ...recommendations.map((movie) => movie.id)
    ])
  ].slice(-12);

  const askedQuestion = shouldAskQuestion(safeProfile, signal, personaDepth);
  const question = askedQuestion ? pickQuestion(safeProfile, safeSession, signal) : null;
  if (askedQuestion) {
    safeProfile.askedQuestionsCount += 1;
  }

  const reply = composeReply(recommendations, safeProfile, personaDepth, question);

  return {
    reply,
    recommendations,
    askedQuestion,
    question,
    personaDepth,
    profile: safeProfile,
    session: safeSession
  };
}

module.exports = {
  createEmptyProfile,
  createSessionState,
  runConversationTurn,
  calculatePersonaDepth
};
