## Context budget

Long sessions get compacted: keep what you learn outside the conversation and keep each result small.

- Notes first: while exploring or reviewing, write each finding (fact, path, size or line, decision) to the change file in `changes/<name>/` as soon as you establish it, not at the end.
- Resume from notes: after a compaction, read that file and continue from it. Do not reread a source already recorded there, nor a file already restored into context.
- Reread only when the source changed since you noted it (check `git status` or the diff), when you need its exact text to edit or quote it, or when a review requires it.
- Small results: for a file over 150 lines or 8 KB, search first and read only the ranges you need; filter or count long command output; do not concatenate several files in one command. The limit applies to each result; independent reads may still share a turn as separate reads.
- Never a shortcut: review of the plan, the diff, and the evidence still covers all of it, in chunks if needed. Run *Verification* as step 5 says, unfiltered. `diagnose` writes no files, so only the small-result rule applies there.
