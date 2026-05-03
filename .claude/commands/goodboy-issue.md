# goodboy-issue

Track a bug finding or improvement in the goodboy GitHub repository.

Usage: /goodboy-issue [description]

This command:
1. Takes the current finding (bug, UX issue, missing feature, bad quip, etc.)
2. Creates a GitHub issue in jigar-joshi-nirmata/goodboy
3. Appends the finding to the local cross-session log at ~/.goodboy-findings.md

## Instructions

When this command is invoked:

1. Determine the issue title and body from the current context or the user's message.
   - Look at recent code, errors, or conversation to identify what finding to log.
   - If the user provided a description as args, use that as the issue title.
   - Keep titles concise and actionable (< 72 chars).

2. Classify the issue type:
   - `bug` — something broken
   - `enhancement` — improvement to existing behavior
   - `quip` — bad or missing quip (specify persona and signal)
   - `ux` — user experience issue
   - `docs` — documentation gap

3. Create a GitHub issue using the gh CLI:

```bash
gh issue create \
  --repo jigar-joshi-nirmata/goodboy \
  --title "<title>" \
  --body "<body>" \
  --label "<type>"
```

The body should include:
- What the problem is
- Where in the code it lives (file:line if known)
- Suggested fix or approach (if obvious)
- Reproduction steps (if a bug)

4. After creating the issue, append to ~/.goodboy-findings.md:

```
## [<date>] <title>
- **Type**: <type>
- **Issue**: <github_issue_url>
- **Context**: <one line of context>
---
```

5. Report back: show the issue URL and the local log location.

## Error handling

- If `gh` is not authenticated: tell the user to run `gh auth login` and provide the finding as formatted markdown they can paste manually.
- If the issue already exists (duplicate): note it and skip creation.
- Always write to ~/.goodboy-findings.md regardless of GitHub success.

## Example output

```
✓ Issue created: https://github.com/jigar-joshi-nirmata/goodboy/issues/42
✓ Finding logged: ~/.goodboy-findings.md

  goodboy-issue: "Goldie clean_exit quip pool only has 8 entries, should be 10"
  type: quip | file: quips/goldie.json
```

$ARGUMENTS
