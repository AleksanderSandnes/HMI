export function ciReady(runs, required) {
  return required.every((name) => {
    const latest = runs
      .filter((run) => run.name === name && run.event === "push")
      .sort((a, b) => b.id - a.id)[0];
    return latest?.status === "completed" && latest.conclusion === "success";
  });
}
