import { useEffect, useMemo, useRef } from "react";

const MENU_WIDTH = 220;
const MENU_ITEM_HEIGHT = 38;
const VIEWPORT_MARGIN = 12;

export interface ContextMenuAction {
  id: string;
  label: string;
  tone?: "default" | "danger";
  disabled?: boolean;
  onSelect: () => void;
}

interface ContextMenuModalProps {
  open: boolean;
  x: number;
  y: number;
  actions: ContextMenuAction[];
  onClose: () => void;
  ariaLabel: string;
}

const clampPosition = (x: number, y: number, actionCount: number): { left: number; top: number } => {
  const estimatedHeight = Math.max(1, actionCount) * MENU_ITEM_HEIGHT + 12;
  const maxLeft = Math.max(VIEWPORT_MARGIN, window.innerWidth - MENU_WIDTH - VIEWPORT_MARGIN);
  const maxTop = Math.max(VIEWPORT_MARGIN, window.innerHeight - estimatedHeight - VIEWPORT_MARGIN);

  return {
    left: Math.min(Math.max(x, VIEWPORT_MARGIN), maxLeft),
    top: Math.min(Math.max(y, VIEWPORT_MARGIN), maxTop)
  };
};

export function ContextMenuModal({
  open,
  x,
  y,
  actions,
  onClose,
  ariaLabel
}: ContextMenuModalProps) {
  const menuRef = useRef<HTMLDivElement | null>(null);

  const position = useMemo(() => {
    if (!open) {
      return { left: 0, top: 0 };
    }

    return clampPosition(x, y, actions.length);
  }, [actions.length, open, x, y]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };

    const onMouseDown = (event: MouseEvent) => {
      if (!menuRef.current) {
        return;
      }

      if (!menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onMouseDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onMouseDown);
    };
  }, [onClose, open]);

  if (!open) {
    return null;
  }

  return (
    <div className="context-menu-modal-overlay" aria-hidden={!open}>
      <div
        ref={menuRef}
        className="context-menu-modal"
        role="menu"
        aria-label={ariaLabel}
        style={position}
      >
        {actions.map((action) => (
          <button
            key={action.id}
            type="button"
            role="menuitem"
            className={`context-menu-item ${action.tone === "danger" ? "danger" : ""}`}
            disabled={action.disabled}
            onClick={() => {
              if (action.disabled) {
                return;
              }

              action.onSelect();
            }}
          >
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
}
