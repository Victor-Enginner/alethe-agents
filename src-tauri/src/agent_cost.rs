//

// get_session_cost(agent, cwd, session_id) periodicamente pro Token HUD.

use serde::Serialize;
use std::collections::HashMap;
use std::fs;
use std::io::{BufRead, BufReader, Seek, SeekFrom};
use std::path::PathBuf;
use std::sync::{Mutex, OnceLock};

/// Anthropic. Validado via skill claude-api (tabela de modelos atual).
struct Pricing {
    input: f64,
    output: f64,
    cache_write_5m: f64,
    cache_write_1h: f64,
    cache_read: f64,
}

///

pub(crate) fn opencode_db_path() -> Option<PathBuf> {
    if let Some(path) = opencode_db_path_from_cli() {
        return Some(path);
    }
    opencode_db_path_fallback_guess()
}

fn opencode_db_path_from_cli() -> Option<PathBuf> {
    let binary = crate::cli_resolver::find_windows_cli_launcher("opencode")?;
    let mut cmd = std::process::Command::new(&binary);
    cmd.args(["db", "path"]);
    crate::git_control::hide_console(&mut cmd);
    let output = cmd.output().ok()?;
    if !output.status.success() {
        return None;
    }
    let raw = String::from_utf8_lossy(&output.stdout);
    let trimmed = raw.trim();
    if trimmed.is_empty() {
        return None;
    }
    let path = PathBuf::from(trimmed);
    if path.is_file() {
        Some(path)
    } else {
        None
    }
}

fn opencode_db_path_fallback_guess() -> Option<PathBuf> {
    #[cfg(target_os = "linux")]
    {
        dirs_next::data_local_dir().map(|d| d.join("opencode").join("opencode.db"))
    }
    #[cfg(not(target_os = "linux"))]
    {
        dirs_next::data_dir().map(|d| d.join("opencode").join("opencode.db"))
    }
}

///

fn pricing_for(model: &str) -> Option<Pricing> {
    let m = model.to_ascii_lowercase();

    // input, output → derivados: 5m=1.25x, 1h=2x, read=0.1x
    let base = if m.contains("opus") {
        (5.0, 25.0)
    } else if m.contains("sonnet") {
        (3.0, 15.0)
    } else if m.contains("haiku") {
        (1.0, 5.0)
    } else {
        return None;
    };
    let (input, output) = base;
    Some(Pricing {
        input,
        output,
        cache_write_5m: input * 1.25,
        cache_write_1h: input * 2.0,
        cache_read: input * 0.1,
    })
}

#[derive(Serialize, Default, Clone)]
pub struct ModelCost {
    pub model: String,
    pub input: u64,
    pub output: u64,
    pub cache_read: u64,
    pub cache_write_5m: u64,
    pub cache_write_1h: u64,

    pub cost_usd: Option<f64>,
}

#[derive(Serialize, Default)]
pub struct SessionCost {
    pub session_id: String,
    pub agent: String,
    pub input: u64,
    pub output: u64,
    pub cache_read: u64,
    pub cache_write_5m: u64,
    pub cache_write_1h: u64,
    pub total_tokens: u64,

    pub cost_usd: Option<f64>,
    /// Modelo dominante (mais output) — pro HUD mostrar um label.
    pub model: Option<String>,
    pub by_model: Vec<ModelCost>,
    /// Prompt size of the latest turn (input + cache read + cache write), i.e.
    /// how full the context window is right now. `None` when unknown.
    pub context_tokens: Option<u64>,
}

impl ModelCost {
    fn compute_cost(&mut self) {
        if self.cost_usd.is_some() {
            return;
        }
        if let Some(p) = pricing_for(&self.model) {
            let cost = self.input as f64 / 1_000_000.0 * p.input
                + self.output as f64 / 1_000_000.0 * p.output
                + self.cache_read as f64 / 1_000_000.0 * p.cache_read
                + self.cache_write_5m as f64 / 1_000_000.0 * p.cache_write_5m
                + self.cache_write_1h as f64 / 1_000_000.0 * p.cache_write_1h;
            self.cost_usd = Some(cost);
        }
    }
}

const TRANSCRIPT_CACHE_MAX_ENTRIES: usize = 64;

#[derive(Default, Clone)]
struct ClaudeTally {
    by_model: HashMap<String, ModelCost>,
    context_tokens: Option<u64>,
}

#[derive(Default, Clone)]
struct CodexTally {
    cost: ModelCost,
    context_tokens: Option<u64>,
}

/// Transcripts are append-only JSONL that reach tens of MB, and the HUD polls
/// them every few seconds. Each entry remembers how far the file was parsed so
/// a poll only reads the bytes appended since the previous one.
type TranscriptCache<T> = Mutex<HashMap<PathBuf, (u64, T)>>;

fn claude_cache() -> &'static TranscriptCache<ClaudeTally> {
    static CACHE: OnceLock<TranscriptCache<ClaudeTally>> = OnceLock::new();
    CACHE.get_or_init(Default::default)
}

fn codex_cache() -> &'static TranscriptCache<CodexTally> {
    static CACHE: OnceLock<TranscriptCache<CodexTally>> = OnceLock::new();
    CACHE.get_or_init(Default::default)
}

/// Feeds every complete line after `offset` to `on_line` and returns the new
/// offset. A trailing line without `\n` is still being written and is left for
/// the next call. `None` when the file shrank (rewritten), so the caller resets.
fn read_appended_lines(path: &PathBuf, offset: u64, mut on_line: impl FnMut(&str)) -> Option<u64> {
    let mut file = fs::File::open(path).ok()?;
    let len = file.metadata().ok()?.len();
    if len < offset {
        return None;
    }
    if len == offset {
        return Some(offset);
    }
    file.seek(SeekFrom::Start(offset)).ok()?;
    let mut reader = BufReader::new(file);
    let mut consumed = offset;
    let mut buf = Vec::new();
    loop {
        buf.clear();
        let Ok(read) = reader.read_until(b'\n', &mut buf) else {
            break;
        };
        if read == 0 || buf.last() != Some(&b'\n') {
            break;
        }
        consumed += read as u64;
        let line = String::from_utf8_lossy(&buf);
        let line = line.trim_end();
        if !line.is_empty() {
            on_line(line);
        }
    }
    Some(consumed)
}

fn incremental_parse<T: Default + Clone>(
    cache: &TranscriptCache<T>,
    path: &PathBuf,
    apply: impl Fn(&mut T, &str),
) -> T {
    let mut cache = cache
        .lock()
        .unwrap_or_else(|poisoned| poisoned.into_inner());
    let (offset, mut tally) = cache.remove(path).unwrap_or_default();
    let next = match read_appended_lines(path, offset, |line| apply(&mut tally, line)) {
        Some(next) => next,
        None => {
            tally = T::default();
            read_appended_lines(path, 0, |line| apply(&mut tally, line)).unwrap_or(0)
        }
    };
    if cache.len() >= TRANSCRIPT_CACHE_MAX_ENTRIES {
        cache.clear();
    }
    cache.insert(path.clone(), (next, tally.clone()));
    tally
}

/// Sums Claude transcript tokens grouped by message.model.
fn tally_claude_line(tally: &mut ClaudeTally, line: &str) {
    let Ok(value) = serde_json::from_str::<serde_json::Value>(line) else {
        return;
    };
    let Some(message) = value.get("message") else {
        return;
    };
    let Some(usage) = message.get("usage") else {
        return;
    };
    let model = message
        .get("model")
        .and_then(|v| v.as_str())
        .unwrap_or("unknown")
        .to_string();
    let entry = tally
        .by_model
        .entry(model.clone())
        .or_insert_with(|| ModelCost {
            model,
            ..Default::default()
        });
    let u = |k: &str| usage.get(k).and_then(|v| v.as_u64()).unwrap_or(0);
    entry.input += u("input_tokens");
    entry.output += u("output_tokens");
    entry.cache_read += u("cache_read_input_tokens");
    // The 5m/1h breakdown lives in cache_creation; fall back to cache_creation_input_tokens as 5m.
    let cc = usage.get("cache_creation");
    let cc5 = cc
        .and_then(|c| c.get("ephemeral_5m_input_tokens"))
        .and_then(|v| v.as_u64());
    let cc1 = cc
        .and_then(|c| c.get("ephemeral_1h_input_tokens"))
        .and_then(|v| v.as_u64());
    match (cc5, cc1) {
        (Some(a), Some(b)) => {
            entry.cache_write_5m += a;
            entry.cache_write_1h += b;
        }
        _ => {
            entry.cache_write_5m += u("cache_creation_input_tokens");
        }
    }
    let sidechain = value.get("isSidechain").and_then(|v| v.as_bool()) == Some(true);
    if !sidechain {
        tally.context_tokens = Some(
            u("input_tokens") + u("cache_read_input_tokens") + u("cache_creation_input_tokens"),
        );
    }
}

fn parse_claude_cost(path: &PathBuf) -> ClaudeTally {
    incremental_parse(claude_cache(), path, tally_claude_line)
}

fn tally_codex_line(tally: &mut CodexTally, line: &str) {
    let Ok(value) = serde_json::from_str::<serde_json::Value>(line) else {
        return;
    };
    let payload = value.get("payload");
    let is_token_count =
        payload.and_then(|p| p.get("type")).and_then(|v| v.as_str()) == Some("token_count");
    if !is_token_count {
        return;
    }
    let info = payload.and_then(|p| p.get("info"));
    let Some(total) = info.and_then(|i| i.get("total_token_usage")) else {
        return;
    };
    let u = |k: &str| total.get(k).and_then(|v| v.as_u64()).unwrap_or(0);
    tally.cost.input = u("input_tokens");
    tally.cost.output = u("output_tokens");
    tally.cost.cache_read = u("cached_input_tokens");
    // Codex counts cached tokens inside input_tokens, so the last turn's input is the context.
    if let Some(last) = info
        .and_then(|i| i.get("last_token_usage"))
        .and_then(|l| l.get("input_tokens"))
        .and_then(|v| v.as_u64())
    {
        tally.context_tokens = Some(last);
    }
}

fn parse_codex_cost(path: &PathBuf) -> CodexTally {
    let mut tally = incremental_parse(codex_cache(), path, tally_codex_line);
    tally.cost.model = "codex".to_string();
    tally
}

fn find_codex_session_path(session_id: &str) -> Option<PathBuf> {
    // Scanning every Codex session file on each HUD poll is expensive; ids never move.
    static PATHS: OnceLock<Mutex<HashMap<String, PathBuf>>> = OnceLock::new();
    let paths = PATHS.get_or_init(Default::default);
    let known = paths
        .lock()
        .ok()
        .and_then(|map| map.get(session_id).cloned());
    if let Some(known) = known.filter(|path| path.is_file()) {
        return Some(known);
    }
    let found = scan_codex_session_path(session_id)?;
    if let Ok(mut map) = paths.lock() {
        map.insert(session_id.to_string(), found.clone());
    }
    Some(found)
}

fn scan_codex_session_path(session_id: &str) -> Option<PathBuf> {
    let root = crate::codex_sessions::codex_sessions_dir()?;
    if !root.is_dir() {
        return None;
    }
    let mut files = Vec::new();
    crate::codex_sessions::collect_jsonl_files(&root, &mut files);
    for path in files {
        if let Some(id) = crate::codex_sessions::session_meta_id(&path) {
            if id == session_id {
                return Some(path);
            }
        }
    }
    None
}

#[tauri::command]
pub async fn get_session_cost(
    agent: String,
    cwd: String,
    session_id: String,
) -> Result<SessionCost, String> {
    tokio::task::spawn_blocking(move || get_session_cost_inner(agent, cwd, session_id))
        .await
        .map_err(|e| e.to_string())?
}

fn get_session_cost_inner(
    agent: String,
    cwd: String,
    session_id: String,
) -> Result<SessionCost, String> {
    let mut context_tokens = None;
    let by_model: Vec<ModelCost> = match agent.as_str() {
        "codex" => {
            let Some(path) = find_codex_session_path(&session_id) else {
                return Err(format!("sessão codex {session_id} não encontrada"));
            };
            let tally = parse_codex_cost(&path);
            context_tokens = tally.context_tokens;
            vec![tally.cost]
        }
        "claude" => {
            let dirs = crate::claude_sessions::project_dirs_for_cwd(&cwd)?;
            let mut path: Option<PathBuf> = None;
            for dir in dirs {
                let candidate = dir.join(format!("{session_id}.jsonl"));
                if candidate.is_file() {
                    path = Some(candidate);
                    break;
                }
            }
            let Some(path) = path else {
                return Err(format!("sessão claude {session_id} não encontrada"));
            };
            let tally = parse_claude_cost(&path);
            context_tokens = tally.context_tokens;
            tally.by_model.into_values().collect()
        }
        "opencode" => {
            let db_path = opencode_db_path()
                .ok_or_else(|| "caminho do banco do OpenCode não encontrado".to_string())?;
            if !db_path.is_file() {
                return Err(format!("banco do OpenCode não encontrado em: {db_path:?}"));
            }

            let conn = rusqlite::Connection::open_with_flags(
                &db_path,
                rusqlite::OpenFlags::SQLITE_OPEN_READ_ONLY
                    | rusqlite::OpenFlags::SQLITE_OPEN_NO_MUTEX,
            )
            .map_err(|e| format!("falha ao abrir banco do OpenCode: {e}"))?;

            let mut stmt = conn
                .prepare(
                    "SELECT model, tokens_input, tokens_output, tokens_cache_read, tokens_cache_write, cost FROM session WHERE id = ?1",
                )
                .map_err(|e| format!("falha ao preparar query: {e}"))?;

            let mut rows = stmt
                .query(rusqlite::params![session_id])
                .map_err(|e| format!("falha ao executar query: {e}"))?;

            let mut result_by_model = Vec::new();
            if let Some(row) = rows
                .next()
                .map_err(|e| format!("falha ao ler linha: {e}"))?
            {
                let model_raw: String = row.get(0).unwrap_or_default();
                let tokens_input: u64 = row.get(1).unwrap_or(0);
                let tokens_output: u64 = row.get(2).unwrap_or(0);
                let tokens_cache_read: u64 = row.get(3).unwrap_or(0);
                let tokens_cache_write: u64 = row.get(4).unwrap_or(0);
                let cost: f64 = row.get(5).unwrap_or(0.0);

                let model_name =
                    if let Ok(v) = serde_json::from_str::<serde_json::Value>(&model_raw) {
                        v.get("id")
                            .and_then(|id| id.as_str())
                            .unwrap_or(&model_raw)
                            .to_string()
                    } else {
                        model_raw
                    };

                result_by_model.push(ModelCost {
                    model: model_name,
                    input: tokens_input,
                    output: tokens_output,
                    cache_read: tokens_cache_read,
                    cache_write_5m: tokens_cache_write,
                    cost_usd: Some(cost),
                    ..Default::default()
                });
            }
            result_by_model
        }
        other => return Err(format!("agente sem custo suportado: {other}")),
    };

    let mut cost = aggregate(agent, session_id, by_model);
    cost.context_tokens = context_tokens;
    Ok(cost)
}

#[tauri::command]
pub async fn get_transcript_cost(
    path: String,
    agent: Option<String>,
) -> Result<SessionCost, String> {
    tokio::task::spawn_blocking(move || get_transcript_cost_inner(path, agent))
        .await
        .map_err(|e| e.to_string())?
}

fn get_transcript_cost_inner(path: String, agent: Option<String>) -> Result<SessionCost, String> {
    let pb = PathBuf::from(&path);
    if !pb.is_file() {
        return Err(format!("transcript not found: {path}"));
    }
    let agent = agent.unwrap_or_else(|| "claude".to_string());
    let (by_model, context_tokens): (Vec<ModelCost>, Option<u64>) = match agent.as_str() {
        "claude" => {
            let tally = parse_claude_cost(&pb);
            (tally.by_model.into_values().collect(), tally.context_tokens)
        }
        "codex" => {
            let tally = parse_codex_cost(&pb);
            (vec![tally.cost], tally.context_tokens)
        }
        other => return Err(format!("unsupported agent transcript cost: {other}")),
    };
    let mut cost = aggregate(agent, path, by_model);
    cost.context_tokens = context_tokens;
    Ok(cost)
}

/// modelo dominante por output). Compartilhado por get_session_cost e

fn aggregate(agent: String, session_id: String, mut by_model: Vec<ModelCost>) -> SessionCost {
    for mc in &mut by_model {
        mc.compute_cost();
    }

    let mut total = SessionCost {
        session_id,
        agent,
        ..Default::default()
    };
    let mut any_cost = false;
    let mut dominant: Option<(u64, String)> = None;
    for mc in &by_model {
        total.input += mc.input;
        total.output += mc.output;
        total.cache_read += mc.cache_read;
        total.cache_write_5m += mc.cache_write_5m;
        total.cache_write_1h += mc.cache_write_1h;
        if let Some(c) = mc.cost_usd {
            any_cost = true;
            total.cost_usd = Some(total.cost_usd.unwrap_or(0.0) + c);
        }
        let by_output = dominant
            .as_ref()
            .map(|(o, _)| mc.output > *o)
            .unwrap_or(true);
        if by_output {
            dominant = Some((mc.output, mc.model.clone()));
        }
    }
    if !any_cost {
        total.cost_usd = None;
    }
    total.total_tokens =
        total.input + total.output + total.cache_read + total.cache_write_5m + total.cache_write_1h;
    total.model = dominant.map(|(_, m)| m);
    total.by_model = by_model;
    total
}

#[derive(Serialize)]
pub struct ModelRate {
    pub family: String,
    pub input: f64,
    pub output: f64,
    pub cache_write_5m: f64,
    pub cache_write_1h: f64,
    pub cache_read: f64,
}

#[tauri::command]
pub fn get_model_pricing() -> Vec<ModelRate> {
    ["opus", "sonnet", "haiku"]
        .iter()
        .filter_map(|family| {
            pricing_for(family).map(|p| ModelRate {
                family: (*family).to_string(),
                input: p.input,
                output: p.output,
                cache_write_5m: p.cache_write_5m,
                cache_write_1h: p.cache_write_1h,
                cache_read: p.cache_read,
            })
        })
        .collect()
}

#[derive(Serialize, Default)]
pub struct OpenCodeUsageSummary {
    pub cost_usd: f64,
    pub input_tokens: u64,
    pub output_tokens: u64,
    pub session_count: u32,
    pub by_model: Vec<ModelCost>,
}

#[tauri::command]
pub async fn get_opencode_usage_summary(hours: u32) -> Result<OpenCodeUsageSummary, String> {
    tokio::task::spawn_blocking(move || get_opencode_usage_summary_inner(hours))
        .await
        .map_err(|e| e.to_string())?
}

fn get_opencode_usage_summary_inner(hours: u32) -> Result<OpenCodeUsageSummary, String> {
    let db_path = opencode_db_path()
        .ok_or_else(|| "caminho do banco do OpenCode não encontrado".to_string())?;
    if !db_path.is_file() {
        return Ok(OpenCodeUsageSummary::default());
    }

    let conn = rusqlite::Connection::open_with_flags(
        &db_path,
        rusqlite::OpenFlags::SQLITE_OPEN_READ_ONLY | rusqlite::OpenFlags::SQLITE_OPEN_NO_MUTEX,
    )
    .map_err(|e| format!("falha ao abrir banco do OpenCode: {e}"))?;

    let now_ms = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_millis() as i64)
        .unwrap_or(0);
    let since_ms = now_ms - (hours as i64) * 3_600_000;

    let mut stmt = conn
        .prepare(
            "SELECT model, cost, tokens_input, tokens_output, tokens_cache_read, tokens_cache_write \
             FROM session WHERE time_updated >= ?1",
        )
        .map_err(|e| format!("falha ao preparar query: {e}"))?;

    let mut rows = stmt
        .query(rusqlite::params![since_ms])
        .map_err(|e| format!("falha ao executar query: {e}"))?;

    let mut by_model: std::collections::HashMap<String, ModelCost> =
        std::collections::HashMap::new();
    let mut session_count = 0u32;
    while let Some(row) = rows
        .next()
        .map_err(|e| format!("falha ao ler linha: {e}"))?
    {
        let model_raw: String = row.get(0).unwrap_or_default();
        let cost: f64 = row.get(1).unwrap_or(0.0);
        let tokens_input: u64 = row.get(2).unwrap_or(0);
        let tokens_output: u64 = row.get(3).unwrap_or(0);
        let tokens_cache_read: u64 = row.get(4).unwrap_or(0);
        let tokens_cache_write: u64 = row.get(5).unwrap_or(0);

        let model_name = if let Ok(v) = serde_json::from_str::<serde_json::Value>(&model_raw) {
            v.get("id")
                .and_then(|id| id.as_str())
                .unwrap_or(&model_raw)
                .to_string()
        } else {
            model_raw
        };
        if model_name.is_empty() {
            continue;
        }

        session_count += 1;
        let entry = by_model
            .entry(model_name.clone())
            .or_insert_with(|| ModelCost {
                model: model_name,
                cost_usd: Some(0.0),
                ..Default::default()
            });
        entry.input += tokens_input;
        entry.output += tokens_output;
        entry.cache_read += tokens_cache_read;
        entry.cache_write_5m += tokens_cache_write;
        entry.cost_usd = Some(entry.cost_usd.unwrap_or(0.0) + cost);
    }

    let mut by_model: Vec<ModelCost> = by_model.into_values().collect();
    by_model.sort_by(|a, b| {
        b.cost_usd
            .partial_cmp(&a.cost_usd)
            .unwrap_or(std::cmp::Ordering::Equal)
    });

    let cost_usd = by_model.iter().filter_map(|m| m.cost_usd).sum();
    let input_tokens = by_model.iter().map(|m| m.input).sum();
    let output_tokens = by_model.iter().map(|m| m.output).sum();

    Ok(OpenCodeUsageSummary {
        cost_usd,
        input_tokens,
        output_tokens,
        session_count,
        by_model,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn pricing_for_still_resolves_claude_families_after_opencode_table_removal() {
        assert!(pricing_for("claude-opus-4-8").is_some());
        assert!(pricing_for("claude-sonnet-4-6").is_some());
        assert!(pricing_for("claude-haiku-4-5").is_some());

        assert!(pricing_for("deepseek-v4-flash-free").is_none());
    }

    #[test]
    fn compute_cost_never_overwrites_a_pre_set_cost_from_the_opencode_db() {
        // Simula o que o branch "opencode" de get_session_cost_inner faz: seta

        let mut mc = ModelCost {
            model: "deepseek-v4-flash".to_string(),
            input: 1000,
            output: 500,
            cost_usd: Some(0.0123),
            ..Default::default()
        };
        mc.compute_cost();
        assert_eq!(mc.cost_usd, Some(0.0123));
    }

    #[test]
    fn compute_cost_fills_in_claude_pricing_when_none_was_set() {
        let mut mc = ModelCost {
            model: "claude-opus-4-8".to_string(),
            input: 1_000_000,
            output: 0,
            ..Default::default()
        };
        mc.compute_cost();
        assert_eq!(mc.cost_usd, Some(5.0));
    }

    fn temp_transcript(name: &str) -> PathBuf {
        let suffix = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_nanos();
        std::env::temp_dir().join(format!("alethe-{name}-{suffix}.jsonl"))
    }

    fn claude_line(input: u64, read: u64, write: u64, output: u64) -> String {
        format!(
            "{{\"type\":\"assistant\",\"message\":{{\"model\":\"claude-opus-4-8\",\"usage\":{{\"input_tokens\":{input},\"cache_read_input_tokens\":{read},\"cache_creation_input_tokens\":{write},\"output_tokens\":{output}}}}}}}\n"
        )
    }

    #[test]
    fn claude_transcript_is_parsed_incrementally_and_reports_last_turn_context() {
        use std::io::Write;
        let path = temp_transcript("claude-incremental");
        fs::write(&path, claude_line(10, 1_000, 200, 50)).unwrap();
        assert_eq!(parse_claude_cost(&path).context_tokens, Some(1_210));

        // A half-written line waits for the next poll instead of being lost.
        let mut file = fs::OpenOptions::new().append(true).open(&path).unwrap();
        let next = claude_line(5, 150_000, 60_000, 20);
        let (head, tail) = next.split_at(30);
        file.write_all(head.as_bytes()).unwrap();
        assert_eq!(parse_claude_cost(&path).context_tokens, Some(1_210));
        file.write_all(tail.as_bytes()).unwrap();
        drop(file);

        let second = parse_claude_cost(&path);
        assert_eq!(second.context_tokens, Some(210_005));
        let opus = &second.by_model["claude-opus-4-8"];
        assert_eq!(
            (opus.input, opus.output, opus.cache_read),
            (15, 70, 151_000)
        );

        // A rewritten (shorter) transcript resets the tally.
        fs::write(&path, claude_line(1, 2, 3, 4)).unwrap();
        let reset = parse_claude_cost(&path);
        assert_eq!(reset.context_tokens, Some(6));
        assert_eq!(reset.by_model["claude-opus-4-8"].output, 4);
        let _ = fs::remove_file(&path);
    }

    #[test]
    fn codex_context_comes_from_the_last_turn_input() {
        let path = temp_transcript("codex-context");
        fs::write(
            &path,
            "{\"payload\":{\"type\":\"token_count\",\"info\":{\"total_token_usage\":{\"input_tokens\":900,\"cached_input_tokens\":400,\"output_tokens\":70},\"last_token_usage\":{\"input_tokens\":320000}}}}\n",
        )
        .unwrap();
        let tally = parse_codex_cost(&path);
        assert_eq!(tally.context_tokens, Some(320_000));
        assert_eq!(
            (tally.cost.input, tally.cost.model.as_str()),
            (900, "codex")
        );
        let _ = fs::remove_file(&path);
    }
}
