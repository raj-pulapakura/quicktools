use std::fs;
use std::path::{Path, PathBuf};

use crate::models::Workflow;

const APP_SUPPORT_SUBDIR: &str = "Library/Application Support/QuickTools";
const WORKFLOW_FILE: &str = "workflows.json";

fn app_support_dir() -> Result<PathBuf, String> {
    let home = std::env::var("HOME").map_err(|_| "HOME environment variable is not set".to_string())?;
    Ok(Path::new(&home).join(APP_SUPPORT_SUBDIR))
}

pub fn workflow_file_path() -> Result<PathBuf, String> {
    Ok(app_support_dir()?.join(WORKFLOW_FILE))
}

pub fn load_workflows() -> Result<Vec<Workflow>, String> {
    let file_path = workflow_file_path()?;

    if !file_path.exists() {
        return Ok(Vec::new());
    }

    let raw = fs::read_to_string(&file_path)
        .map_err(|err| format!("Failed to read {}: {err}", file_path.display()))?;

    if raw.trim().is_empty() {
        return Ok(Vec::new());
    }

    serde_json::from_str::<Vec<Workflow>>(&raw)
        .map_err(|err| format!("Failed to parse {}: {err}", file_path.display()))
}

pub fn save_workflows(workflows: &[Workflow]) -> Result<(), String> {
    let app_support = app_support_dir()?;
    fs::create_dir_all(&app_support)
        .map_err(|err| format!("Failed to create {}: {err}", app_support.display()))?;

    let file_path = app_support.join(WORKFLOW_FILE);
    let temp_path = app_support.join("workflows.tmp.json");

    let json = serde_json::to_string_pretty(workflows)
        .map_err(|err| format!("Failed to serialize workflows: {err}"))?;

    fs::write(&temp_path, json)
        .map_err(|err| format!("Failed to write {}: {err}", temp_path.display()))?;

    fs::rename(&temp_path, &file_path)
        .map_err(|err| format!("Failed to replace {}: {err}", file_path.display()))
}
