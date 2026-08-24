interface FixBugBody {
  repoName?: unknown;
  commitMessage?: unknown;
  originalCode?: unknown;
  model?: unknown;
  userApiKey?: unknown;
  researchContext?: unknown;
  researchSources?: unknown;
  repositorySnapshot?: {
    commitSha?: unknown;
    commitMessage?: unknown;
    files?: Array<{ path?: unknown; patch?: unknown; content?: unknown; language?: unknown }>;
  };
}

function text(value: unknown, max = 12000) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

export const onRequestPost: PagesFunction = async ({ request }) => {
  try {
    const body = await request.json() as FixBugBody;
    const repoName = text(body.repoName, 240);
    const commitMessage = text(body.commitMessage, 1000);
    const model = text(body.model, 160);
    const userApiKey = text(body.userApiKey, 300);
    const originalCode = text(body.originalCode, 16000);
    const researchContext = text(body.researchContext, 14000);
    const researchSources = Array.isArray(body.researchSources) ? body.researchSources.slice(0, 10) : [];
    const snapshotFiles = Array.isArray(body.repositorySnapshot?.files) ? body.repositorySnapshot.files.slice(0, 8) : [];
    const repositoryFiles = snapshotFiles
      .map((file) => `### ${text(file.path, 240)} (${text(file.language, 40)})\nPatch:\n${text(file.patch, 7000)}\nSource:\n${text(file.content, 14000)}`)
      .join('\n\n');

    if (!userApiKey) return Response.json({ success: false, error: 'An OpenRouter API key is required for real AI analysis.' }, { status: 401 });
    if (!model) return Response.json({ success: false, error: 'Select an OpenRouter model before running analysis.' }, { status: 400 });
    if (!repoName || !commitMessage) return Response.json({ success: false, error: 'A repository name and real commit message are required.' }, { status: 400 });
    if (!snapshotFiles.length || !repositoryFiles.trim()) return Response.json({ success: false, error: 'A real GitHub source snapshot is required. No AI analysis was run.' }, { status: 400 });

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${userApiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://dbugger.pages.dev',
        'X-Title': 'D-Bugger Repository Analysis',
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content: 'You are D-Bugger, a senior software engineer reviewing a real GitHub commit. Diagnose concrete defects in the supplied changed source first. If the code is functioning, identify only high-confidence, low-risk improvements. Preserve public APIs and existing architecture. Use the supplied Gridscape research as context, never as a reason to invent files or behavior. Return only valid JSON with bugTitle, bugCategory, bugSeverity, affectedFiles, aiReasoning, fixedCodeSnippet, patchDiff, pipeline, pullRequestTitle, and pullRequestBody. Do not claim tests, CI, security scans, legal review, commits, or pull requests unless the supplied evidence explicitly contains those results. The pipeline must describe model analysis only; external validation remains unverified.',
          },
          {
            role: 'user',
            content: `Repository: ${repoName}\nCommit: ${commitMessage}\nChanged repository files and patches:\n${repositoryFiles}\nGridscape research context:\n${researchContext || 'No external research was available; inspect the supplied changed source carefully.'}\nResearch sources: ${JSON.stringify(researchSources)}\n\nReturn a concise diagnosis, the smallest safe corrected code for the affected file when justified, and a precise unified diff. Do not invent a successful result when evidence is missing.`,
          },
        ],
        response_format: { type: 'json_object' },
      }),
    });

    const payload = await response.json().catch(() => ({})) as any;
    if (!response.ok) {
      return Response.json({ success: false, error: payload.error?.message || `OpenRouter analysis failed (${response.status}).` }, { status: 502 });
    }
    const content = payload.choices?.[0]?.message?.content;
    if (typeof content !== 'string' || !content.trim()) {
      return Response.json({ success: false, error: 'OpenRouter returned no model content.' }, { status: 502 });
    }

    let parsed: any;
    try {
      parsed = JSON.parse(content.replace(/^```json\s*/i, '').replace(/\s*```$/i, ''));
    } catch {
      return Response.json({ success: false, error: 'OpenRouter returned malformed JSON; no patch was created.' }, { status: 502 });
    }
    if (!parsed || typeof parsed !== 'object') {
      return Response.json({ success: false, error: 'OpenRouter returned no structured analysis.' }, { status: 502 });
    }

    return Response.json({ success: true, data: { ...parsed, modelUsed: model }, mode: 'openrouter-user-key-v2' });
  } catch (error) {
    console.error('D-Bugger OpenRouter analysis error:', error);
    return Response.json({ success: false, error: 'AI analysis could not be completed.' }, { status: 500 });
  }
};
