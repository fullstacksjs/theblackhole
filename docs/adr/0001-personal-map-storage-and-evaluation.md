---
status: accepted
---

# Derive personal maps from shared concepts and learned progress

Persist shared concepts and links in Convex, with one progress record per learner and learned concept. Derive map conditions through one deterministic evaluator at an explicit time, rather than persisting conditions that become stale as retention decays. This keeps learners' progress independent and lets collection additions affect availability without rewriting personal records.

An absent progress record means unlearned; a record at zero retention XP remains learned and reviewable. Depletion must never delete that record. The Craft is a permanent anchor with no learner progress record.

Store undirected links as canonically ordered endpoint pairs with a collision-safe identity. Enforce link and learner/concept uniqueness through indexed lookups inside the writing transaction, so reversed additions and concurrent creation cannot produce duplicate records.

Keep retention XP, checkpoint time, and review baseline XP distinct. Checkpoint-only rebases and extra practice preserve the baseline, because it measures loss since successful learning or completion of a due-review cycle.

Checkpoint-only rebases retain a `decayOrigin` containing the XP and time at the start of uninterrupted decay. Without it, accumulated floating-point error can leave positive retention at a depletion time when direct evaluation reaches zero, changing planet and link conditions. Evaluate from that origin until a successful reward starts a new decay period. Do not fix this discrepancy by treating tiny positive XP as zero.

Evaluation is read-only and rejects times before the current checkpoint. The decay origin preserves numerical consistency; it does not establish historical map reconstruction. Baseline loss reaching the review threshold also does not record an open due-review cycle. The grading workflow must own cycle completion and duplicate-outcome protection before awarding review rewards.
