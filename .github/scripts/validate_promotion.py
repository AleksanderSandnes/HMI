"""Enforce task -> test -> production PR sources, including repository identity."""

import json
import os
from pathlib import Path


def allowed_source(event, repository, production):
    pull_request = event.get("pull_request", {})
    base = pull_request.get("base", {}).get("ref")
    head = pull_request.get("head", {})
    source = head.get("ref", "")
    if head.get("repo", {}).get("full_name") != repository:
        return False
    if base == production:
        return source == "test"
    if base == "test":
        return source == production or (source.startswith("task/") and len(source) > 5)
    return False


if __name__ == "__main__":
    if os.environ["GITHUB_EVENT_NAME"] not in {"pull_request", "pull_request_target"}:
        print("PR source validation runs when proposing a protected-branch merge.")
    else:
        event = json.loads(Path(os.environ["GITHUB_EVENT_PATH"]).read_text())
        if not allowed_source(
            event, os.environ["GITHUB_REPOSITORY"], os.environ["PRODUCTION_BRANCH"]
        ):
            raise SystemExit(
                "Use this repository's task/* -> test -> production workflow."
            )
        print("Pull request source follows the protected-branch workflow.")
