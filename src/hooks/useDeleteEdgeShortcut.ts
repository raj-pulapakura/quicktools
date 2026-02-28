import { useEffect } from "react";
import { isEditableElement } from "../features/workflow/model";

interface UseDeleteEdgeShortcutOptions {
  canvasInteractive: boolean;
  selectedEdgeId: string | null;
  onDeleteSelectedEdge: () => void;
}

export const useDeleteEdgeShortcut = ({
  canvasInteractive,
  selectedEdgeId,
  onDeleteSelectedEdge
}: UseDeleteEdgeShortcutOptions) => {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!canvasInteractive || !selectedEdgeId) {
        return;
      }

      if (event.key !== "Delete" && event.key !== "Backspace") {
        return;
      }

      if (isEditableElement(event.target)) {
        return;
      }

      event.preventDefault();
      onDeleteSelectedEdge();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [canvasInteractive, onDeleteSelectedEdge, selectedEdgeId]);
};
