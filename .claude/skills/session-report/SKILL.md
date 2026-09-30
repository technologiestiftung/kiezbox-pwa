---
name: session-report
description: Write a review report of the changes made in this session to .claude/reports/
disable-model-invocation: true
---

Write a review report for the changes made in this session. $ARGUMENTS

1. Find the baseline: if `.claude/reports/.state/<session-id>.json` exists, diff against its
   `baseline` commit and compare its `untracked` list; otherwise use `git diff HEAD` and
   `git status`. Combine this with what you know from the conversation.
2. Write the report in German to
   `.claude/reports/<YYYY-MM-DD_HHMM>_<branch-with-dashes>_<first 8 chars of session id>.md`.
   Using the session id prefix makes the SessionEnd hook skip its automatic report.
3. Use this format exactly:

   ```markdown
   ---
   session_id: <id>
   date: <YYYY-MM-DDTHH:MM>
   branch: <branch>
   base_commit: <short sha>
   files_changed: <n>
   generated_by: skill
   ai_generated: true
   ---
   # <Titel in einem Satz>

   ## TL;DR
   ## Auftrag
   ## Änderungen            (pro Datei: was und warum)
   ## Entscheidungen        (inkl. verworfener Alternativen)
   ## Verifikation          (ausgeführte Checks + Ergebnis; was nicht geprüft wurde)
   ## Review-Hinweise       (Risiken, Security-/Datenschutz-Stellen, Annahmen)
   ## Offene Punkte
   ## Commit-Vorschlag      (conventional commit im Codeblock)
   ```

4. Do not invent anything. Mark unverified claims as "nicht verifiziert". Leave out secrets
   and personal data.
5. Reply with the file path and the TL;DR only.
