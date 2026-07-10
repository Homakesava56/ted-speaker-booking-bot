let speakers = [];
let topics = [];

let mode = "topic";
let selectedSpeaker = null;
let selectedTopic = "";
let bookingStep = 0;
let booking = {};

const bookingQuestions = [
  { key: "eventName", question: "What is the name of your event?" },
  { key: "eventDate", question: "What is the event date? Please use MM/DD/YYYY." },
  { key: "eventFormat", question: "Will the event be virtual or in person?", options: ["Virtual", "In Person"] },
  { key: "location", question: "What is the event location or virtual platform?" },
  { key: "audienceSize", question: "What is the expected audience size?" },
  { key: "budget", question: "What is your maximum budget in US dollars?" },
  { key: "contactName", question: "What is your full name?" },
  { key: "email", question: "What is your email address?" }
];

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[character]);
}

function addBot(content, className = "") {
  const chat = document.getElementById("chat");
  const row = document.createElement("div");
  row.className = "row bot";

  const bubble = document.createElement("div");
  bubble.className = `bubble ${className}`;
  bubble.innerHTML = content;

  row.appendChild(bubble);
  chat.appendChild(row);
  chat.scrollTop = chat.scrollHeight;
}

function addUser(text) {
  const chat = document.getElementById("chat");
  const row = document.createElement("div");
  row.className = "row user";

  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.textContent = text;

  row.appendChild(bubble);
  chat.appendChild(row);
  chat.scrollTop = chat.scrollHeight;
}

function showTopics() {
  mode = "topic";

  const buttons = topics.map(topic =>
    `<button class="option" onclick='chooseTopic(${JSON.stringify(topic)})'>${escapeHtml(topic)}</button>`
  ).join("");

  addBot(`<strong>Please select a TED Talk topic:</strong><div class="options">${buttons}</div>`);
}

function chooseTopic(topic) {
  addUser(topic);
  selectedTopic = topic;

  const matches = speakers.filter(speaker => speaker.topics.includes(topic));

  if (!matches.length) {
    addBot(`Sorry, I don't find any speaker for <strong>${escapeHtml(topic)}</strong>.`);
    showTopics();
    return;
  }

  addBot(`<strong>I found ${matches.length} matching speaker${matches.length > 1 ? "s" : ""}.</strong>`);
  matches.forEach(showSpeaker);
}

function showSpeaker(speaker) {
  const card = `
    <div class="speaker-card">
      <h3>${escapeHtml(speaker.name)}</h3>
      <div class="meta">${escapeHtml(speaker.title)}</div>
      <div class="detail"><strong>Topic:</strong> ${escapeHtml(selectedTopic)}</div>
      <div class="detail"><strong>Bio:</strong> ${escapeHtml(speaker.bio)}</div>
      <div class="detail"><strong>Style:</strong> ${escapeHtml(speaker.style)}</div>
      <div class="detail"><strong>Languages:</strong> ${escapeHtml(speaker.languages.join(", "))}</div>
      <div class="detail"><strong>Travel:</strong> ${escapeHtml(speaker.travel)}</div>
      <div class="detail"><strong>Pricing:</strong> ${escapeHtml(speaker.fees)}</div>
      <button class="action" onclick='confirmSpeaker(${JSON.stringify(speaker.name)})'>Confirm This Speaker</button>
    </div>`;

  addBot(card);
}

function confirmSpeaker(name) {
  selectedSpeaker = speakers.find(speaker => speaker.name === name);
  addUser(`Confirm ${name}`);
  addBot(`<strong>${escapeHtml(name)} has been selected.</strong><br>I will now collect the booking details one question at a time.`);

  mode = "booking";
  bookingStep = 0;
  booking = {};

  setTimeout(askBookingQuestion, 350);
}

function askBookingQuestion() {
  const item = bookingQuestions[bookingStep];

  if (!item) {
    showBookingSummary();
    return;
  }

  let html = `<strong>${escapeHtml(item.question)}</strong>`;

  if (item.options) {
    html += `<div class="options">` + item.options.map(option =>
      `<button class="option" onclick='answerBookingOption(${JSON.stringify(option)})'>${escapeHtml(option)}</button>`
    ).join("") + `</div>`;
  }

  addBot(html);
}

function answerBookingOption(answer) {
  addUser(answer);
  saveBookingAnswer(answer);
}

function submitInput() {
  const input = document.getElementById("userInput");
  const value = input.value.trim();

  if (!value) {
    return;
  }

  input.value = "";
  addUser(value);

  if (mode === "booking") {
    saveBookingAnswer(value);
  } else {
    handleTypedTopic(value);
  }
}

function saveBookingAnswer(answer) {
  const item = bookingQuestions[bookingStep];

  if (item.key === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(answer)) {
    addBot("Please enter a valid email address.");
    return;
  }

  if (item.key === "budget") {
    const amount = Number(answer.replace(/[$,]/g, ""));

    if (!amount || amount < 0) {
      addBot("Please enter a valid budget, for example: 1500.");
      return;
    }

    answer = `$${amount.toLocaleString()}`;
  }

  booking[item.key] = answer;
  bookingStep++;
  setTimeout(askBookingQuestion, 300);
}

function showBookingSummary() {
  mode = "complete";

  const summary = `
    <strong>✅ Booking Request Created</strong><br><br>
    <strong>Speaker:</strong> ${escapeHtml(selectedSpeaker.name)}<br>
    <strong>Topic:</strong> ${escapeHtml(selectedTopic)}<br>
    <strong>Event:</strong> ${escapeHtml(booking.eventName)}<br>
    <strong>Date:</strong> ${escapeHtml(booking.eventDate)}<br>
    <strong>Format:</strong> ${escapeHtml(booking.eventFormat)}<br>
    <strong>Location/Platform:</strong> ${escapeHtml(booking.location)}<br>
    <strong>Audience Size:</strong> ${escapeHtml(booking.audienceSize)}<br>
    <strong>Budget:</strong> ${escapeHtml(booking.budget)}<br>
    <strong>Contact:</strong> ${escapeHtml(booking.contactName)}<br>
    <strong>Email:</strong> ${escapeHtml(booking.email)}<br><br>
    <strong>Status:</strong> Pending speaker confirmation.
    <div class="options">
      <button class="option" onclick="restartBot()">Start New Booking</button>
    </div>`;

  addBot(summary, "summary");
}

function normalize(text) {
  return text.toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function handleTypedTopic(value) {
  const query = normalize(value);

  const matches = topics.filter(topic => {
    const normalizedTopic = normalize(topic);

    return normalizedTopic.includes(query) ||
      query.includes(normalizedTopic) ||
      query.split(" ").some(word => word.length > 3 && normalizedTopic.includes(word));
  });

  if (!matches.length) {
    addBot(`Sorry, I don't find any speaker for <strong>${escapeHtml(value)}</strong>.<br>Please select one of the available topics.`);
    showTopics();
    return;
  }

  const buttons = matches.map(topic =>
    `<button class="option" onclick='chooseTopic(${JSON.stringify(topic)})'>${escapeHtml(topic)}</button>`
  ).join("");

  addBot(`<strong>I found these related topics:</strong><div class="options">${buttons}</div>`);
}

function restartBot() {
  selectedSpeaker = null;
  selectedTopic = "";
  booking = {};
  bookingStep = 0;
  mode = "topic";

  addBot("Let’s start a new booking.");
  setTimeout(showTopics, 250);
}

async function initializeBot() {
  try {
    const response = await fetch("speakers.json");

    if (!response.ok) {
      throw new Error("Unable to load speaker data.");
    }

    speakers = await response.json();
    topics = [...new Set(speakers.flatMap(speaker => speaker.topics))].sort();

    addBot("Hello! I can help you find and book a TED Talk speaker.");
    setTimeout(showTopics, 350);
  } catch (error) {
    addBot("The speaker data could not be loaded. Please make sure speakers.json is uploaded in the same folder as index.html.");
    console.error(error);
  }
}

document.getElementById("sendButton").addEventListener("click", submitInput);
document.getElementById("userInput").addEventListener("keydown", event => {
  if (event.key === "Enter") {
    submitInput();
  }
});

initializeBot();
