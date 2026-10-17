//! Token breakdown per agent (new input, cache read, cache write, output, reasoning) over the last N days,
//! read from the local Claude Code and Codex transcripts. Feeds the Token Biome view; nothing leaves the PC.

use serde::Serialize;
use serde_json::Value;
use std::collections::HashSet;
use std::fs;
use std::io::{BufRead, BufReader};
use std::path::{Path, PathBuf};
use std::time::{Duration, SystemTime, UNIX_EPOCH};

#[derive(Serialize, Default, Clone, Debug, PartialEq)]
pub struct TokenTotals {
    pub input: u64,
    pub cache_read: u64,
    pub cache_write: u64,
    pub output: u64,
    pub reasoning: u64,
}

#[derive(Serialize, Default, Clone, Debug)]
pub struct TokenBreakdown {
    pub days: u32,
    pub claude: TokenTotals,
    pub codex: TokenTotals,
}

fn walk_jsonl(dir: &Path, since: SystemTime, out: &mut Vec<PathBuf>) {
    let Ok(entries) = fs::read_dir(dir) else { return };
    for entry in entries.flatten() {
        let path = entry.path();
        let Ok(meta) = entry.metadata() else { continue };
        if meta.is_dir() {
            walk_jsonl(&path, since, out);
        } else if path.extension().is_some_and(|e| e == "jsonl")
            && meta.modified().map(|m| m >= since).unwrap_or(false)
        {
            out.push(path);
        }
    }
}

fn epoch_secs(timestamp: &str) -> Option<u64> {
    let parsed = chrono::DateTime::parse_from_rfc3339(timestamp).ok()?;
    u64::try_from(parsed.timestamp()).ok()
}

fn u(value: &Value, key: &str) -> u64 {
    value.get(key).and_then(Value::as_u64).unwrap_or(0)
}

/// Sums assistant usage lines, counting each API response once (a response is logged once per content block).
fn claude_totals(files: &[PathBuf], since_secs: u64) -> TokenTotals {
    let mut totals = TokenTotals::default();
    for path in files {
        let Ok(file) = fs::File::open(path) else { continue };
        let mut seen: HashSet<String> = HashSet::new();
        for line in BufReader::new(file).lines().map_while(Result::ok) {
            if !line.contains("\"usage\"") {
                continue;
            }
            let Ok(json) = serde_json::from_str::<Value>(&line) else { continue };
            if json.get("type").and_then(Value::as_str) != Some("assistant") {
                continue;
            }
            let Some(usage) = json.pointer("/message/usage") else { continue };
            let in_window = json
                .get("timestamp")
                .and_then(Value::as_str)
                .and_then(epoch_secs)
                .is_some_and(|t| t >= since_secs);
            if !in_window {
                continue;
            }
            let id = format!(
                "{}{}",
                json.pointer("/message/id").and_then(Value::as_str).unwrap_or(""),
                json.get("requestId").and_then(Value::as_str).unwrap_or("")
            );
            if !id.is_empty() && !seen.insert(id) {
                continue;
            }
            totals.input += u(usage, "input_tokens");
            totals.cache_read += u(usage, "cache_read_input_tokens");
            totals.cache_write += u(usage, "cache_creation_input_tokens");
            totals.output += u(usage, "output_tokens");
        }
    }
    totals
}

/// Codex logs running totals per session, so the last `token_count` of each file is that session's total.
fn codex_totals(files: &[PathBuf], since_secs: u64) -> TokenTotals {
    let mut totals = TokenTotals::default();
    for path in files {
        let Ok(file) = fs::File::open(path) else { continue };
        let mut last: Option<(Value, u64)> = None;
        for line in BufReader::new(file).lines().map_while(Result::ok) {
            if !line.contains("token_count") {
                continue;
            }
            let Ok(json) = serde_json::from_str::<Value>(&line) else { continue };
            let Some(usage) = json.pointer("/payload/info/total_token_usage") else { continue };
            let at = json
                .get("timestamp")
                .and_then(Value::as_str)
                .and_then(epoch_secs)
                .unwrap_or(0);
            last = Some((usage.clone(), at));
        }
        let Some((usage, at)) = last else { continue };
        if at < since_secs {
            continue;
        }
        let cached = u(&usage, "cached_input_tokens");
        let reasoning = u(&usage, "reasoning_output_tokens");
        totals.input += u(&usage, "input_tokens").saturating_sub(cached);
        totals.cache_read += cached;
        totals.output += u(&usage, "output_tokens").saturating_sub(reasoning);
        totals.reasoning += reasoning;
    }
    totals
}

fn compute(days: u32, claude_dir: Option<PathBuf>, codex_dir: Option<PathBuf>) -> TokenBreakdown {
    let window = Duration::from_secs(u64::from(days.clamp(1, 90)) * 86_400);
    let now = SystemTime::now();
    let since = now.checked_sub(window).unwrap_or(UNIX_EPOCH);
    let since_secs = since.duration_since(UNIX_EPOCH).map(|d| d.as_secs()).unwrap_or(0);
    let collect = |dir: Option<PathBuf>| {
        let mut files = Vec::new();
        if let Some(dir) = dir {
            walk_jsonl(&dir, since, &mut files);
        }
        files
    };
    TokenBreakdown {
        days,
        claude: claude_totals(&collect(claude_dir), since_secs),
        codex: codex_totals(&collect(codex_dir), since_secs),
    }
}

#[tauri::command]
pub async fn get_token_breakdown(days: u32) -> Result<TokenBreakdown, String> {
    let home = dirs_next::home_dir().ok_or("no home directory")?;
    tokio::task::spawn_blocking(move || {
        compute(days, Some(home.join(".claude").join("projects")), Some(home.join(".codex").join("sessions")))
    })
    .await
    .map_err(|e| e.to_string())
}

#[cfg(test)]
mod tests {
    use super::*;

    fn stamp() -> String {
        let secs = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs() as i64;
        chrono::DateTime::from_timestamp(secs, 0).unwrap().to_rfc3339()
    }

    #[test]
    fn counts_each_claude_response_once_and_splits_codex_reasoning() {
        let dir = std::env::temp_dir().join(format!("alethe-tokens-{}", std::process::id()));
        let _ = fs::remove_dir_all(&dir);
        let claude = dir.join("claude");
        let codex = dir.join("codex");
        fs::create_dir_all(&claude).unwrap();
        fs::create_dir_all(&codex).unwrap();
        let t = stamp();
        let a = format!(
            r#"{{"type":"assistant","timestamp":"{t}","requestId":"r1","message":{{"id":"m1","usage":{{"input_tokens":10,"output_tokens":5,"cache_read_input_tokens":100,"cache_creation_input_tokens":7}}}}}}"#
        );
        fs::write(claude.join("s.jsonl"), format!("{a}\n{a}\n")).unwrap();
        let c = format!(
            r#"{{"timestamp":"{t}","payload":{{"type":"token_count","info":{{"total_token_usage":{{"input_tokens":50,"cached_input_tokens":20,"output_tokens":9,"reasoning_output_tokens":4}}}}}}}}"#
        );
        fs::write(codex.join("r.jsonl"), format!("{c}\n")).unwrap();

        let result = compute(7, Some(claude), Some(codex));
        assert_eq!(
            result.claude,
            TokenTotals { input: 10, cache_read: 100, cache_write: 7, output: 5, reasoning: 0 }
        );
        assert_eq!(
            result.codex,
            TokenTotals { input: 30, cache_read: 20, cache_write: 0, output: 5, reasoning: 4 }
        );
        let _ = fs::remove_dir_all(&dir);
    }
}
