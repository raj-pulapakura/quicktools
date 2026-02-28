import type { ActionNodeCoreDefinition } from "../types";

export const playSpotifyPlaylistDefinition: ActionNodeCoreDefinition<"play_spotify_playlist"> = {
  type: "play_spotify_playlist",
  label: "Play Spotify Playlist",
  createDefaultParams: () => ({
    query: "RAP",
    openMode: "app"
  }),
  summarize: (node) => {
    const query = String(node.params.query ?? "").trim() || "(set playlist query)";
    const openMode = String(node.params.openMode ?? "app").toLowerCase();
    const modeLabel = openMode === "web" ? "web" : "app";
    return `${query} (${modeLabel})`;
  }
};
