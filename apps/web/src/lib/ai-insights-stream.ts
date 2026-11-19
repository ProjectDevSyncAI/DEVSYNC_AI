/**
 * Shared SSE Stream Lifecycle Controller for AI Insights
 * Milestone 4B.7 Phase 3.6
 *
 * Encapsulates the complete SSE streaming lifecycle:
 * - Active request ID sequencing to drop stale out-of-order callbacks
 * - Stream abort on project switch, component unmount, or prompt resubmission
 * - Safe fallback to unary POST on stream connection errors
 * - Strict state isolation preventing cross-project contamination
 */

import { aiApi, RagSearchResult } from "./api.js";

export interface StreamStateCallbacks {
  setIsAnswering: (answering: boolean) => void;
  setAiAnswer: (answer: string | null) => void;
  setAiSources: (sources: RagSearchResult[]) => void;
  setUserPrompt: (prompt: string) => void;
  setErrorMessage: (msg: string) => void;
}

export class AIInsightsStreamController {
  private activeStreamCleanup: (() => void) | null = null;
  private activeRequestId = 0;
  private callbacks: StreamStateCallbacks;
  private askStreamFn: typeof aiApi.askStream;
  private askUnaryFn: typeof aiApi.ask;

  constructor(
    callbacks: StreamStateCallbacks,
    askStreamFn: typeof aiApi.askStream = aiApi.askStream,
    askUnaryFn: typeof aiApi.ask = aiApi.ask,
  ) {
    this.callbacks = callbacks;
    this.askStreamFn = askStreamFn;
    this.askUnaryFn = askUnaryFn;
  }

  getActiveRequestId(): number {
    return this.activeRequestId;
  }

  hasActiveStream(): boolean {
    return this.activeStreamCleanup !== null;
  }

  /**
   * Called when active project changes.
   * Aborts active stream, increments request sequence ID, and resets UI state.
   */
  handleProjectChange() {
    this.abortActiveStream();
    this.activeRequestId++;

    this.callbacks.setIsAnswering(false);
    this.callbacks.setAiAnswer(null);
    this.callbacks.setAiSources([]);
    this.callbacks.setUserPrompt("");
    this.callbacks.setErrorMessage("");
  }

  /**
   * Called when component unmounts.
   * Aborts active stream and invalidates any pending asynchronous callbacks.
   */
  handleUnmount() {
    this.abortActiveStream();
    this.activeRequestId++;
  }

  /**
   * Aborts current active stream if any.
   */
  abortActiveStream() {
    if (this.activeStreamCleanup) {
      try {
        this.activeStreamCleanup();
      } catch {
        // Ignore close error
      }
      this.activeStreamCleanup = null;
    }
  }

  /**
   * Ask question via SSE streaming with fallback to unary POST.
   */
  async askQuestion(
    activeProject: { id: string; name?: string } | null,
    query: string,
  ) {
    if (!activeProject?.id) {
      this.callbacks.setErrorMessage("Please select a project before querying Project Intelligence.");
      return;
    }

    const q = query.trim();
    if (!q) return;

    // Abort prior stream if user submits a second question
    this.abortActiveStream();

    const currentRequestId = ++this.activeRequestId;
    const targetProjectId = activeProject.id;

    this.callbacks.setUserPrompt(q);
    this.callbacks.setIsAnswering(true);
    this.callbacks.setAiAnswer("");
    this.callbacks.setAiSources([]);
    this.callbacks.setErrorMessage("");

    let streamedTokens = "";
    const cleanup = this.askStreamFn(
      targetProjectId,
      q,
      (token: string) => {
        if (this.activeRequestId !== currentRequestId) return;
        streamedTokens += token;
        this.callbacks.setAiAnswer(streamedTokens);
      },
      () => {
        if (this.activeRequestId !== currentRequestId) return;
        this.activeStreamCleanup = null;
        this.callbacks.setIsAnswering(false);
      },
      async (streamErr: any) => {
        if (this.activeRequestId !== currentRequestId) return;
        this.activeStreamCleanup = null;
        // Fallback to standard unary POST if SSE connection fails
        try {
          const res = await this.askUnaryFn(targetProjectId, q);
          if (this.activeRequestId !== currentRequestId) return;
          this.callbacks.setAiAnswer(res.answer);
          this.callbacks.setAiSources(res.sources || []);
        } catch (err: any) {
          if (this.activeRequestId !== currentRequestId) return;
          this.callbacks.setAiAnswer(null);
          this.callbacks.setErrorMessage(
            err?.message ||
              `Failed to query Project Intelligence for project ${activeProject.name || targetProjectId}.`,
          );
        } finally {
          if (this.activeRequestId === currentRequestId) {
            this.callbacks.setIsAnswering(false);
          }
        }
      },
    );

    this.activeStreamCleanup = cleanup;
  }
}
