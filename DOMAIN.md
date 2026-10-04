# TheBlackHole

TheBlackHole is a personal space for discovering software engineering concepts and keeping them available for recall. Its planets represent concepts, and their retention determines the condition of the learner's territory.

## Language

### Concepts and territory

**Concept**:
A software engineering idea with prepared material explaining its central meaning, an example, further reading, and a grading rubric.
_Avoid_: Term, card, planet when referring to the learning material

**Prepared collection**:
The set of concepts and relationships supplied for learners to explore.
_Avoid_: Personal collection, deck

**Personal map**:
A learner's territory, including the concepts they have learned and the current retention and connections of their planets.
_Avoid_: Deck, collection when referring to personal progress

**Planet**:
A place in the personal map representing one concept and that learner's retention of it. The Craft is the exceptional planet representing the permanent starting anchor.
_Avoid_: Node, world, card in domain language

**Sector**:
A fixed thematic grouping of concepts in the prepared collection. Sector membership is independent of whether its planets currently connect to one another.
_Avoid_: Cluster, region, lane

**The Craft**:
The permanent starting anchor of the personal map. It is always active and has no concept to learn, retention XP, confidence level, or due reviews.
_Avoid_: Home, root in domain language

**Link**:
An undirected relationship between two planets whose connection can be active or broken. Breaking the connection does not erase the relationship.
_Avoid_: Edge, prerequisite

**Active link**:
A link joining two active planets. An available neighboring concept is an exploration opportunity rather than an already active link.
_Avoid_: Revealed neighbor when referring to an established connection

**Broken link**:
A link whose connection is lost because at least one previously learned endpoint has depleted retention. It can reconnect when both endpoints are active again.
_Avoid_: Deleted relationship, forgotten concept

**Partition**:
A connected part of learned territory, including The Craft where applicable, separated from other parts by broken links. A learned planet with no active links forms an isolated partition.
_Avoid_: Cluster, sector when referring to current connectivity

**Fog**:
The visible encroachment around a planet as its retention declines. Full encroachment marks depletion and broken connections.
_Avoid_: Review deadline, incorrect verdict

### Learning and availability

**Learned planet**:
A concept planet for which the learner has given at least one correct answer. It remains learned even after its retention is depleted or its links break.
_Avoid_: Mastered, active when referring to learning history

**Active planet**:
A learned planet with positive retention XP, or The Craft. An active planet makes its adjacent unlearned concepts available for exploration.
_Avoid_: Learned when referring to current retention

**Charted**:
The map status of a learned concept planet with positive retention XP. A Charted planet can still be due for review.
_Avoid_: Learned when referring to the permanent record, not due

**In reach**:
The map status of an unlearned concept adjacent to at least one active planet. The learner can attempt to learn it.
_Avoid_: Unlocked permanently, learned

**Uncharted**:
The map status of an unlearned concept without an active neighboring planet. It is currently unavailable for exploration.
_Avoid_: Depleted, Fading

**Fading**:
The map status of a learned planet with zero retention XP and broken links. It remains available for review even without an active neighbor.
_Avoid_: Unlearned, incorrect, due when referring only to the review obligation

**Recovery**:
Restoration of positive retention to a Fading planet through a correct review answer. Its connections return wherever the neighboring planet is also active.
_Avoid_: Learning again, reconnecting the whole map

### Retention and review

**Retention XP**:
The current resource belonging to one learner's concept planet, gained through successful learning and review and lost through decay or incorrect due reviews. It determines the planet's confidence level and condition.
_Avoid_: Lifetime XP, global XP, score, confidence alone

**Confidence level**:
A planet's current retention tier, determined by its retention XP. Higher levels decay more slowly, and levels can rise or fall as XP crosses their thresholds.
_Avoid_: Permanent upgrade, grading confidence, confidence alone

**Decay**:
Loss of retention XP as real time passes, including time away from the map. Its rate depends on the planet's current confidence level.
_Avoid_: Incorrect-answer penalty, fixed review schedule

**Review baseline**:
The retention balance immediately after the most recent successful initial learning or completed due-review cycle. Loss relative to this balance determines when the next review becomes due.
_Avoid_: Current balance, lifetime points, last practice balance

**Due**:
A planet's obligation to complete a review after sufficient retention has been lost since its review baseline. Being due does not require depletion or broken links.
_Avoid_: Fading, inactive, incorrect

**Due-review cycle**:
An open review obligation that can include several attempts and ends with one correct answer and one full reward. Incorrect attempts leave the same cycle open.
_Avoid_: Review attempt, review session

**Review attempt**:
One submitted explanation of a concept for a correctness judgment. Multiple attempts can belong to the same learning opportunity or due-review cycle.
_Avoid_: Completed cycle, reward

**Initial learning**:
The opportunity to explain an In reach concept until the learner's first correct answer establishes its planet as learned.
_Avoid_: Recovery, extra practice

**Extra practice**:
A graded attempt on a learned planet outside an open due-review cycle. Correct answers can earn micro XP; incorrect answers do not reduce retention.
_Avoid_: Due review, full-reward cycle

**Micro XP**:
A small, daily-limited retention reward for correct extra practice. It contributes to the planet's existing retention balance without establishing a new review baseline.
_Avoid_: Separate currency, full reward, new review cycle

### Judgment and learning support

**Grading rubric**:
The prepared criteria for whether an explanation expresses a concept's central idea without a material misconception.
_Avoid_: Exact answer string, example requirement

**Correctness verdict**:
A judgment that one submitted explanation is correct or incorrect according to the concept's grading rubric. An unavailable judgment is neither verdict.
_Avoid_: Confidence level, retention score, self-grade

**Grading confidence**:
The grader's reported certainty about its judgment of an answer. It is separate from the learner's retention XP and the planet's confidence level.
_Avoid_: Planet confidence, confidence alone

**Learning opportunity**:
Prepared explanation, an example, and further reading offered after an incorrect answer, with another recall attempt available afterward.
_Avoid_: Reward, automatic correct answer, generated lesson

**Judgment feedback**:
A learner's report about a correctness verdict they believe should be reviewed. The report does not change the verdict, retention balance, or learning history.
_Avoid_: Grade override, self-grading

**Guest demonstration**:
A temporary interactive sample of exploration, review, and retention mechanics. Its progress is separate from a signed-in learner's personal map.
_Avoid_: Anonymous personal account, imported progress
