import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// ─── Retry helper with exponential backoff ────────────────────────────────────
async function withRetry(fn, maxRetries = 3, baseDelayMs = 1000) {
  let lastError;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      const isRetryable =
        err?.status === 503 ||
        err?.status === 429 ||
        err?.message?.includes("fetch failed") ||
        err?.message?.includes("network") ||
        err?.message?.includes("ECONNRESET") ||
        err?.message?.includes("ETIMEDOUT") ||
        err?.message?.includes("socket hang up");
      if (!isRetryable || attempt === maxRetries) break;
      const delay = baseDelayMs * Math.pow(2, attempt - 1);
      console.warn(
        `[AI] Attempt ${attempt} failed (${err?.status || err?.message}). Retrying in ${delay}ms...`
      );
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastError;
}

// ─── Lazy singleton for GoogleGenerativeAI ───────────────────────────────────
let _genAI = null;
function getGenAI() {
  if (!GEMINI_API_KEY) return null;
  if (!_genAI) _genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  return _genAI;
}

// ─── Clean markdown wrapper from Gemini responses ────────────────────────────
function cleanJsonText(raw) {
  let text = raw.trim();
  if (text.startsWith("```")) {
    text = text
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();
  }
  return text;
}

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const { action, type, topic, difficulty, questionText, codeLanguage } = body;

    const genAI = getGenAI();

    // ── No API key — return rich mock data immediately ────────────────────
    if (!genAI) {
      return NextResponse.json({
        success: true,
        mock: true,
        data: getMockAIResponse(action, type, topic, difficulty, questionText, codeLanguage),
      });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // ─────────────────────────────────────────────────────────────────────────
    if (action === "generate-question") {
      let prompt = `You are an expert examiner. Generate a highly professional and relevant assessment question for the topic "${topic}" with difficulty "${difficulty}". Question type is: "${type}".`;

      if (type === "mcq") {
        prompt += `
Return a JSON object with exactly this shape (ONLY JSON, no markdown):
{
  "text": "The question text",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correctAnswer": 0,
  "explanation": "Why this is correct",
  "points": 2,
  "difficulty": "${difficulty}"
}`;
      } else if (type === "coding") {
        prompt += `
Language: "${codeLanguage || "javascript"}".
Return a JSON object (ONLY JSON, no markdown):
{
  "text": "The coding problem statement",
  "points": 10,
  "difficulty": "${difficulty}",
  "starterCode": "function mySolution() {\\n  // your code\\n}",
  "testCases": [
    { "input": "testInput1", "output": "expectedOutput1", "hidden": false },
    { "input": "testInput2", "output": "expectedOutput2", "hidden": true }
  ],
  "rubric": "Code correctness: 60%, Complexity: 20%, Code style: 20%",
  "solution": "The correct solution code"
}`;
      } else if (type === "text") {
        prompt += `
Return a JSON object (ONLY JSON, no markdown):
{
  "text": "The conceptual/essay question",
  "points": 5,
  "difficulty": "${difficulty}",
  "suggestedKeywords": ["keyword1", "keyword2", "keyword3"],
  "rubric": "Excellent: covers all key concepts. Passing: mentions basics. Failing: irrelevant."
}`;
      } else {
        prompt += `
Return a JSON object (ONLY JSON, no markdown):
{
  "text": "The question prompt",
  "points": 5,
  "difficulty": "${difficulty}",
  "rubric": "A comprehensive grading rubric"
}`;
      }

      try {
        const result = await withRetry(() => model.generateContent(prompt));
        const parsed = JSON.parse(cleanJsonText(result.response.text()));
        return NextResponse.json({ success: true, data: parsed });
      } catch (err) {
        console.error("[AI generate-question] Error:", err?.message);
        return NextResponse.json({
          success: true,
          mock: true,
          data: getMockAIResponse(action, type, topic, difficulty, questionText, codeLanguage),
        });
      }

    // ─────────────────────────────────────────────────────────────────────────
    } else if (action === "analyze-difficulty") {
      const prompt = `You are a curriculum expert. Analyze the difficulty of this exam question:
"${questionText}"
Return ONLY a JSON object:
{
  "difficulty": "Easy" | "Medium" | "Hard",
  "reasoning": "Concise explanation of the cognitive demand.",
  "recommendedPoints": 3,
  "cognitiveLevel": "Remember" | "Understand" | "Apply" | "Analyze" | "Evaluate" | "Create"
}`;

      try {
        const result = await withRetry(() => model.generateContent(prompt));
        const parsed = JSON.parse(cleanJsonText(result.response.text()));
        return NextResponse.json({ success: true, data: parsed });
      } catch (err) {
        console.error("[AI analyze-difficulty] Error:", err?.message);
        return NextResponse.json({
          success: true,
          mock: true,
          data: getMockAIResponse(action, type, topic, difficulty, questionText, codeLanguage),
        });
      }

    // ─────────────────────────────────────────────────────────────────────────
    } else if (action === "generate-rubric") {
      const prompt = `You are an academic lead. Create a grading rubric and answer key for:
"${questionText}"
Return ONLY a JSON object:
{
  "rubric": "Detailed grading breakdown",
  "idealAnswer": "Complete correct answer / solution key",
  "pointsAllocation": [
    { "criteria": "Concept Mastery", "points": 2 },
    { "criteria": "Accuracy", "points": 2 },
    { "criteria": "Structure", "points": 1 }
  ]
}`;

      try {
        const result = await withRetry(() => model.generateContent(prompt));
        const parsed = JSON.parse(cleanJsonText(result.response.text()));
        return NextResponse.json({ success: true, data: parsed });
      } catch (err) {
        console.error("[AI generate-rubric] Error:", err?.message);
        return NextResponse.json({
          success: true,
          mock: true,
          data: getMockAIResponse(action, type, topic, difficulty, questionText, codeLanguage),
        });
      }
    }

    return NextResponse.json({ error: "Unsupported AI action" }, { status: 400 });

  } catch (error) {
    console.error("[AI Route] Unhandled error:", error?.message);
    // Always return mock data instead of crashing — never show a 500 to the UI
    return NextResponse.json({
      success: true,
      mock: true,
      data: getMockAIResponse("generate-question", "mcq", "General", "Medium", "", ""),
    });
  }
}

// ─── Mock responses for offline / missing key fallback ───────────────────────
function getMockAIResponse(action, type, topic, difficulty, questionText, codeLanguage) {
  if (action === "generate-question") {
    if (type === "mcq") {
      return {
        text: `Which of the following best describes the core principle of ${topic || "Computer Science"}?`,
        options: [
          `${topic || "Computer Science"} relies on logical abstraction and algorithmic thinking`,
          "It only applies to hardware design",
          "It does not require any mathematical foundation",
          "It exclusively processes analog signals",
        ],
        correctAnswer: 0,
        explanation: "The foundation of this field is built on structured logic, abstraction, and systematic problem-solving.",
        points: 2,
        difficulty: difficulty || "Medium",
      };
    } else if (type === "coding") {
      const isJS = !codeLanguage || codeLanguage === "javascript";
      return {
        text: `Implement an efficient function to find all unique permutations of a given array under the context of ${topic || "Algorithms"}.`,
        points: 10,
        difficulty: difficulty || "Hard",
        starterCode: isJS
          ? `function uniquePermutations(nums) {\n  // Write your solution here\n  return [];\n}`
          : `def unique_permutations(nums):\n    # Write your solution here\n    return []`,
        testCases: [
          { input: "[1, 1, 2]", output: "[[1,1,2],[1,2,1],[2,1,1]]", hidden: false },
          { input: "[1, 2, 3]", output: "[[1,2,3],[1,3,2],[2,1,3],[2,3,1],[3,1,2],[3,2,1]]", hidden: true },
        ],
        rubric: "Correctness: 60%, Time complexity O(n!): 20%, Space efficiency: 10%, Edge cases: 10%",
        solution: "Use backtracking with a visited array and sort first to skip duplicates.",
      };
    } else {
      return {
        text: `Critically evaluate the societal implications of ${topic || "Artificial Intelligence"} in modern education systems.`,
        points: 5,
        difficulty: difficulty || "Medium",
        suggestedKeywords: ["bias", "equity", "automation", "pedagogy", "privacy"],
        rubric: "Excellent: covers equity, bias, and policy impacts. Passing: identifies basic AI risks. Failing: shallow or off-topic.",
      };
    }
  } else if (action === "analyze-difficulty") {
    return {
      difficulty: difficulty || "Medium",
      reasoning:
        "The question demands synthesis of multiple concepts and application to novel scenarios, placing it at the Apply/Analyze cognitive level.",
      recommendedPoints: difficulty === "Hard" ? 10 : difficulty === "Easy" ? 2 : 5,
      cognitiveLevel:
        difficulty === "Hard" ? "Evaluate" : difficulty === "Easy" ? "Remember" : "Apply",
    };
  } else if (action === "generate-rubric") {
    return {
      rubric:
        "1. Core concept accuracy (50%)\n2. Depth of explanation with examples (30%)\n3. Clear structure and language (20%)",
      idealAnswer:
        "A comprehensive response covering the main principle, practical applications, trade-offs, and real-world implications.",
      pointsAllocation: [
        { criteria: "Conceptual Accuracy", points: 5 },
        { criteria: "Depth & Examples", points: 3 },
        { criteria: "Clarity & Structure", points: 2 },
      ],
    };
  }
  return { text: "Sample question", points: 2, difficulty: "Medium" };
}
