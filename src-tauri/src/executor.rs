use std::collections::{HashMap, VecDeque};
use std::path::PathBuf;
use std::process::Command;
use std::time::Duration;

use serde_json::Value;

use crate::models::{
    NodeExecutionResult, NodeType, RunWorkflowResult, Workflow, WorkflowEdge, WorkflowNode,
};

pub async fn run_workflow(workflow: Workflow) -> Result<RunWorkflowResult, String> {
    let nodes_by_id: HashMap<String, WorkflowNode> = workflow
        .nodes
        .iter()
        .cloned()
        .map(|node| (node.id.clone(), node))
        .collect();

    let start_node_id = workflow
        .nodes
        .iter()
        .find(|node| matches!(node.node_type, NodeType::Start))
        .map(|node| node.id.clone())
        .ok_or_else(|| "Workflow is missing a START node".to_string())?;

    for edge in &workflow.edges {
        if !nodes_by_id.contains_key(&edge.source_node_id) {
            return Err(format!(
                "Invalid edge: source node {} does not exist",
                edge.source_node_id
            ));
        }

        if !nodes_by_id.contains_key(&edge.target_node_id) {
            return Err(format!(
                "Invalid edge: target node {} does not exist",
                edge.target_node_id
            ));
        }
    }

    let mut outbound_all: HashMap<String, Vec<String>> = workflow
        .nodes
        .iter()
        .map(|node| (node.id.clone(), Vec::new()))
        .collect();

    for WorkflowEdge {
        source_node_id,
        target_node_id,
        ..
    } in &workflow.edges
    {
        if let Some(targets) = outbound_all.get_mut(source_node_id) {
            targets.push(target_node_id.clone());
        }
    }

    // Only execute START and nodes reachable from it.
    let mut reachable: std::collections::HashSet<String> = std::collections::HashSet::new();
    let mut queue = VecDeque::from([start_node_id.clone()]);
    while let Some(node_id) = queue.pop_front() {
        if !reachable.insert(node_id.clone()) {
            continue;
        }

        if let Some(targets) = outbound_all.get(&node_id) {
            for target in targets {
                queue.push_back(target.clone());
            }
        }
    }

    let mut indegree: HashMap<String, usize> =
        reachable.iter().cloned().map(|node_id| (node_id, 0usize)).collect();

    let mut outbound: HashMap<String, Vec<String>> =
        reachable.iter().cloned().map(|node_id| (node_id, Vec::new())).collect();

    for WorkflowEdge {
        source_node_id,
        target_node_id,
        ..
    } in &workflow.edges
    {
        if !reachable.contains(source_node_id) || !reachable.contains(target_node_id) {
            continue;
        }

        if let Some(degree) = indegree.get_mut(target_node_id) {
            *degree += 1;
        }

        if let Some(targets) = outbound.get_mut(source_node_id) {
            targets.push(target_node_id.clone());
        }
    }

    let mut ready = VecDeque::new();
    for (node_id, degree) in &indegree {
        if *degree == 0 {
            ready.push_back(node_id.clone());
        }
    }

    let mut processed_nodes = 0usize;
    let executable_node_count = reachable.len();
    let mut results = Vec::with_capacity(executable_node_count);

    while !ready.is_empty() {
        let mut batch = Vec::new();
        while let Some(next_node_id) = ready.pop_front() {
            batch.push(next_node_id);
        }

        let mut handles = Vec::with_capacity(batch.len());
        for node_id in &batch {
            let node = nodes_by_id
                .get(node_id)
                .cloned()
                .ok_or_else(|| format!("Node {} is missing", node_id))?;

            handles.push(tauri::async_runtime::spawn_blocking(move || {
                execute_node(&node)
            }));
        }

        for handle in handles {
            let node_result = handle
                .await
                .map_err(|err| format!("Worker join error: {err}"))?;

            if !node_result.success {
                return Err(node_result.message);
            }

            results.push(node_result);
            processed_nodes += 1;
        }

        for node_id in batch {
            if let Some(targets) = outbound.get(&node_id) {
                for target_id in targets {
                    if let Some(next_degree) = indegree.get_mut(target_id) {
                        *next_degree = next_degree.saturating_sub(1);
                        if *next_degree == 0 {
                            ready.push_back(target_id.clone());
                        }
                    }
                }
            }
        }
    }

    if processed_nodes != executable_node_count {
        return Err("Workflow contains a dependency cycle".to_string());
    }

    Ok(RunWorkflowResult {
        workflow_id: workflow.id,
        completed_nodes: processed_nodes,
        results,
    })
}

fn execute_node(node: &WorkflowNode) -> NodeExecutionResult {
    let result = match node.node_type {
        NodeType::Start => Ok("Start node acknowledged".to_string()),
        NodeType::Delay => delay(&node.params),
        NodeType::PlaySpotifyPlaylist => play_spotify_playlist(&node.params),
        NodeType::OpenApp => open_app(&node.params),
        NodeType::OpenBrowser => open_browser(),
        NodeType::OpenUrl => open_urls(&node.params),
        NodeType::OpenTerminalAtPath => open_terminal_at_path(&node.params),
        NodeType::ExecuteCommand => execute_command(&node.params),
        NodeType::OpenFolderInFinder => open_folder_in_finder(&node.params),
    };

    match result {
        Ok(message) => NodeExecutionResult {
            node_id: node.id.clone(),
            node_type: node.node_type.clone(),
            success: true,
            message,
        },
        Err(error) => NodeExecutionResult {
            node_id: node.id.clone(),
            node_type: node.node_type.clone(),
            success: false,
            message: format!("Node {} failed: {error}", node.id),
        },
    }
}

fn delay(params: &Value) -> Result<String, String> {
    let milliseconds = params
        .get("milliseconds")
        .and_then(|value| {
            value
                .as_u64()
                .or_else(|| value.as_i64().and_then(|v| if v >= 0 { Some(v as u64) } else { None }))
                .or_else(|| {
                    value
                        .as_f64()
                        .and_then(|v| if v.is_finite() && v >= 0.0 { Some(v.round() as u64) } else { None })
                })
                .or_else(|| value.as_str().and_then(|s| s.trim().parse::<u64>().ok()))
        })
        .ok_or_else(|| "Delay requires milliseconds".to_string())?;

    std::thread::sleep(Duration::from_millis(milliseconds));
    Ok(format!("Delayed for {milliseconds} ms"))
}

fn open_app(params: &Value) -> Result<String, String> {
    let app_name = params
        .get("appName")
        .and_then(Value::as_str)
        .map(str::trim)
        .filter(|name| !name.is_empty());

    let app_path = params
        .get("appPath")
        .and_then(Value::as_str)
        .map(str::trim)
        .filter(|path| !path.is_empty());

    let target = app_path
        .map(ToString::to_string)
        .or_else(|| app_name.map(ToString::to_string))
        .ok_or_else(|| "Open app requires appName or appPath".to_string())?;

    run_open_command(&["-a", &target])?;
    Ok(format!("Opened app: {target}"))
}

fn open_browser() -> Result<String, String> {
    run_open_command(&["about:blank"])?;
    Ok("Opened default browser".to_string())
}

fn play_spotify_playlist(params: &Value) -> Result<String, String> {
    let query = params
        .get("query")
        .and_then(Value::as_str)
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .ok_or_else(|| "Play Spotify Playlist requires query".to_string())?;

    let open_mode = params
        .get("openMode")
        .and_then(Value::as_str)
        .map(str::trim)
        .unwrap_or("app");

    let encoded_query = encode_for_url_component(query);
    let target = if open_mode.eq_ignore_ascii_case("web") {
        format!("https://open.spotify.com/search/{encoded_query}%20playlist")
    } else {
        format!("spotify:search:{encoded_query}%20playlist")
    };

    run_open_command(&[&target])?;
    Ok(format!("Opened Spotify search for playlist query: {query}"))
}

fn open_urls(params: &Value) -> Result<String, String> {
    let urls = params
        .get("urls")
        .and_then(Value::as_array)
        .ok_or_else(|| "Open URL requires urls[]".to_string())?;

    if urls.is_empty() {
        return Err("Open URL requires at least one URL".to_string());
    }

    let mut opened = 0usize;
    for entry in urls {
        let url = entry
            .as_str()
            .map(str::trim)
            .filter(|value| !value.is_empty())
            .ok_or_else(|| "Open URL entries must be non-empty strings".to_string())?;

        run_open_command(&[url])?;
        opened += 1;
    }

    Ok(format!("Opened {opened} URL(s)"))
}

fn open_terminal_at_path(params: &Value) -> Result<String, String> {
    let path = params
        .get("path")
        .and_then(Value::as_str)
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .ok_or_else(|| "Open terminal at path requires path".to_string())?;

    let expanded = expand_tilde(path)?;
    let expanded_str = expanded
        .to_str()
        .ok_or_else(|| "Path is not valid UTF-8".to_string())?;

    run_open_command(&["-a", "Terminal", expanded_str])?;
    Ok(format!("Opened Terminal at {}", expanded.display()))
}

fn execute_command(params: &Value) -> Result<String, String> {
    let command = params
        .get("command")
        .and_then(Value::as_str)
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .ok_or_else(|| "Execute command requires command".to_string())?;

    let working_directory = params
        .get("workingDirectory")
        .and_then(Value::as_str)
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .map(expand_tilde)
        .transpose()?;

    let composed_command = if let Some(path) = working_directory {
        let escaped_path = escape_for_shell(path.to_string_lossy().as_ref());
        format!("cd '{}' && {command}", escaped_path)
    } else {
        command.to_string()
    };

    let applescript = format!(
        "tell application \"Terminal\"\nactivate\ndo script \"{}\"\nend tell",
        escape_for_applescript(&composed_command)
    );

    run_command("osascript", &["-e", &applescript])?;
    Ok("Opened Terminal and executed command".to_string())
}

fn open_folder_in_finder(params: &Value) -> Result<String, String> {
    let path = params
        .get("path")
        .and_then(Value::as_str)
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .ok_or_else(|| "Open folder in Finder requires path".to_string())?;

    let expanded = expand_tilde(path)?;
    let expanded_str = expanded
        .to_str()
        .ok_or_else(|| "Path is not valid UTF-8".to_string())?;

    run_open_command(&[expanded_str])?;
    Ok(format!("Opened folder {}", expanded.display()))
}

fn run_open_command(args: &[&str]) -> Result<(), String> {
    run_command("open", args)
}

fn run_command(binary: &str, args: &[&str]) -> Result<(), String> {
    let status = Command::new(binary)
        .args(args)
        .status()
        .map_err(|err| format!("Failed to run {binary}: {err}"))?;

    if status.success() {
        Ok(())
    } else {
        Err(format!(
            "{binary} exited with status {}",
            status.code().unwrap_or(-1)
        ))
    }
}

fn expand_tilde(path: &str) -> Result<PathBuf, String> {
    if path == "~" {
        let home = std::env::var("HOME").map_err(|_| "HOME is not set".to_string())?;
        return Ok(PathBuf::from(home));
    }

    if let Some(rest) = path.strip_prefix("~/") {
        let home = std::env::var("HOME").map_err(|_| "HOME is not set".to_string())?;
        return Ok(PathBuf::from(home).join(rest));
    }

    Ok(PathBuf::from(path))
}

fn escape_for_applescript(text: &str) -> String {
    text.replace('\\', "\\\\").replace('"', "\\\"")
}

fn escape_for_shell(text: &str) -> String {
    text.replace("'", "'\\''")
}

fn encode_for_url_component(text: &str) -> String {
    let mut encoded = String::with_capacity(text.len());
    for ch in text.chars() {
        if ch.is_ascii_alphanumeric() || matches!(ch, '-' | '_' | '.' | '~') {
            encoded.push(ch);
        } else if ch.is_ascii_whitespace() {
            encoded.push_str("%20");
        } else {
            let mut buffer = [0u8; 4];
            for byte in ch.encode_utf8(&mut buffer).as_bytes() {
                encoded.push('%');
                encoded.push_str(&format!("{:02X}", byte));
            }
        }
    }

    encoded
}
