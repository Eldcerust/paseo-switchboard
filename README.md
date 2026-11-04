# Switchboard

Move a Paseo task to any enabled, available provider and model, including during a running turn. Switchboard uses the Baton handoff patterns and Skills popover patterns as references. It has no runtime dependency on either plugin.

## Local installation

Requires Paseo daemon and app 0.14.0 or newer, authenticated target providers, and a writable agent working directory. Git is optional. From a host with Paseo configured:

```powershell
paseo plugin install "C:\Users\Alvin\.paseo\plugin-sources\paseo-provider-switch"
```

## Use

Open Switch in a top-level agent's composer, choose a provider and model, set effort and mode from the dropdowns pinned above the button, then press Switch now. Models and options come from Paseo at runtime. Disabled, loading, failed and unavailable providers are excluded. A model's default effort is preselected. A source mode is preselected only if the target provider offers the same id; Provider default leaves the mode unset.

Provider sections collapse and expand when you press their headings, which show model counts. The current provider starts expanded. Use the search bar to match provider and model names or ids, including ids containing slashes. Search is case-insensitive, treats punctuation literally, and requires every word to match. Matching providers expand and show matching and total model counts. Clear search to restore your expanded sections. A Selected line above Effort keeps your choice visible when its provider is collapsed or filtered out. Search and expansion state last only while the picker is open.

You can also submit:

```text
/switch <provider>/<model> [effort]
```

The parser splits the first slash only, so nested model ids work. Unknown providers, models and efforts produce an error. Omitting effort selects the model's advertised default. A matching source mode is preserved. Switching within the same provider is supported.

The new agent opens automatically. Its title starts with `[Switch]` and comes from the first line of the original request, up to 60 characters total. The old agent's timeline links to the replacement and the handoff path. The old agent is archived after success.

## Handoff and recovery

Handoffs are stored only in `<agent cwd>/.paseo/switchboard/`, named with the agent id and UTC timestamp. Add that directory to each workspace's ignore rules yourself. Handoffs can contain private conversation text and are not automatically deleted.

The handoff mechanically records the original request, bounded conversation, files touched or inspected, latest plan and task list, failure program names and exit codes, and read-only git facts. No model or external network request generates it. The replacement is told to read the file in full, run `git status`, inspect actual state and avoid repeating finished work. Conversation capture is limited to 2,000 entries and about 60,000 characters, with omissions marked and both ends of long messages kept. Files, plans, task lists and git output also have explicit size limits.

Switchboard verifies the saved file before any destructive action. For a running or initializing source, `archive()` interrupts it, then `refresh()` is polled every 250 ms for up to 15 seconds. Creation happens only after a stopped status is observed. If stop confirmation fails, no replacement is created. An idle source is archived after creation. Avoid prompting the source while switching: the public SDK offers no atomic lock against another client starting a turn.

A creation error names the saved handoff and states whether the original was archived. Archived originals can be restored from the app's archived list. If final archiving fails after creation, the error includes the replacement id so you can open it without creating a duplicate. A failed timeline-row append is logged and does not invalidate a successful switch. Exclusive file creation protects previous handoffs; a retry within the same timestamp second may need to wait for the next second.

## Development

```powershell
npm run typecheck
npm test
```

The full Vitest suite runs the real orchestration, handoff builder, paths, git collection, target catalog and parser. Only the Paseo API is faked; timestamps and polling delays are injected. Temporary test folders and disposable git repositories live under `test/.tmp/` and are removed after each test. Tests do not contact the daemon, create live agents or use target providers.

Client code uses React Native primitives and Paseo's host theme. Shared code contains contracts and plain logic; server code owns filesystem and subprocess access. Paseo bundles the source, so this scaffold has no separate build or lint command. Live app and daemon loading must be verified separately after installation.
