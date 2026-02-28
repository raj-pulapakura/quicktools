#!/usr/bin/env python3
"""Scaffold a new workflow action node for quicktools."""

from __future__ import annotations

import argparse
import re
import sys
from dataclasses import dataclass
from pathlib import Path

STOPWORDS = {
    "a",
    "an",
    "and",
    "as",
    "at",
    "by",
    "for",
    "from",
    "in",
    "into",
    "is",
    "it",
    "node",
    "of",
    "on",
    "or",
    "the",
    "to",
    "tool",
    "type",
    "workflow",
    "with",
}

ACRONYMS = {
    "api": "API",
    "id": "ID",
    "url": "URL",
    "ui": "UI",
}

MAX_NODE_TYPE_TOKENS = 4


@dataclass
class ScaffoldSpec:
    description: str
    node_type: str
    label: str
    definition_const: str
    definition_file: str
    editor_const: str
    editor_file: str


def repo_root_from_script() -> Path:
    root = Path(__file__).resolve().parents[4]
    if not (root / "src" / "types" / "workflow.ts").exists():
        raise RuntimeError("Unable to locate repository root from script location")
    return root


def to_pascal_case(value: str) -> str:
    parts = [part for part in value.split("_") if part]
    return "".join(part[:1].upper() + part[1:] for part in parts)


def to_title_label(value: str) -> str:
    parts = [part for part in value.split("_") if part]
    normalized = [ACRONYMS.get(part, part.capitalize()) for part in parts]
    return " ".join(normalized)


def sanitize_node_type(value: str) -> str:
    normalized = re.sub(r"[^a-z0-9_]+", "_", value.strip().lower())
    normalized = re.sub(r"_+", "_", normalized).strip("_")
    if not re.fullmatch(r"[a-z][a-z0-9_]*", normalized):
        raise ValueError(
            "Node type must start with a letter and contain only lowercase letters, digits, and underscores"
        )
    if normalized == "start":
        raise ValueError('"start" is reserved and cannot be used as an action node type')
    return normalized


def derive_node_type(description: str) -> str:
    tokens = re.findall(r"[a-z0-9]+", description.lower())
    filtered = [token for token in tokens if token not in STOPWORDS]
    selected = filtered or tokens
    if not selected:
        raise ValueError("Unable to derive node type from empty description")
    return sanitize_node_type("_".join(selected[:MAX_NODE_TYPE_TOKENS]))


def derive_label(node_type: str, explicit_label: str | None) -> str:
    if explicit_label:
        return explicit_label.strip()
    return to_title_label(node_type)


def definition_content(spec: ScaffoldSpec) -> str:
    return f'''import type {{ ActionNodeCoreDefinition }} from "../types";

export const {spec.definition_const}: ActionNodeCoreDefinition<"{spec.node_type}"> = {{
  type: "{spec.node_type}",
  label: "{spec.label}",
  createDefaultParams: () => ({{}}),
  summarize: () => "{spec.label}"
}};
'''


def editor_content(spec: ScaffoldSpec) -> str:
    return f'''import type {{ ActionNodeEditorRenderer }} from "../types";

export const {spec.editor_const}: ActionNodeEditorRenderer = () => (
  <p className="node-editor-hint">No parameters for this node type.</p>
);
'''


def insert_after_last_regex_line(text: str, line_pattern: str, line_to_insert: str) -> str:
    if line_to_insert in text:
        return text

    lines = text.splitlines()
    matches = [index for index, line in enumerate(lines) if re.fullmatch(line_pattern, line)]
    if not matches:
        raise ValueError(f"Unable to locate insertion anchor: {line_pattern}")

    insert_at = matches[-1] + 1
    lines.insert(insert_at, line_to_insert)
    return "\n".join(lines) + "\n"


def insert_in_block(text: str, block_start: str, block_end: str, entry_line: str) -> str:
    start_index = text.find(block_start)
    if start_index < 0:
        raise ValueError(f"Unable to locate block start: {block_start}")

    start_index += len(block_start)
    end_index = text.find(block_end, start_index)
    if end_index < 0:
        raise ValueError(f"Unable to locate block end: {block_end}")

    block_body = text[start_index:end_index]
    if entry_line.strip() in {line.strip() for line in block_body.splitlines()}:
        return text

    block_body = ensure_last_nonempty_line_has_trailing_comma(block_body)

    if block_body and not block_body.endswith("\n"):
        block_body += "\n"

    block_body += entry_line
    return text[:start_index] + block_body + text[end_index:]


def ensure_last_nonempty_line_has_trailing_comma(block_body: str) -> str:
    lines = block_body.splitlines(keepends=True)
    for index in range(len(lines) - 1, -1, -1):
        stripped = lines[index].strip()
        if not stripped:
            continue

        if stripped.endswith(","):
            return "".join(lines)

        if lines[index].endswith("\n"):
            lines[index] = lines[index].rstrip("\n") + ",\n"
        else:
            lines[index] = lines[index] + ","
        return "".join(lines)

    return block_body


def add_node_type_literal(workflow_types_text: str, node_type: str) -> str:
    if f'"{node_type}"' in workflow_types_text:
        return workflow_types_text

    lines = workflow_types_text.splitlines()
    try:
        start_index = next(i for i, line in enumerate(lines) if line.startswith("export type NodeType ="))
    except StopIteration as error:
        raise ValueError("Unable to locate NodeType union in src/types/workflow.ts") from error

    for index in range(start_index + 1, len(lines)):
        line = lines[index].rstrip()
        if line.endswith('";'):
            lines[index] = line[:-1]
            lines.insert(index + 1, f'  | "{node_type}";')
            return "\n".join(lines) + "\n"

    raise ValueError("Unable to locate end of NodeType union in src/types/workflow.ts")


def ensure_node_type_is_new(workflow_types_text: str, node_type: str) -> None:
    if f'"{node_type}"' in workflow_types_text:
        raise ValueError(f'Node type "{node_type}" already exists in src/types/workflow.ts')


def build_spec(args: argparse.Namespace) -> ScaffoldSpec:
    node_type = sanitize_node_type(args.type) if args.type else derive_node_type(args.description)
    label = derive_label(node_type, args.label)

    pascal_name = to_pascal_case(node_type)
    camel_name = pascal_name[:1].lower() + pascal_name[1:]

    return ScaffoldSpec(
        description=args.description,
        node_type=node_type,
        label=label,
        definition_const=f"{camel_name}Definition",
        definition_file=f"{camel_name}Definition.ts",
        editor_const=f"render{pascal_name}Editor",
        editor_file=f"{camel_name}Editor.tsx",
    )


def write_text(path: Path, content: str, dry_run: bool) -> None:
    if dry_run:
        print(f"[dry-run] write {path}")
        return
    path.write_text(content, encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser(description="Scaffold a new workflow action node")
    parser.add_argument("--description", required=True, help="Human description of the node")
    parser.add_argument("--type", help="Node type in snake_case (optional override)")
    parser.add_argument("--label", help="UI label (optional override)")
    parser.add_argument("--dry-run", action="store_true", help="Print planned writes without modifying files")
    args = parser.parse_args()

    try:
        spec = build_spec(args)
        root = repo_root_from_script()

        workflow_types_path = root / "src" / "types" / "workflow.ts"
        core_registry_path = root / "src" / "features" / "workflow" / "nodes" / "coreRegistry.ts"
        editor_registry_path = root / "src" / "features" / "workflow" / "nodes" / "editorRegistry.ts"
        definition_path = (
            root / "src" / "features" / "workflow" / "nodes" / "definitions" / spec.definition_file
        )
        editor_path = root / "src" / "features" / "workflow" / "nodes" / "editors" / spec.editor_file

        if definition_path.exists() or editor_path.exists():
            raise ValueError("Generated node files already exist; choose a different --type")

        workflow_types_text = workflow_types_path.read_text(encoding="utf-8")
        ensure_node_type_is_new(workflow_types_text, spec.node_type)

        core_registry_text = core_registry_path.read_text(encoding="utf-8")
        editor_registry_text = editor_registry_path.read_text(encoding="utf-8")

        workflow_types_updated = add_node_type_literal(workflow_types_text, spec.node_type)

        core_registry_updated = insert_after_last_regex_line(
            core_registry_text,
            r'import \{ [A-Za-z0-9]+Definition \} from "\./definitions/[A-Za-z0-9]+Definition";',
            f'import {{ {spec.definition_const} }} from "./definitions/{spec.definition_const}";',
        )
        core_registry_updated = insert_in_block(
            core_registry_updated,
            "export const ACTION_NODE_TYPES = [\n",
            "] as const satisfies readonly ActionNodeType[];",
            f'  "{spec.node_type}",\n',
        )
        core_registry_updated = insert_in_block(
            core_registry_updated,
            "const actionNodeCoreDefinitions = [\n",
            "] as const satisfies readonly ActionNodeCoreDefinition[];",
            f"  {spec.definition_const},\n",
        )

        editor_registry_updated = insert_after_last_regex_line(
            editor_registry_text,
            r'import \{ render[A-Za-z0-9]+Editor \} from "\./editors/[A-Za-z0-9]+Editor";',
            f'import {{ {spec.editor_const} }} from "./editors/{spec.editor_file[:-4]}";',
        )
        editor_registry_updated = insert_in_block(
            editor_registry_updated,
            "export const actionNodeEditorRenderers: Record<ActionNodeType, ActionNodeEditorRenderer> = {\n",
            "};",
            f"  {spec.node_type}: {spec.editor_const},\n",
        )

        print(f"Scaffolding node type: {spec.node_type}")
        print(f"Label: {spec.label}")
        print(f"Definition: {definition_path.relative_to(root)}")
        print(f"Editor: {editor_path.relative_to(root)}")

        write_text(definition_path, definition_content(spec), args.dry_run)
        write_text(editor_path, editor_content(spec), args.dry_run)
        write_text(workflow_types_path, workflow_types_updated, args.dry_run)
        write_text(core_registry_path, core_registry_updated, args.dry_run)
        write_text(editor_registry_path, editor_registry_updated, args.dry_run)

        print("\nNext steps:")
        print("1. Implement params/defaults/summary in the new definition file.")
        print("2. Replace placeholder UI in the new editor file.")
        print("3. Run npm run check:node-registry")
        print("4. Run npm run build")
        print("5. Run npm run check:canvas-interaction")
        return 0
    except Exception as error:  # pylint: disable=broad-except
        print(f"[error] {error}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
