const buildProjectContext = require("../utils/buildProjectContext");
const { getMistralClient, DEFAULT_MODEL } = require("../utils/mistral");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");

// Naive in-memory cache: projectId -> { contextHash, summary, generatedAt }
// Cached entry is invalidated automatically if the project's activity-log
// `createdAt` max changes (i.e. someone did something since the last summary).
const cache = new Map();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

// Hash used for cache-keying — same context returns the same summary without
// re-billing Mistral. Rounds the latest-activity timestamp to the minute so
// microsecond differences between back-to-back requests don't bust the cache.
const fingerprint = (ctx) => {
  const lastActivityAt =
    ctx.recentActivity?.[0]?.at instanceof Date
      ? Math.floor(ctx.recentActivity[0].at.getTime() / 60000)
      : 0;
  return JSON.stringify({
    totals: ctx.totals,
    byStatus: ctx.byStatus,
    overdueCount: ctx.overdue.length,
    topContributors: ctx.topContributors,
    lastActivityMinute: lastActivityAt,
  });
};

// @route   POST /api/ai/projects/:id/summary
// @access  Private — owner or member only (requireProjectAccess middleware)
const generateProjectSummary = asyncHandler(async (req, res) => {
  const projectId = req.params.id;

  const context = await buildProjectContext(projectId);
  if (!context) {
    throw new ApiError(404, "Project not found");
  }

  const fp = fingerprint(context);
  const cached = cache.get(projectId);
  if (
    cached &&
    cached.contextHash === fp &&
    Date.now() - new Date(cached.generatedAt).getTime() < CACHE_TTL_MS
  ) {
    return res.status(200).json({
      summary: cached.summary,
      generatedAt: cached.generatedAt,
      cached: true,
      contextSnapshot: {
        windowDays: context.windowDays,
        totals: context.totals,
        byStatus: context.byStatus,
        overdueCount: context.overdue.length,
      },
    });
  }

  const client = getMistralClient(); // throws 503 if no key configured

  const systemPrompt =
    "You are a concise project assistant. Given a JSON snapshot of a team's " +
    "task board, write a short weekly standup summary. Rules: output ONLY 3-5 " +
    "bullets, each bullet one line and at most 20 words, no preamble, no " +
    "markdown headers, no closing remarks. Mention specific people by name " +
    "when the data supports it. If the project is empty or quiet, say so " +
    "honestly rather than inventing activity.";

  const userPrompt =
    "Here is the project snapshot for the last " +
    context.windowDays +
    " days. Produce the bullet summary now.\n\n" +
    JSON.stringify(context, null, 2);

  let summary;
  try {
    const response = await client.chat.complete({
      model: DEFAULT_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      // Cap output so a runaway response can't blow the budget.
      maxTokens: 250,
      temperature: 0.4,
    });

    summary =
      response?.choices?.[0]?.message?.content?.trim() ||
      "No summary was generated.";
  } catch (err) {
    // Surface as a 503 (service unavailable) so the frontend can show a
    // friendly retry message instead of a generic 500.
    console.error("Mistral error:", err?.message || err);
    throw new ApiError(
      503,
      "AI service is temporarily unavailable. Please try again in a moment."
    );
  }

  const generatedAt = new Date().toISOString();
  cache.set(projectId, {
    contextHash: fp,
    summary,
    generatedAt,
  });

  res.status(200).json({
    summary,
    generatedAt,
    cached: false,
    contextSnapshot: {
      windowDays: context.windowDays,
      totals: context.totals,
      byStatus: context.byStatus,
      overdueCount: context.overdue.length,
    },
  });
});

module.exports = { generateProjectSummary };
