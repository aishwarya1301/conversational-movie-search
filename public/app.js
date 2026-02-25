const chatLog = document.getElementById("chat-log");
const chatForm = document.getElementById("chat-form");
const messageInput = document.getElementById("message-input");
const quickChips = Array.from(document.querySelectorAll(".chip"));
const resetButton = document.getElementById("reset-profile");
const personaDepthNode = document.getElementById("persona-depth");

const USER_KEY = "movieTapeUserId";
const FALLBACK_GREETING =
  "Hey cinephile, I am your neighborhood videotape guy. Tell me a mood, language, genre, or one film you loved, and I will pull better picks each turn.";

function getUserId() {
  const existing = localStorage.getItem(USER_KEY);
  if (existing) {
    return existing;
  }
  const nextId = `user-${crypto.randomUUID()}`;
  localStorage.setItem(USER_KEY, nextId);
  return nextId;
}

const userId = getUserId();

function addMessage(role, text, recommendations = []) {
  const wrapper = document.createElement("article");
  wrapper.className = `message ${role}`;

  const textNode = document.createElement("div");
  textNode.textContent = text;
  wrapper.append(textNode);

  if (role === "assistant" && Array.isArray(recommendations) && recommendations.length > 0) {
    const list = document.createElement("ol");
    list.className = "rec-list";
    for (const movie of recommendations) {
      const item = document.createElement("li");
      item.textContent = `${movie.title} (${movie.year}, ${movie.language}) - ${movie.reason}`;
      list.append(item);
    }
    wrapper.append(list);
  }

  chatLog.append(wrapper);
  chatLog.scrollTop = chatLog.scrollHeight;
}

function setDepth(personaDepth) {
  const percentage = `${Math.round(Math.max(0, Math.min(1, personaDepth || 0)) * 100)}%`;
  personaDepthNode.textContent = percentage;
}

async function sendMessage(message) {
  addMessage("user", message);
  messageInput.value = "";
  messageInput.focus();

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        userId,
        message
      })
    });

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    const payload = await response.json();
    addMessage("assistant", payload.reply, payload.recommendations);
    setDepth(payload.personaDepth);
  } catch (error) {
    addMessage(
      "assistant",
      "My recommendation shelves just glitched. Try again in a moment, and I will rethread the tape."
    );
  }
}

chatForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const message = messageInput.value.trim();
  if (!message) {
    return;
  }
  await sendMessage(message);
});

for (const chip of quickChips) {
  chip.addEventListener("click", async () => {
    await sendMessage(chip.textContent || "");
  });
}

resetButton.addEventListener("click", async () => {
  try {
    const response = await fetch("/api/reset", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ userId })
    });
    if (!response.ok) {
      throw new Error(`Reset failed with status ${response.status}`);
    }

    chatLog.innerHTML = "";
    setDepth(0);
    addMessage(
      "assistant",
      "Profile reset complete. Fresh tape stack, clean slate. Give me one clue and we begin again."
    );
  } catch (error) {
    addMessage("assistant", "Reset failed. The profile card got stuck in the filing cabinet.");
  }
});

addMessage("assistant", FALLBACK_GREETING);
