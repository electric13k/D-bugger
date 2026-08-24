interface FollowUpEnv {
  OPENROUTER_API_KEY?: string;
}

interface FollowUpBody {
  model?: unknown;
  userApiKey?: unknown;
  repoName?: unknown;
  filePath?: unknown;
  commitSha?: unknown;
  originalCode?: unknown;
  fixedCode?: unknown;
  aiReasoning?: unknown;
  prompt?: unknown;
}

function text(value: unknown, max: number) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

export const onRequestPost: PagesFunction<FollowUpEnv> = async ({ request, env }) => {
  try {
    const body = await request.json() as FollowUpBody;
    const apiKey = text(body.userApiKey, 300) || env.OPENROUTER_API_KEY || '';
    const prompt = text(body.prompt, 4000);
    if (!apiKey) return Response.json({ error: 'An OpenRouter key is required for AI follow-ups.' }, { status: 401 });
    if (!prompt) return Response.json({ error: 'A follow-up question is required.' }, { status: 400 });
    const model = text(body.model, 160) || 'deepseek/deepseek-r1:free';
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://dbugger.pages.dev',
        'X-Title': 'D-Bugger Agent Follow-up',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: 'You are D-Bugger. Answer the developer follow-up using only the supplied repository evidence and prior analysis. Be concise, concrete, and transparent about uncertainty. Do not claim a test, commit, PR, or tool call happened unless the evidence says it did.' },
          { role: 'user', content: `Repository: ${text(body.repoName, 240)}\nCommit: ${text(body.commitSha, 160)}\nFile: ${text(body.filePath, 500)}\nOriginal code:\n${text(body.originalCode, 12000)}\nProposed code:\n${text(body.fixedCode, 12000)}\nPrior analysis:\n${text(body.aiReasoning, 5000)}\n\nDeveloper follow-up:\n${prompt}` },
        ],
      }),
    });
    const payload = await response.json().catch(() => ({})) as any;
    const answer = payload.choices?.[0]?.message?.content;
    if (!response.ok || typeof answer !== 'string' || !answer.trim()) return Response.json({ error: payload.error?.message || `OpenRouter follow-up failed (${response.status})` }, { status: 502 });
    return Response.json({ answer: answer.trim().slice(0, 12000), modelUsed: model });
  } catch (error: any) {
    console.error('D-Bugger follow-up failed:', error);
    return Response.json({ error: 'AI follow-up could not be completed.' }, { status: 500 });
  }
};
