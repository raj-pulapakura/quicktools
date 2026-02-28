import {
  ACTION_NODE_TYPES,
  createDefaultParamsForType,
  getActionNodeCoreDefinition,
  listActionNodeCoreDefinitions,
  summarizeNode,
  withNodeTypeDefaults
} from "../src/features/workflow/nodes/coreRegistry";

const assert = (condition: unknown, message: string) => {
  if (!condition) {
    throw new Error(message);
  }
};

const assertEqual = (actual: unknown, expected: unknown, message: string) => {
  if (actual !== expected) {
    throw new Error(`${message}: expected ${String(expected)}, received ${String(actual)}`);
  }
};

const assertDeepEqual = (actual: unknown, expected: unknown, message: string) => {
  const actualJson = JSON.stringify(actual);
  const expectedJson = JSON.stringify(expected);
  if (actualJson !== expectedJson) {
    throw new Error(`${message}: expected ${expectedJson}, received ${actualJson}`);
  }
};

const run = () => {
  const definitions = listActionNodeCoreDefinitions();
  assertEqual(definitions.length, ACTION_NODE_TYPES.length, "Unexpected definition count");

  for (const nodeType of ACTION_NODE_TYPES) {
    const definition = getActionNodeCoreDefinition(nodeType);
    assertEqual(definition.type, nodeType, "Definition type mismatch");
    assert(definition.label.length > 0, "Definition label should not be empty");
  }

  assertDeepEqual(createDefaultParamsForType("start"), {}, "START defaults mismatch");
  assertDeepEqual(
    createDefaultParamsForType("delay"),
    { milliseconds: 1000 },
    "Delay defaults mismatch"
  );
  assertDeepEqual(
    createDefaultParamsForType("open_url"),
    { urls: ["https://"] },
    "Open URL defaults mismatch"
  );

  assertEqual(
    summarizeNode({
      id: "n-url",
      type: "open_url",
      params: { urls: ["https://example.com", "https://openai.com"] }
    }),
    "https://example.com +1",
    "Open URL summary mismatch"
  );

  assertEqual(
    summarizeNode({ id: "n-start", type: "start", params: {} }),
    "Workflow entry point",
    "START summary mismatch"
  );

  const switchedNode = withNodeTypeDefaults(
    {
      id: "n-switch",
      type: "execute_command",
      params: { command: "npm run dev", workingDirectory: "~/projects/work" }
    },
    "delay"
  );

  assertEqual(switchedNode.type, "delay", "Node type reset mismatch");
  assertDeepEqual(switchedNode.params, { milliseconds: 1000 }, "Node params reset mismatch");
};

run();
console.log("Node registry checks passed.");
