import type { ActionNodeType } from "../../../types/workflow";
import type { ActionNodeEditorRenderer } from "./types";
import { renderDelayEditor } from "./editors/delayEditor";
import { renderExecuteCommandEditor } from "./editors/executeCommandEditor";
import { renderOpenAppEditor } from "./editors/openAppEditor";
import { renderOpenBrowserEditor } from "./editors/openBrowserEditor";
import { renderOpenFolderInFinderEditor } from "./editors/openFolderInFinderEditor";
import { renderOpenTerminalAtPathEditor } from "./editors/openTerminalAtPathEditor";
import { renderOpenUrlEditor } from "./editors/openUrlEditor";
import { renderPlaySpotifyPlaylistEditor } from "./editors/playSpotifyPlaylistEditor";

export const actionNodeEditorRenderers: Record<ActionNodeType, ActionNodeEditorRenderer> = {
  delay: renderDelayEditor,
  open_app: renderOpenAppEditor,
  open_browser: renderOpenBrowserEditor,
  open_url: renderOpenUrlEditor,
  open_terminal_at_path: renderOpenTerminalAtPathEditor,
  execute_command: renderExecuteCommandEditor,
  open_folder_in_finder: renderOpenFolderInFinderEditor,
  play_spotify_playlist: renderPlaySpotifyPlaylistEditor,
};
