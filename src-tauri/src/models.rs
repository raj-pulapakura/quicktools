use serde::{Deserialize, Serialize};
use serde_json::Value;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum NodeType {
    Start,
    Delay,
    OpenApp,
    OpenBrowser,
    OpenUrl,
    OpenTerminalAtPath,
    ExecuteCommand,
    OpenFolderInFinder,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NodePosition {
    pub x: f64,
    pub y: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkflowNode {
    pub id: String,
    #[serde(rename = "type")]
    pub node_type: NodeType,
    #[serde(default)]
    pub params: Value,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub position: Option<NodePosition>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkflowEdge {
    #[serde(rename = "sourceNodeId")]
    pub source_node_id: String,
    #[serde(rename = "targetNodeId")]
    pub target_node_id: String,
    #[serde(
        rename = "sourceHandleId",
        default,
        skip_serializing_if = "Option::is_none"
    )]
    pub source_handle_id: Option<String>,
    #[serde(
        rename = "targetHandleId",
        default,
        skip_serializing_if = "Option::is_none"
    )]
    pub target_handle_id: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Workflow {
    pub id: String,
    pub name: String,
    pub nodes: Vec<WorkflowNode>,
    pub edges: Vec<WorkflowEdge>,
}

#[derive(Debug, Clone, Serialize)]
pub struct NodeExecutionResult {
    #[serde(rename = "nodeId")]
    pub node_id: String,
    #[serde(rename = "nodeType")]
    pub node_type: NodeType,
    pub success: bool,
    pub message: String,
}

#[derive(Debug, Clone, Serialize)]
pub struct RunWorkflowResult {
    #[serde(rename = "workflowId")]
    pub workflow_id: String,
    #[serde(rename = "completedNodes")]
    pub completed_nodes: usize,
    pub results: Vec<NodeExecutionResult>,
}
