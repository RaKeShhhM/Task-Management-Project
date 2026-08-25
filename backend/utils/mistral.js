const { Mistral } = require("@mistralai/mistralai");
const ApiError = require("./ApiError");

// Lazy-init the client so the server still boots (and routes still load) when
// MISTRAL_API_KEY is missing — the AI route itself will return a clean 503
// instead of crashing the whole process at startup.
let client = null;

const getMistralClient = () => {
  if (client) return client;

  if (!process.env.MISTRAL_API_KEY) {
    throw new ApiError(
      503,
      "AI features are not configured on this server. Set MISTRAL_API_KEY in backend/.env."
    );
  }

  client = new Mistral({ apiKey: process.env.MISTRAL_API_KEY });
  return client;
};

// Centralized so we can flip the default model without hunting through controllers.
// mistral-small is on the free experimentation tier; mistral-small-latest always
// points at the newest version of that family.
const DEFAULT_MODEL = process.env.MISTRAL_MODEL || "mistral-small-latest";

module.exports = { getMistralClient, DEFAULT_MODEL };
