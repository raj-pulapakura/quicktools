mod executor;
mod models;
mod storage;

use models::{RunWorkflowResult, Workflow};

#[tauri::command]
fn load_workflows() -> Result<Vec<Workflow>, String> {
    storage::load_workflows()
}

#[tauri::command]
fn save_workflows(workflows: Vec<Workflow>) -> Result<(), String> {
    storage::save_workflows(&workflows)
}

#[tauri::command]
async fn run_workflow(workflow: Workflow) -> Result<RunWorkflowResult, String> {
    executor::run_workflow(workflow).await
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            load_workflows,
            save_workflows,
            run_workflow
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

fn main() {
    run();
}
