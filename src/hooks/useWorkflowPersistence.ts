import { invoke } from "@tauri-apps/api/core";
import { useCallback, useEffect, useState } from "react";
import type { Workflow } from "../types/workflow";

interface UseWorkflowPersistenceOptions {
  workflows: Workflow[];
  normalizeWorkflow: (workflow: Workflow) => Workflow;
  onWorkflowsLoaded: (workflows: Workflow[]) => void;
  onStatus: (status: string) => void;
}

interface UseWorkflowPersistenceResult {
  hasLoaded: boolean;
  saveWorkflows: (nextWorkflows: Workflow[], announce?: boolean) => Promise<void>;
}

export const useWorkflowPersistence = ({
  workflows,
  normalizeWorkflow,
  onWorkflowsLoaded,
  onStatus
}: UseWorkflowPersistenceOptions): UseWorkflowPersistenceResult => {
  const [hasLoaded, setHasLoaded] = useState(false);

  const saveWorkflows = useCallback(
    async (nextWorkflows: Workflow[], announce = false) => {
      try {
        await invoke("save_workflows", { workflows: nextWorkflows });
        if (announce) {
          onStatus("Workflows saved.");
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown save error";
        onStatus(`Save failed: ${message}`);
      }
    },
    [onStatus]
  );

  useEffect(() => {
    const load = async () => {
      try {
        const savedWorkflows = await invoke<Workflow[]>("load_workflows");
        const normalizedWorkflows = savedWorkflows.map(normalizeWorkflow);
        onWorkflowsLoaded(normalizedWorkflows);

        if (normalizedWorkflows.length > 0) {
          onStatus("Ready");
        } else {
          onStatus("Ready");
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown load error";
        onStatus(`Failed to load workflows: ${message}`);
        onWorkflowsLoaded([]);
      } finally {
        setHasLoaded(true);
      }
    };

    void load();
  }, [normalizeWorkflow, onStatus, onWorkflowsLoaded]);

  useEffect(() => {
    if (!hasLoaded) {
      return;
    }

    const timer = setTimeout(() => {
      void saveWorkflows(workflows);
    }, 500);

    return () => clearTimeout(timer);
  }, [hasLoaded, saveWorkflows, workflows]);

  return {
    hasLoaded,
    saveWorkflows
  };
};
