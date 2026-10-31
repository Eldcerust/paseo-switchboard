## What it is

Switchboard moves a Paseo task to a fresh agent on the provider and model you choose. It works with idle agents and can interrupt a running turn.

## How it works

Open the Switch pill on a top-level agent. The picker groups Paseo's enabled, available models into collapsible provider sections. The current provider starts expanded; press a provider heading to collapse or expand its models. The search bar matches provider and model names and ids without regard to case, and every search word must match. Search expands matching providers and shows matching and total model counts. Clearing search restores your expanded sections. The selected model stays visible above its effort and mode options, even when its section is collapsed or filtered out.

Choose a model to review its effort options and the provider's modes. The model's default effort is selected. A matching source mode is kept; otherwise the target provider's default applies. Press Switch now to save a handoff, stop a running source, and open the replacement in the same workspace. The original is always archived after success and can be restored from Paseo's archived list.

The agent composer also accepts `/switch <provider>/<model> [effort]`. Model ids may contain slashes.

## Setup

The daemon and app need Paseo 0.14.0 or newer. Configure and authenticate target providers in Paseo. The daemon needs write access to the agent's working directory. Git is optional; when available, its branch, status and recent commit titles are captured. Baton and Skills are independent plugins and are not required at runtime. There are no plugin settings.

## Data

The daemon reads the source snapshot, conversation timeline, provider catalog and read-only git facts. It writes a mechanical conversation summary and excerpts, files touched or inspected, latest plan and tasks, and failure program names and exit codes to `<agent cwd>/.paseo/switchboard/<agentId>-<UTC timestamp>.md`. Raw tool output and full command lines are excluded. Conversation text can still contain private information. Keep `.paseo/switchboard/` out of version control in each workspace; the plugin does not edit its ignore rules or remove handoffs automatically.

No model call or network request is made to build the handoff. The plugin uses Paseo's connection to request the replacement agent, which runs through the chosen provider. A reference to the handoff is saved in the old agent's timeline.

## Limits

Switching creates a new agent; provider session state, unsaved reasoning and pending permissions do not transfer. Capture is limited to about 2,000 timeline entries and 60,000 characters of conversation. Long messages retain their beginning and end. Omitted history and compaction are marked. For long histories, the oldest page and recent history are kept; gaps remain unknown.

The handoff is verified before archiving or creating an agent. A running or initializing source is archived and polled for up to 15 seconds before creation. If stopping cannot be confirmed, creation is cancelled and the error names the handoff. A creation failure also reports whether the original was archived. Interrupted commands may have left partial changes, so the replacement is told to inspect the real repository before acting. Paseo's public SDK cannot atomically lock the source against another user starting a turn during switching; avoid sending it another prompt while a switch is pending.
