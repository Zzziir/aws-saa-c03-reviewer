import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { domainBreakdown } from "@/lib/session-utils";
import type {
  ActiveSession,
  AnswerRecord,
  Attempt,
  SessionConfig,
} from "@/lib/types";
import type { Json } from "@/lib/supabase/database.types";

/** Snapshot of everything persisted for a user, in the store's own shapes. */
export interface UserState {
  settings: SessionConfig | null;
  active: ActiveSession | null;
  history: Attempt[];
  flaggedIds: number[];
}

// --- current-user id cache (avoids an auth round-trip on every write) --------

let cachedUserId: string | null = null;

export function setCurrentUserId(id: string | null): void {
  cachedUserId = id;
}

async function requireUserId(): Promise<string | null> {
  if (cachedUserId) return cachedUserId;
  const { data } = await getSupabaseBrowserClient().auth.getUser();
  cachedUserId = data.user?.id ?? null;
  return cachedUserId;
}

// --- conversions -------------------------------------------------------------

function toSessionConfig(row: {
  mode: SessionConfig["mode"];
  count: number;
  duration_sec: number;
  difficulty: SessionConfig["difficulty"];
  domains: SessionConfig["domains"];
}): SessionConfig {
  return {
    mode: row.mode,
    count: row.count,
    durationSec: row.duration_sec,
    difficulty: row.difficulty,
    domains: row.domains ?? [],
  };
}

function toActiveSession(row: {
  client_session_id: string;
  config: Json;
  question_ids: number[];
  current_index: number;
  answers: Json;
  started_at: string;
  elapsed_sec: number;
  paused: boolean;
  segment_start: string | null;
  finished: boolean;
}): ActiveSession {
  return {
    id: row.client_session_id,
    config: row.config as unknown as SessionConfig,
    questionIds: row.question_ids,
    index: row.current_index,
    answers: (row.answers ?? {}) as unknown as Record<number, AnswerRecord>,
    startedAt: new Date(row.started_at).getTime(),
    elapsedSec: row.elapsed_sec,
    paused: row.paused,
    segmentStart: row.segment_start
      ? new Date(row.segment_start).getTime()
      : null,
    finished: row.finished,
  };
}

// --- load --------------------------------------------------------------------

export async function loadUserState(): Promise<UserState> {
  const supabase = getSupabaseBrowserClient();

  const [settingsRes, activeRes, attemptsRes, flaggedRes] = await Promise.all([
    supabase.from("user_settings").select("*").maybeSingle(),
    supabase.from("active_session").select("*").maybeSingle(),
    supabase.from("attempts").select("*").order("occurred_at", { ascending: false }),
    supabase.from("flagged_questions").select("question_id"),
  ]);

  const settings = settingsRes.data ? toSessionConfig(settingsRes.data) : null;
  const active = activeRes.data ? toActiveSession(activeRes.data) : null;
  const flaggedIds = (flaggedRes.data ?? []).map((r) => r.question_id);

  const attemptRows = attemptsRes.data ?? [];
  let history: Attempt[] = [];

  if (attemptRows.length > 0) {
    const { data: answerRows } = await supabase
      .from("attempt_answers")
      .select("*")
      .in(
        "attempt_id",
        attemptRows.map((a) => a.id),
      )
      .order("position", { ascending: true });

    const answersByAttempt = new Map<string, AnswerRecord[]>();
    for (const r of answerRows ?? []) {
      const rec: AnswerRecord = {
        questionId: r.question_id,
        selected: (r.selected ?? []) as unknown as number[],
        correct: r.correct,
        flagged: r.flagged,
      };
      const list = answersByAttempt.get(r.attempt_id);
      if (list) list.push(rec);
      else answersByAttempt.set(r.attempt_id, [rec]);
    }

    history = attemptRows.map((a): Attempt => {
      const answers = answersByAttempt.get(a.id) ?? [];
      return {
        id: a.client_id,
        mode: a.mode,
        config: a.config as unknown as SessionConfig,
        date: new Date(a.occurred_at).getTime(),
        durationSec: a.duration_sec,
        total: a.total,
        correct: a.correct,
        scorePct: Number(a.score_pct),
        passed: a.passed,
        breakdown: domainBreakdown(a.question_ids, answers),
        answers,
        questionIds: a.question_ids,
      };
    });
  }

  return { settings, active, history, flaggedIds };
}

// --- settings ----------------------------------------------------------------

export async function saveSettings(config: SessionConfig): Promise<void> {
  const userId = await requireUserId();
  if (!userId) return;
  await getSupabaseBrowserClient()
    .from("user_settings")
    .upsert(
      {
        user_id: userId,
        mode: config.mode,
        count: config.count,
        duration_sec: config.durationSec,
        difficulty: config.difficulty,
        domains: config.domains,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );
}

// --- active session ----------------------------------------------------------

export async function saveActive(active: ActiveSession): Promise<void> {
  const userId = await requireUserId();
  if (!userId) return;
  await getSupabaseBrowserClient()
    .from("active_session")
    .upsert(
      {
        user_id: userId,
        client_session_id: active.id,
        config: active.config as unknown as Json,
        question_ids: active.questionIds,
        current_index: active.index,
        answers: active.answers as unknown as Json,
        started_at: new Date(active.startedAt).toISOString(),
        elapsed_sec: active.elapsedSec,
        paused: active.paused,
        segment_start: active.segmentStart
          ? new Date(active.segmentStart).toISOString()
          : null,
        finished: active.finished,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );
}

export async function deleteActive(): Promise<void> {
  const userId = await requireUserId();
  if (!userId) return;
  await getSupabaseBrowserClient()
    .from("active_session")
    .delete()
    .eq("user_id", userId);
}

// --- attempts ----------------------------------------------------------------

export async function recordAttempt(attempt: Attempt): Promise<void> {
  await getSupabaseBrowserClient().rpc("record_attempt", {
    p_client_id: attempt.id,
    p_mode: attempt.mode,
    p_config: attempt.config as unknown as Json,
    p_occurred_at: new Date(attempt.date).toISOString(),
    p_duration_sec: attempt.durationSec,
    p_total: attempt.total,
    p_correct: attempt.correct,
    p_score_pct: attempt.scorePct,
    p_passed: attempt.passed,
    p_question_ids: attempt.questionIds,
    p_answers: attempt.answers as unknown as Json,
  });
}

export async function deleteAttempt(clientId: string): Promise<void> {
  const userId = await requireUserId();
  if (!userId) return;
  await getSupabaseBrowserClient()
    .from("attempts")
    .delete()
    .eq("user_id", userId)
    .eq("client_id", clientId);
}

export async function clearHistory(): Promise<void> {
  const userId = await requireUserId();
  if (!userId) return;
  await getSupabaseBrowserClient()
    .from("attempts")
    .delete()
    .eq("user_id", userId);
}

// --- flags -------------------------------------------------------------------

export async function setFlag(questionId: number, on: boolean): Promise<void> {
  const userId = await requireUserId();
  if (!userId) return;
  const supabase = getSupabaseBrowserClient();
  if (on) {
    await supabase
      .from("flagged_questions")
      .upsert(
        { user_id: userId, question_id: questionId },
        { onConflict: "user_id,question_id", ignoreDuplicates: true },
      );
  } else {
    await supabase
      .from("flagged_questions")
      .delete()
      .eq("user_id", userId)
      .eq("question_id", questionId);
  }
}
