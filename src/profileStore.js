const fs = require("node:fs");
const path = require("node:path");
const { createEmptyProfile } = require("./recommender");

const PROFILE_PATH = path.join(__dirname, "..", "data", "userProfiles.json");

function ensureProfileFile() {
  const parentDir = path.dirname(PROFILE_PATH);
  if (!fs.existsSync(parentDir)) {
    fs.mkdirSync(parentDir, { recursive: true });
  }
  if (!fs.existsSync(PROFILE_PATH)) {
    fs.writeFileSync(PROFILE_PATH, JSON.stringify({}, null, 2), "utf8");
  }
}

function readAllProfiles() {
  ensureProfileFile();
  try {
    const data = fs.readFileSync(PROFILE_PATH, "utf8");
    if (!data.trim()) {
      return {};
    }
    return JSON.parse(data);
  } catch (error) {
    return {};
  }
}

function writeAllProfiles(profiles) {
  ensureProfileFile();
  fs.writeFileSync(PROFILE_PATH, JSON.stringify(profiles, null, 2), "utf8");
}

function getProfile(userId) {
  const profiles = readAllProfiles();
  if (!profiles[userId]) {
    return createEmptyProfile();
  }
  return profiles[userId];
}

function saveProfile(userId, profile) {
  const profiles = readAllProfiles();
  profiles[userId] = profile;
  writeAllProfiles(profiles);
}

function resetProfile(userId) {
  const profiles = readAllProfiles();
  delete profiles[userId];
  writeAllProfiles(profiles);
}

module.exports = {
  getProfile,
  saveProfile,
  resetProfile,
  PROFILE_PATH
};
