import { db } from '../lib/firebase';
import { doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { MonitoredRepo, BugFixRun, AgentStepTrace, AgentThoughtStep, LegalRiskAudit } from '../types';
import type { AutoResearchResult } from '../lib/autoResearch';
import { readSessionCredential } from '../lib/cloudflareWorkspace';
import type { RepositoryDebugSnapshot } from '../lib/repoContext';

export class DaemonService {
  // Add a new repository to monitor
  static async addRepo(repo: Omit<MonitoredRepo, 'id' | 'lastCheckedAt' | 'totalFixes'>) {
    const id = `repo-${Date.now()}`;
    const newRepo: MonitoredRepo = {
      ...repo,
      id,
      lastCheckedAt: Date.now(),
      totalFixes: 0,
    };
    try {
      await setDoc(doc(db, 'monitored_repos', id), newRepo);
    } catch (e) {
      console.warn('Firestore repository write failed; the Pages workspace persistence will be attempted.', e);
    }
    return newRepo;
  }

  // Delete repository
  static async deleteRepo(repoId: string) {
    try {
      await deleteDoc(doc(db, 'monitored_repos', repoId));
      return true;
    } catch (e) {
      console.warn('Failed to delete repo:', e);
      return false;
    }
  }

  // Trigger Bug Fix Cycle via AI and MCP
  static async triggerBugFix(
    repo: MonitoredRepo,
    sourceCode: string,
    customCommit: string,
    researchResult: AutoResearchResult,
    repositorySnapshot: RepositoryDebugSnapshot
  ): Promise<BugFixRun> {
    const liveFile = repositorySnapshot.files[0];
    if (!liveFile?.path || !sourceCode.trim()) throw new Error('GitHub returned no changed source for analysis.');
    const activeScenario = {
      file: liveFile.path,
      originalCode: liveFile.content || liveFile.patch || sourceCode,
      commitMsg: repositorySnapshot.commitMessage || customCommit,
      title: `Repository analysis for ${liveFile.path}`,
      category: 'logic_flaw' as const,
      severity: 'medium' as const,
      bugExplanation: `Analyze the changed source from commit ${repositorySnapshot.commitSha.slice(0, 8)} for concrete defects and safe improvements.`,
    };
    const commitMsg = customCommit || activeScenario.commitMsg || 'GitHub commit';
    const originalCode = activeScenario.originalCode;
    const commitSha = repositorySnapshot.commitSha;
    const fixId = `fix-${crypto.randomUUID()}`;
    const branchName = `dbugger/fix-${crypto.randomUUID().slice(0, 8)}`;

    // Evidence-based agent trace. Each stage begins pending and is updated only after the corresponding operation returns.
    const agentSteps: AgentStepTrace[] = [
      {
        id: `step-1-${fixId}`,
        phase: 'ast_ingestion',
        label: 'Repository Evidence Intake',
        status: 'completed',
        timestamp: Date.now() - 1400,
        detail: repositorySnapshot ? `Loaded ${repositorySnapshot.files?.length || 0} changed file(s) from commit ${repositorySnapshot.commitSha}. No AST result is claimed until an actual parser or model response provides it.` : 'No live repository snapshot was available for this run.',
        durationMs: 0
      },
      {
        id: `step-2-${fixId}`,
        phase: 'cve_analysis',
        label: 'AI Diagnosis & Fault Localization',
        status: 'pending',
        timestamp: Date.now() - 1000,
        detail: `Waiting for ${repo.openRouterModel} to analyze the supplied source and Gridscape context.`,
        durationMs: 0
      },
      {
        id: `step-3-${fixId}`,
        phase: 'patch_synthesis',
        label: 'Patch Proposal',
        status: 'pending',
        timestamp: Date.now() - 600,
        detail: 'No patch is considered generated until the repair endpoint returns corrected code.',
        durationMs: 0
      },
      {
        id: `step-4-${fixId}`,
        phase: 'security_pipeline',
        label: 'Validation Evidence',
        status: 'pending',
        timestamp: Date.now() - 300,
        detail: 'Repository tests and CI results are not executed by the browser client; no passing tests are claimed here.',
        durationMs: 0
      },
      {
        id: `step-5-${fixId}`,
        phase: 'mcp_delivery',
        label: 'Verified GitHub Delivery',
        status: 'pending',
        timestamp: Date.now() - 50,
        detail: 'No branch, commit, or pull request is claimed until GitHub returns verified mutation results.',
        durationMs: 0
      }
    ];

    // Call the real user-key OpenRouter endpoint. A failed or malformed response aborts this run;
    // no alternate diagnosis or synthetic run is created.
    let aiResponse: any;
    try {
      const response = await fetch('/api/ai/fix-bug', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repoName: repo.name,
          commitMessage: commitMsg,
          originalCode,
          bugScenario: activeScenario,
          model: repo.openRouterModel,
          userApiKey: readSessionCredential('dbugger_openrouter_key', 'repoheal_openrouter_key'),
          securityThreshold: repo.securityThreshold || 85,
          researchContext: researchResult.text || '',
          researchSources: researchResult.sources || [],
          repositorySnapshot,
        })
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || payload.success !== true || !payload.data) {
        throw new Error(payload.error || `OpenRouter analysis failed (${response.status})`);
      }
      aiResponse = payload;
    } catch (error: any) {
      throw new Error(`OpenRouter analysis failed: ${error?.message || 'no model response returned'}`);
    }

    const modelResponseReceived = true;
    // Transparent activity summary for the AI Thoughts modal; this is a summary, not hidden chain-of-thought.
    const thoughtStream: AgentThoughtStep[] = [
      {
        id: `thought-1-${fixId}`,
        phase: 'ast_ingestion',
        timestamp: Date.now() - 1800,
        title: 'Repository Evidence Intake',
        thought: repositorySnapshot ? `Loaded changed source from commit ${repositorySnapshot.commitSha} for ${repositorySnapshot.files?.length || 0} file(s).` : 'No live repository snapshot was available; source evidence is limited to the supplied run context.',
        confidence: 0,
        codeInspection: originalCode.slice(0, 700),
        verdict: repositorySnapshot ? 'passed' : 'warning'
      },
      {
        id: `thought-2-${fixId}`,
        phase: 'root_cause_deduction',
        timestamp: Date.now() - 1300,
        title: 'AI Diagnosis Status',
        thought: 'Waiting for the repair endpoint to return a model response. No diagnosis is inferred from the UI state alone.',
        confidence: 0,
        codeInspection: originalCode.slice(0, 700),
        verdict: 'warning'
      },
      {
        id: `thought-3-${fixId}`,
        phase: 'patch_synthesis',
        timestamp: Date.now() - 900,
        title: 'Patch Proposal Status',
        thought: 'No corrected code is claimed until the repair endpoint returns it.',
        confidence: 0,
        codeInspection: '',
        verdict: 'warning'
      },
      {
        id: `thought-4-${fixId}`,
        phase: 'legal_risk_audit',
        timestamp: Date.now() - 500,
        title: 'Validation Evidence',
        thought: 'No local test runner or CI result was executed by this browser run. Inspect repository CI before merging.',
        confidence: 0,
        verdict: 'warning'
      },
      {
        id: `thought-5-${fixId}`,
        phase: 'mcp_delivery',
        timestamp: Date.now() - 200,
        title: 'GitHub Delivery Status',
        thought: 'No branch, commit, or pull request is claimed until GitHub returns a verified mutation result.',
        confidence: 0,
        verdict: 'warning'
      }
    ];

    const legalRiskCheck: LegalRiskAudit = {
      status: 'warning',
      score: 0,
      licenseContamination: {
        status: 'warning',
        detectedLicenses: [],
        viralRisk: false,
        detail: 'No independent license scan was executed in the browser run.'
      },
      secretLeakGuard: {
        status: 'failed',
        secretsFound: [],
        detail: 'No independent secret scan was executed in the browser run.'
      },
      copyrightIntegrity: {
        status: 'warning',
        uncreditedCopyDetected: false,
        detail: 'No independent copyright-integrity scan was executed in the browser run.'
      },
      complianceFrameworks: [],
      legalSignoffSummary: 'Not independently verified; human or CI review is required before merge.'
    };

    const aiData = aiResponse.data;
    if (!aiData || typeof aiData !== 'object') throw new Error('OpenRouter returned no structured analysis.');
    if (!aiData.pipeline || typeof aiData.pipeline !== 'object') {
      aiData.pipeline = { passed: false, overallScore: 0, legalRiskCheck };
    } else if (!aiData.pipeline.legalRiskCheck) {
      aiData.pipeline.legalRiskCheck = legalRiskCheck;
    }
    const modelReasoningSummary = typeof aiData.aiReasoning === 'string' && aiData.aiReasoning.trim()
      ? aiData.aiReasoning.trim().slice(0, 2400)
      : 'The model returned no concise reasoning summary; review the returned code and evidence carefully.';
    agentSteps[1].status = modelResponseReceived ? 'completed' : 'failed';
    agentSteps[1].detail = `${modelReasoningSummary} Evidence file: ${activeScenario.file}.`;
    agentSteps[2].status = aiData.fixedCodeSnippet ? 'completed' : 'failed';
    agentSteps[2].detail = `${aiData.fixedCodeSnippet ? 'A corrected code result was returned.' : 'No corrected code was returned.'} The repair decision is based on the supplied repository snapshot and Gridscape research.`;
    agentSteps[3].status = 'pending';
    agentSteps[3].detail = 'No independent CI or repository test runner has returned validation evidence; GitHub delivery remains disabled.';
    thoughtStream[1].thought = modelReasoningSummary;
    thoughtStream[1].codeInspection = originalCode.slice(0, 700);
    thoughtStream[1].confidence = 0;
    thoughtStream[1].verdict = modelResponseReceived ? 'passed' : 'warning';
    thoughtStream[2].thought = aiData.fixedCodeSnippet ? `Returned corrected code for ${activeScenario.file}. The result is shown for review before any GitHub mutation.` : `No corrected code was returned for ${activeScenario.file}; no GitHub mutation will be attempted.`;
    thoughtStream[2].codeInspection = (aiData.fixedCodeSnippet || '').slice(0, 700);

    // Execute MCP Tools
    const mcpLogs = [];
    mcpLogs.push({
      tool: 'gridscape_research',
      timestamp: Date.now(),
      input: { repository: repo.name, mode: researchResult.mode },
      output: { summary: (researchResult?.text || 'No research context available.').slice(0, 900), sources: researchResult?.sources || [] },
    });
    mcpLogs.push({
      tool: 'ai_analysis',
      timestamp: Date.now(),
      input: { model: repo.openRouterModel, file: activeScenario.file, source: 'live-github-snapshot' },
      output: { responseReceived: modelResponseReceived, mode: aiResponse?.mode || 'unknown', reasoningSummary: modelReasoningSummary.slice(0, 900), correctedCodeReturned: Boolean(aiData.fixedCodeSnippet) },
    });

    let pushedSha: string | undefined;
    let deliveredBranch: string | undefined;
    let prNumber: number | undefined;
    let prUrl: string | undefined;
    let deliveryError: string | undefined;
    const githubToken = readSessionCredential('dbugger_github_token', 'repoheal_github_token');
    const independentValidationEvidence = Array.isArray((aiData as any).validationEvidence) && (aiData as any).validationEvidence.some((item: any) => item?.verified === true);
    const canDeliverRealFix = Boolean(repositorySnapshot && githubToken && independentValidationEvidence && aiData.fixedCodeSnippet);
    if (canDeliverRealFix) {
      try {
        const deliveryResponse = await fetch('/api/github/deliver-fix', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            owner: repo.owner,
            repo: repo.repo,
            baseBranch: repo.branch,
            filePath: activeScenario.file,
            fixedCode: aiData.fixedCodeSnippet,
            title: aiData.pullRequestTitle || `fix(auto): patch ${aiData.bugTitle}`,
            body: aiData.pullRequestBody || 'Generated by D-Bugger after repository-grounded analysis.',
            token: githubToken,
          }),
        });
        const delivery = await deliveryResponse.json().catch(() => ({}));
        if (!deliveryResponse.ok || delivery.delivered !== true) throw new Error(delivery.error || `GitHub delivery failed (${deliveryResponse.status})`);
        deliveredBranch = delivery.branch;
        pushedSha = delivery.commitSha;
        prNumber = delivery.pullRequestNumber;
        prUrl = delivery.pullRequestUrl;
        mcpLogs.push({ tool: 'create_branch', timestamp: Date.now(), input: { owner: repo.owner, repo: repo.repo, branch: deliveredBranch }, output: { created: true, verified: true } });
        mcpLogs.push({ tool: 'commit_file', timestamp: Date.now() + 100, input: { filePath: activeScenario.file, message: aiData.pullRequestTitle || `fix(auto): patch ${aiData.bugTitle}` }, output: { commitSha: pushedSha, verified: true } });
        mcpLogs.push({ tool: 'create_pull_request', timestamp: Date.now() + 200, input: { owner: repo.owner, repo: repo.repo, head: deliveredBranch, base: repo.branch }, output: { number: prNumber, html_url: prUrl, state: 'open', verified: true } });
        agentSteps[4].detail = `Created and verified real branch ${deliveredBranch}, committed the corrected ${activeScenario.file}, and opened Pull Request #${prNumber}.`;
      } catch (error: any) {
        deliveryError = error?.message || 'GitHub delivery failed.';
        mcpLogs.push({ tool: 'github_delivery', timestamp: Date.now(), input: { owner: repo.owner, repo: repo.repo, filePath: activeScenario.file }, output: { delivered: false, error: deliveryError } });
        agentSteps[4].status = 'failed';
        agentSteps[4].detail = `No GitHub mutation was completed: ${deliveryError}`;
      }
    } else {
      const reason = !githubToken ? 'GitHub token not configured' : !repositorySnapshot ? 'live repository snapshot unavailable' : !independentValidationEvidence ? 'independent CI or runner evidence is required before delivery' : !aiData.fixedCodeSnippet ? 'no corrected code was produced' : 'delivery conditions were not met';
      deliveryError = `No real GitHub delivery attempted: ${reason}.`;
      mcpLogs.push({ tool: 'github_delivery', timestamp: Date.now(), input: { owner: repo.owner, repo: repo.repo, filePath: activeScenario.file }, output: { delivered: false, reason } });
      agentSteps[4].status = 'failed';
      agentSteps[4].detail = deliveryError;
    }

    // Manual Revert Commands for developer terminal; populated only after a real commit.
    const manualCommands = pushedSha ? [
      `git fetch origin`,
      `git checkout -b revert-dbugger-${pushedSha}`,
      `git revert ${pushedSha} -m 1 --no-edit`,
      `git push origin revert-dbugger-${pushedSha}`,
      `Close Pull Request #${prNumber} after the revert is reviewed.`
    ] : [];

    const newFixRun: BugFixRun = {
      id: fixId,
      repoId: repo.id,
      repoName: repo.name,
      commitSha,
      commitMessage: commitMsg,
      commitAuthor: 'GitHub repository commit',
      timestamp: Date.now(),
      status: pushedSha ? 'pushed' : 'awaiting_human_review',
      bugCategory: aiData.bugCategory,
      bugSeverity: aiData.bugSeverity,
      bugTitle: aiData.bugTitle,
      bugDescription: aiData.aiReasoning || activeScenario.bugExplanation,
      affectedFiles: aiData.affectedFiles || [activeScenario.file],
      modelUsed: repo.openRouterModel,
      modelContextTokens: Math.ceil((originalCode.length + researchResult.text.length) / 4),
      aiReasoning: aiData.aiReasoning,
      patchDiff: aiData.patchDiff,
      fixedCodeSnippet: aiData.fixedCodeSnippet,
      originalCodeSnippet: originalCode,
      agentSteps,
      aiThoughtStream: thoughtStream,
      selfCorrectionAttempts: 0,
      pipeline: aiData.pipeline,
      branchName: deliveredBranch || '',
      pullRequestUrl: prUrl,
      pullRequestNumber: prNumber,
      pushedCommitSha: pushedSha,
      mcpToolLogs: mcpLogs,
      emailSent: repo.emailAlerts,
      emailSentAt: repo.emailAlerts ? Date.now() : undefined,
      emailRecipient: repo.alertEmail || undefined,
      slackSent: !!repo.slackWebhookUrl,
      slackSentAt: repo.slackWebhookUrl ? Date.now() : undefined,
      canUndo: Boolean(pushedSha && prNumber && prUrl && deliveredBranch),
      isUndone: false,
      manualRevertCommands: manualCommands
    };

    // Save to Firestore
    try {
      await setDoc(doc(db, 'bug_fix_runs', fixId), newFixRun);
      
      // Update repo counter
      await updateDoc(doc(db, 'monitored_repos', repo.id), {
        lastCheckedAt: Date.now(),
        lastCommitSha: commitSha,
        lastCommitMessage: commitMsg,
        totalFixes: (repo.totalFixes || 0) + 1,
        status: 'monitoring'
      });
    } catch (e) {
      console.warn('Error persisting fix to Firestore:', e);
    }

    // Auto-dispatch Email if enabled
    if (repo.emailAlerts && repo.alertEmail) {
      this.sendEmailNotification(newFixRun, repo.alertEmail);
    }

    // Auto-dispatch Slack if configured
    const slackUrl = repo.slackWebhookUrl || localStorage.getItem('dbugger_slack_webhook');
    if (slackUrl) {
      this.sendSlackAlert(newFixRun, slackUrl);
    }

    // Trigger Browser Notification if permitted. This never claims a fix or PR without GitHub evidence.
    this.triggerBrowserNotification(
      `D-Bugger: Analysis recorded for ${repo.name}`,
      pushedSha && prNumber ? `Verified GitHub delivery created Pull Request #${prNumber}.` : `Model analysis recorded; no verified GitHub delivery was created.`
    );

    return newFixRun;
  }

  // Trigger Browser native notification
  static triggerBrowserNotification(title: string, body: string) {
    try {
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        new Notification(title, {
          body,
          icon: '/favicon.ico'
        });
      }
    } catch (e) {
      console.warn('Browser notification error:', e);
    }
  }

  // Send Slack Alert
  static async sendSlackAlert(fix: BugFixRun, webhookUrl: string, isRollback: boolean = false) {
    try {
      await fetch('/api/slack/send-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          webhookUrl,
          repoName: fix.repoName,
          bugTitle: fix.bugTitle,
          bugCategory: fix.bugCategory,
          severity: fix.bugSeverity,
          prUrl: fix.pullRequestUrl,
          score: fix.pipeline?.overallScore ?? 0,
          actionType: isRollback ? 'rollback' : 'fix_applied'
        })
      });
    } catch (e) {
      console.warn('Slack alert dispatch exception:', e);
    }
  }

  // Send Email Notification
  static async sendEmailNotification(fix: BugFixRun, recipient: string) {
    try {
      const subject = `[D-Bugger] Repository analysis for ${fix.repoName}: ${fix.bugTitle}`;
      const summary = `Model analysis recorded for ${fix.repoName}. Recorded pipeline evidence: ${fix.pipeline?.overallScore ?? 0}/100; GitHub delivery is shown only when a verified PR exists.`;
      
      await fetch('/api/email/send-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient,
          subject,
          summary,
          fixes: [fix.id],
          htmlContent: `<h2>D-Bugger Repository Analysis</h2><p>Repository: <b>${fix.repoName}</b></p><p>Finding: <b>${fix.bugTitle}</b> (${fix.bugSeverity})</p><p>Recorded pipeline evidence: <b>${fix.pipeline?.overallScore ?? 0}%</b></p>${fix.pullRequestUrl ? `<p>Verified PR: <a href="${fix.pullRequestUrl}">${fix.pullRequestUrl}</a></p>` : '<p>No verified GitHub PR was created.</p>'}`
        })
      });
    } catch (e) {
      console.warn('Failed to send email notification:', e);
    }
  }

  // Undo a verified automated GitHub fix by closing its PR and deleting the D-Bugger branch.
  static async undoFix(fix: BugFixRun, reason: string = 'User requested 1-click rollback') {
    try {
      const token = readSessionCredential('dbugger_github_token', 'repoheal_github_token');
      if (!token || !fix.pushedCommitSha || !fix.pullRequestUrl || !fix.pullRequestNumber || !fix.branchName) return false;
      const [owner, repo] = fix.repoName.split('/');
      const response = await fetch('/api/github/undo-fix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ owner, repo: repo || fix.repoName, branch: fix.branchName, pullRequestNumber: fix.pullRequestNumber, token, reason }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.undone !== true) throw new Error(data.error || `GitHub undo failed (${response.status})`);
      const updatedRun: Partial<BugFixRun> = {
        status: 'undone',
        isUndone: true,
        canUndo: false,
        undoneAt: Date.now(),
        undoReason: reason,
      };
      await updateDoc(doc(db, 'bug_fix_runs', fix.id), updatedRun);
      await setDoc(doc(db, 'undo_snapshots', `undo-${fix.id}`), {
        id: `undo-${fix.id}`,
        fixId: fix.id,
        repoName: fix.repoName,
        originalCommitSha: fix.commitSha,
        fixCommitSha: fix.pushedCommitSha,
        prNumber: fix.pullRequestNumber,
        branchName: fix.branchName,
        revertDiff: fix.patchDiff,
        manualCommands: fix.manualRevertCommands || [],
        status: 'reverted',
        createdAt: Date.now(),
        revertedAt: Date.now(),
        reason,
      });
      const slackUrl = localStorage.getItem('dbugger_slack_webhook');
      if (slackUrl) void this.sendSlackAlert(fix, slackUrl, true);
      this.triggerBrowserNotification('D-Bugger: Fix Undone', `Closed Pull Request #${fix.pullRequestNumber} and deleted branch ${fix.branchName} on ${fix.repoName}.`);
      return true;
    } catch (e) {
      console.warn('Real GitHub undo failed:', e);
      return false;
    }
  }
}
