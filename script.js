let speakers = [];
let topics = [];

let mode = "topic";
let selectedSpeaker = null;
let selectedTopic = "";
let bookingStep = 0;
let booking = {};
let pendingBudget = 0;

const bookingQuestions = [
  { key: "eventName", question: "What is the name of your event?" },
  { key: "eventDate", question: "What is the event date? Please use MM/DD/YYYY." },
  {
    key: "eventFormat",
    question: "Will the event be virtual or in person?",
    options: ["Virtual", "In Person"]
  },
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

function normalize(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
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
    `<button class="option" onclick='chooseTopic(${JSON.stringify(topic)})'>
      ${escapeHtml(topic)}
    </button>`
  ).join("");

  addBot(`
    <strong>Please select a TED Talk topic:</strong>
    <div class="options">${buttons}</div>
    <br>
    You can also type a speaker's name to view all topics offered by that speaker.
  `);
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

  addBot(`
    <strong>I found ${matches.length} matching speaker${matches.length > 1 ? "s" : ""}.</strong>
  `);

  matches.forEach(showSpeaker);
}

function showSpeaker(speaker) {
  const card = `
    <div class="speaker-card">
      <h3>${escapeHtml(speaker.name)}</h3>
      <div class="meta">${escapeHtml(speaker.title)}</div>

      <div class="detail">
        <strong>Selected Topic:</strong> ${escapeHtml(selectedTopic)}
      </div>

      <div class="detail">
        <strong>Bio:</strong> ${escapeHtml(speaker.bio)}
      </div>

      <div class="detail">
        <strong>Style:</strong> ${escapeHtml(speaker.style)}
      </div>

      <div class="detail">
        <strong>Languages:</strong> ${escapeHtml(speaker.languages.join(", "))}
      </div>

      <div class="detail">
        <strong>Travel:</strong> ${escapeHtml(speaker.travel)}
      </div>

      <div class="detail">
        <strong>Pricing:</strong> ${escapeHtml(speaker.feesDisplay)}
      </div>

      <button
        class="action"
        onclick='confirmSpeaker(${JSON.stringify(speaker.name)})'>
        Confirm This Speaker
      </button>
    </div>
  `;

  addBot(card);
}

function findSpeakersByName(input) {
  const query = normalize(input);

  if (!query) {
    return [];
  }

  return speakers.filter(speaker => {
    const fullName = normalize(speaker.name);
    const nameParts = fullName.split(" ");

    return fullName === query ||
      fullName.includes(query) ||
      query.includes(fullName) ||
      nameParts.some(part => part.length > 2 && part === query);
  });
}

function showSpeakerTopics(speaker) {
  selectedSpeaker = speaker;

  const topicButtons = speaker.topics.map(topic =>
    `<button class="option" onclick='selectSpeakerTopic(${JSON.stringify(speaker.name)}, ${JSON.stringify(topic)})'>
      ${escapeHtml(topic)}
    </button>`
  ).join("");

  addBot(`
    <div class="speaker-card">
      <h3>${escapeHtml(speaker.name)}</h3>
      <div class="meta">${escapeHtml(speaker.title)}</div>

      <div class="detail">
        <strong>Bio:</strong> ${escapeHtml(speaker.bio)}
      </div>

      <div class="detail">
        <strong>Speaking Style:</strong> ${escapeHtml(speaker.style)}
      </div>

      <div class="detail">
        <strong>Languages:</strong> ${escapeHtml(speaker.languages.join(", "))}
      </div>

      <div class="detail">
        <strong>Travel:</strong> ${escapeHtml(speaker.travel)}
      </div>

      <div class="detail">
        <strong>Pricing:</strong> ${escapeHtml(speaker.feesDisplay)}
      </div>

      <div class="detail">
        <strong>TED Talk Topics:</strong>
      </div>

      <div class="options">
        ${topicButtons}
      </div>
    </div>
  `);
}

function selectSpeakerTopic(speakerName, topic) {
  selectedSpeaker = speakers.find(speaker => speaker.name === speakerName);
  selectedTopic = topic;

  addUser(topic);

  addBot(`
    <strong>You selected:</strong> ${escapeHtml(topic)}<br><br>
    <strong>Speaker:</strong> ${escapeHtml(selectedSpeaker.name)}<br><br>

    <button
      class="action"
      onclick='confirmSpeaker(${JSON.stringify(selectedSpeaker.name)})'>
      Confirm This Speaker
    </button>
  `);
}

function confirmSpeaker(name) {
  selectedSpeaker = speakers.find(speaker => speaker.name === name);

  addUser(`Confirm ${name}`);

  addBot(`
    <strong>${escapeHtml(name)} has been selected.</strong><br>
    I will now collect the booking details one question at a time.
  `);

  mode = "booking";
  bookingStep = 0;
  booking = {};
  pendingBudget = 0;

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
    html += `
      <div class="options">
        ${item.options.map(option =>
          `<button
            class="option"
            onclick='answerBookingOption(${JSON.stringify(option)})'>
            ${escapeHtml(option)}
          </button>`
        ).join("")}
      </div>
    `;
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
    return;
  }

  if (mode === "budgetMismatch") {
    handleBudgetMismatchInput(value);
    return;
  }

  handleSpeakerOrTopicSearch(value);
}

function handleSpeakerOrTopicSearch(value) {
  const speakerMatches = findSpeakersByName(value);

  if (speakerMatches.length === 1) {
    const speaker = speakerMatches[0];

    addBot(`
      <strong>I found ${escapeHtml(speaker.name)}.</strong><br>
      Here are all the TED Talk topics offered by this speaker.
    `);

    showSpeakerTopics(speaker);
    return;
  }

  if (speakerMatches.length > 1) {
    const buttons = speakerMatches.map(speaker =>
      `<button
        class="option"
        onclick='showSpeakerByName(${JSON.stringify(speaker.name)})'>
        ${escapeHtml(speaker.name)}
      </button>`
    ).join("");

    addBot(`
      <strong>I found multiple matching speakers.</strong><br>
      Please choose one:
      <div class="options">${buttons}</div>
    `);

    return;
  }

  handleTypedTopic(value);
}

function showSpeakerByName(name) {
  addUser(name);

  const speaker = speakers.find(item => item.name === name);

  if (!speaker) {
    addBot("Sorry, I could not find that speaker.");
    return;
  }

  showSpeakerTopics(speaker);
}

function saveBookingAnswer(answer) {
  const item = bookingQuestions[bookingStep];

  if (!item) {
    return;
  }

  if (item.key === "email") {
    const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(answer);

    if (!validEmail) {
      addBot("Please enter a valid email address.");
      return;
    }
  }

  if (item.key === "budget") {
    const amount = Number(answer.replace(/[$,]/g, ""));

    if (!amount || amount < 0) {
      addBot("Please enter a valid budget, for example: 500.");
      return;
    }

    pendingBudget = amount;

    const format = booking.eventFormat;
    const minimumFee = getMinimumFee(selectedSpeaker, format);

    if (minimumFee !== null && amount < minimumFee) {
      showBudgetMismatch(amount, minimumFee);
      return;
    }

    booking.budget = `$${amount.toLocaleString()}`;
    bookingStep++;
    setTimeout(askBookingQuestion, 300);
    return;
  }

  booking[item.key] = answer;
  bookingStep++;
  setTimeout(askBookingQuestion, 300);
}

function getMinimumFee(speaker, format) {
  if (!speaker || !speaker.minimumFees) {
    return null;
  }

  return speaker.minimumFees[format] ?? null;
}

function showBudgetMismatch(userBudget, minimumFee) {
  mode = "budgetMismatch";

  addBot(`
    <strong>Budget Mismatch</strong><br><br>

    Your budget is <strong>$${userBudget.toLocaleString()}</strong>.<br>
    ${escapeHtml(selectedSpeaker.name)} charges a minimum of
    <strong>$${minimumFee.toLocaleString()}</strong>
    for a ${escapeHtml(booking.eventFormat.toLowerCase())} event.<br><br>

    This speaker charges more than your available budget.

    <div class="options">
      <button class="option" onclick="increaseBudget()">Increase Budget</button>
      <button class="option" onclick="chooseAnotherSpeaker()">Choose Another Speaker</button>
      <button class="option" onclick="findAffordableSpeakers()">Find Speakers Within My Budget</button>
    </div>
  `);
}

function increaseBudget() {
  addUser("Increase Budget");
  mode = "booking";

  addBot(`
    Please enter a new budget.<br>
    The minimum required budget is
    <strong>$${getMinimumFee(selectedSpeaker, booking.eventFormat).toLocaleString()}</strong>.
  `);
}

function chooseAnotherSpeaker() {
  addUser("Choose Another Speaker");

  mode = "topic";
  selectedSpeaker = null;
  booking = {};
  bookingStep = 0;

  addBot("No problem. Type another speaker's name or choose another topic.");
  setTimeout(showTopics, 250);
}

function findAffordableSpeakers() {
  addUser("Find Speakers Within My Budget");

  const affordableSpeakers = speakers.filter(speaker => {
    const minimumFee = getMinimumFee(speaker, booking.eventFormat);

    return minimumFee !== null &&
      minimumFee <= pendingBudget &&
      speaker.topics.some(topic =>
        normalize(topic).split(" ").some(word =>
          word.length > 3 && normalize(selectedTopic).includes(word)
        ) ||
        normalize(selectedTopic).split(" ").some(word =>
          word.length > 3 && normalize(topic).includes(word)
        )
      );
  });

  if (!affordableSpeakers.length) {
    addBot(`
      I could not find another speaker for
      <strong>${escapeHtml(selectedTopic)}</strong>
      within your budget of
      <strong>$${pendingBudget.toLocaleString()}</strong>.<br><br>

      <div class="options">
        <button class="option" onclick="increaseBudget()">Increase Budget</button>
        <button class="option" onclick="chooseAnotherSpeaker()">Choose Another Speaker</button>
      </div>
    `);

    return;
  }

  addBot(`
    <strong>I found ${affordableSpeakers.length} affordable speaker${affordableSpeakers.length > 1 ? "s" : ""}.</strong>
  `);

  affordableSpeakers.forEach(showAffordableSpeaker);
}

function showAffordableSpeaker(speaker) {
  const minimumFee = getMinimumFee(speaker, booking.eventFormat);

  addBot(`
    <div class="speaker-card">
      <h3>${escapeHtml(speaker.name)}</h3>
      <div class="meta">${escapeHtml(speaker.title)}</div>

      <div class="detail">
        <strong>Related Topic:</strong> ${escapeHtml(findBestRelatedTopic(speaker))}
      </div>

      <div class="detail">
        <strong>Minimum Fee:</strong> $${minimumFee.toLocaleString()}
      </div>

      <div class="detail">
        <strong>Your Budget:</strong> $${pendingBudget.toLocaleString()}
      </div>

      <button
        class="action"
        onclick='switchToAffordableSpeaker(${JSON.stringify(speaker.name)})'>
        Book This Speaker Instead
      </button>
    </div>
  `);
}

function findBestRelatedTopic(speaker) {
  const selectedWords = normalize(selectedTopic)
    .split(" ")
    .filter(word => word.length > 3);

  const scoredTopics = speaker.topics.map(topic => {
    const normalizedTopic = normalize(topic);
    const score = selectedWords.filter(word =>
      normalizedTopic.includes(word)
    ).length;

    return { topic, score };
  });

  scoredTopics.sort((a, b) => b.score - a.score);

  return scoredTopics[0]?.topic || speaker.topics[0];
}

function switchToAffordableSpeaker(name) {
  selectedSpeaker = speakers.find(speaker => speaker.name === name);
  selectedTopic = findBestRelatedTopic(selectedSpeaker);

  addUser(`Book ${name} instead`);

  booking.budget = `$${pendingBudget.toLocaleString()}`;

  addBot(`
    <strong>${escapeHtml(name)} has been selected instead.</strong><br><br>

    This speaker fits your budget of
    <strong>$${pendingBudget.toLocaleString()}</strong>.
  `);

  mode = "booking";
  bookingStep++;

  setTimeout(askBookingQuestion, 300);
}

function handleBudgetMismatchInput(value) {
  const amount = Number(value.replace(/[$,]/g, ""));

  if (!amount || amount < 0) {
    addBot("Please select an option or enter a valid new budget.");
    return;
  }

  const minimumFee = getMinimumFee(selectedSpeaker, booking.eventFormat);

  if (minimumFee !== null && amount < minimumFee) {
    pendingBudget = amount;
    showBudgetMismatch(amount, minimumFee);
    return;
  }

  pendingBudget = amount;
  booking.budget = `$${amount.toLocaleString()}`;
  mode = "booking";
  bookingStep++;

  addBot(`
    Your new budget of
    <strong>$${amount.toLocaleString()}</strong>
    meets the speaker's minimum fee.
  `);

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
    </div>
  `;

  addBot(summary, "summary");
}

function handleTypedTopic(value) {
  const query = normalize(value);

  const matches = topics.filter(topic => {
    const normalizedTopic = normalize(topic);

    return normalizedTopic.includes(query) ||
      query.includes(normalizedTopic) ||
      query.split(" ").some(word =>
        word.length > 3 && normalizedTopic.includes(word)
      );
  });

  if (!matches.length) {
    addBot(`
      Sorry, I don't find any speaker or topic for
      <strong>${escapeHtml(value)}</strong>.<br><br>

      You can type a speaker's name or select one of the available topics.
    `);

    showTopics();
    return;
  }

  const buttons = matches.map(topic =>
    `<button
      class="option"
      onclick='chooseTopic(${JSON.stringify(topic)})'>
      ${escapeHtml(topic)}
    </button>`
  ).join("");

  addBot(`
    <strong>I found these related topics:</strong>
    <div class="options">${buttons}</div>
  `);
}

function restartBot() {
  selectedSpeaker = null;
  selectedTopic = "";
  booking = {};
  bookingStep = 0;
  pendingBudget = 0;
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

    topics = [
      ...new Set(
        speakers.flatMap(speaker => speaker.topics)
      )
    ].sort();

    addBot(`
      <strong>Welcome to The Boyz AI Speaker Bot!</strong><br><br>
      You can select a topic or type a speaker's name to view all of their TED Talk topics.
    `);

    setTimeout(showTopics, 350);

  } catch (error) {
    addBot(`
      The speaker data could not be loaded.
      Please make sure <strong>speakers.json</strong>
      is in the same folder as <strong>index.html</strong>.
    `);

    console.error(error);
  }
}

document
  .getElementById("sendButton")
  .addEventListener("click", submitInput);

document
  .getElementById("userInput")
  .addEventListener("keydown", event => {
    if (event.key === "Enter") {
      submitInput();
    }
  });

initializeBot();
