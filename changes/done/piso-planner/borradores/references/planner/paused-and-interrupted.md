# Paused and interrupted builder

   - **`PAUSED`** (the plan is `status: partial`): select one of its options or fix the problem, set it to `status: approved` again, and relaunch. A vague `PAUSED` does not count as a repeated block: relaunch once with a narrower segment. After two `PAUSED` returns for the same cause, offer to execute it yourself and wait for the user's answer. If the model level is the cause, suggest raising `agents.builder.level` (do not edit `models.json`).
   - After a deadline interruption, clean up only Docker resources belonging to this project's `verify`; never run `docker system prune`, which would remove resources from other projects.
   - After `PAUSED` or interruption, do not trust checkboxes: reconstruct state with `git status` and `git diff --stat` in each `repos:` folder and record it in *Notes* before relaunching.
