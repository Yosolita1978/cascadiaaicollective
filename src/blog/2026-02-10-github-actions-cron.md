---
title: "I Didn't Need AI. I Needed a Cron Job (So I Used GitHub Actions)"
date: 2026-02-10
author: "Cascadia AI Collective"
summary: "If you need something to run every week and you're tired of being the scheduler… Use GitHub Actions."
featuredImage: "/images/blog/github-actions-cron.png"
featuredImageAlt: "GitHub Actions workflow running on a schedule"
featuredImageCaption: ""
---

If you need something to run **every week** and you're tired of being the scheduler…

Use **GitHub Actions**.

You'll create one YAML file. Add a cron line. Push. Done.

No server. No "remember to run it." Just automation.

## The Fix: a scheduled workflow (copy/paste)

Create this file in your repo:

```text
.github/workflows/cron.yml
```

Paste this:

```yaml
name: Weekly automation

on:
  schedule:
    # Every Monday at 09:00 UTC (cron runs in UTC)
    - cron: "0 9 * * 1"

  # Bonus: run it manually from the Actions tab
  workflow_dispatch:

jobs:
  run-task:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repo
        uses: actions/checkout@v4

      - name: Run a command
        run: |
          echo "Hello from a scheduled workflow"
          # Replace this with your real script/command
```

That's the core idea: cron triggers a workflow, the workflow runs your steps.

## Apply it: run a real script (Node example)

I like keeping the logic outside YAML, so my workflow stays tiny.

Repo layout:

```text
scripts/
  weekly-task.js
.github/
  workflows/
    cron.yml
```

Update the workflow:

```yaml
name: Weekly automation

on:
  schedule:
    - cron: "0 9 * * 1"
  workflow_dispatch:

jobs:
  run-task:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repo
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: "20"

      - name: Install deps
        run: npm ci

      - name: Run script
        run: node scripts/weekly-task.js
```

## Why this works

- **schedule** runs on a timer (cron).
- **workflow_dispatch** gives you a "Run workflow" button for testing.
- The runner checks out your code and executes your commands in a clean environment.

## Cron in 20 seconds (so you don't surprise yourself)

Cron format:

```text
minute hour day-of-month month day-of-week
```

Examples:

- Daily at 09:00 UTC → `0 9 * * *`
- Mondays at 09:00 UTC → `0 9 * * 1`
- Every 15 minutes → `*/15 * * * *`

One important detail: **cron is UTC in GitHub Actions.**

So if you care about "9am my time," you'll need to convert it (and DST will mess with you a little). My solution: choose a time where an hour shift won't ruin your life.

## Tiny but important: secrets don't go in YAML

Even if your script is simple today, it'll eventually call something.

Don't hardcode tokens. Use repo secrets:

1. Repo → Settings → Secrets and variables → Actions
2. Add `API_TOKEN`

Then:

```yaml
      - name: Run script
        env:
          API_TOKEN: ${{ secrets.API_TOKEN }}
        run: node scripts/weekly-task.js
```

## Make failures obvious (future-you will thank you)

Silent failures are the worst kind of "automation."

This tiny pattern helps:

```yaml
      - name: Run and fail loudly
        run: |
          set -e
          node scripts/weekly-task.js
          echo "Job finished"
```

If it errors, the workflow run turns red and you'll see it in the Actions tab.

## Now the story (because yes, this is why I did it)

I love AI tools.

I really do.

But this time the project didn't need intelligence. It needed **consistency**.

I had this tiny task that took maybe 2–5 minutes. Nothing dramatic. Just repetitive. The kind of thing you can totally do manually…

…until you forget once.

Then twice.

Then it becomes that background guilt you carry around like a cursed keychain.

I almost did the classic moves:

- "I'll set a reminder" (lol)
- "I'll run cron locally" (also valid, but now my laptop is part of production?)

What I wanted was: no server, no extra service, no babysitting.

So I did the boring thing that works: a scheduled GitHub Action.

And it's honestly the best kind of automation: the kind you forget exists because it just keeps showing up on time.

## Wrap-up

If you only take a few things from this:

1. Create `.github/workflows/cron.yml`
2. Use `on.schedule.cron` for the timer
3. Add `workflow_dispatch` so you can test manually
4. Keep logic in a script, keep YAML simple
5. Put tokens in secrets, not in the file

Have you used GitHub Actions for cron stuff yet—and what's the first "2-minute task" you'd love to delete from your life?
