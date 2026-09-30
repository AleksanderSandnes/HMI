import unittest
from validate_promotion import allowed_source


class PromotionSources(unittest.TestCase):
    def event(self, base, head, repository="owner/repo"):
        return {
            "pull_request": {
                "base": {"ref": base},
                "head": {"ref": head, "repo": {"full_name": repository}},
            }
        }

    def test_task_and_release_back_merge_reach_test(self):
        for production in ("main", "master"):
            for source in ("task/securityAudit", production):
                self.assertTrue(
                    allowed_source(self.event("test", source), "owner/repo", production)
                )

    def test_only_test_can_propose_production(self):
        for production in ("main", "master"):
            self.assertTrue(
                allowed_source(self.event(production, "test"), "owner/repo", production)
            )
            for source in (
                "task/securityAudit",
                "test-copy",
                "feat/change",
                production,
            ):
                self.assertFalse(
                    allowed_source(
                        self.event(production, source), "owner/repo", production
                    )
                )

    def test_fork_cannot_borrow_a_trusted_branch_name(self):
        for base, source in (("main", "test"), ("test", "task/securityAudit")):
            self.assertFalse(
                allowed_source(
                    self.event(base, source, "fork/repo"), "owner/repo", "main"
                )
            )

    def test_unknown_empty_and_malformed_sources_fail_closed(self):
        for event in (
            {},
            {"pull_request": {}},
            self.event("other", "test"),
            self.event("test", "task/"),
            self.event("test", "feat/change"),
        ):
            self.assertFalse(allowed_source(event, "owner/repo", "main"))


if __name__ == "__main__":
    unittest.main()
