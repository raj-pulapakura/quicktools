import type { ActionNodeEditorRenderer } from "../types";

export const renderPlaySpotifyPlaylistEditor: ActionNodeEditorRenderer = ({ node, updateNode }) => (
  <>
    <label>
      Playlist query
      <input
        type="text"
        placeholder="RAP"
        value={String(node.params.query ?? "")}
        onChange={(event) => {
          const query = event.target.value;
          updateNode((current) => ({
            ...current,
            params: { ...current.params, query }
          }));
        }}
      />
    </label>

    <label>
      Open in
      <select
        value={String(node.params.openMode ?? "app")}
        onChange={(event) => {
          const openMode = event.target.value === "web" ? "web" : "app";
          updateNode((current) => ({
            ...current,
            params: { ...current.params, openMode }
          }));
        }}
      >
        <option value="app">Spotify app</option>
        <option value="web">Spotify web</option>
      </select>
    </label>
  </>
);
