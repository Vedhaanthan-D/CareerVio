/** Pure layout helpers for the roadmap canvas — no React, no side effects. */

// ── Fixed node dimensions ──────────────────────────────────────────────────────
// Milestone sized for a comfortable 2-line title at 14px bold.
export const MILESTONE_W = 240;
export const MILESTONE_H = 82;
// Subtopic sized for a 2-line title at 12px.
export const SUBTOPIC_W  = 200;
export const SUBTOPIC_H  = 66;
// Root / domain anchor node.
export const ROOT_W      = 240;
export const ROOT_H      = 72;

// ── Spacing constants ──────────────────────────────────────────────────────────
// Vertical gap from root bottom edge to first milestone top edge.
const ROOT_TO_FIRST_MS  = 56;
// Minimum vertical gap between the bottom of one milestone block and the top of the next.
const MILESTONE_GAP     = 44;
// Horizontal distance from the spine center (x=0) to the center of a subtopic column.
const FAN_X             = 460;
// Vertical gap between consecutive subtopics within one fan column.
const SUBTOPIC_GAP      = 14;

/**
 * Computes the total vertical height consumed by a group of subtopics stacked
 * in a single fan column, including inter-item gaps.
 */
function fanColumnHeight(count) {
  if (count <= 0) return 0;
  return count * SUBTOPIC_H + (count - 1) * SUBTOPIC_GAP;
}

/**
 * Returns the vertical "block height" a milestone occupies on the spine,
 * which is the larger of: the milestone card itself, or the tallest fan column.
 * This is the value that must be reserved before placing the next milestone.
 *
 * @param {number} subtopicCount - total subtopics for this milestone
 * @param {boolean} isExpanded   - whether subtopics are visible
 */
function milestoneBlockHeight(subtopicCount, isExpanded) {
  if (!isExpanded || subtopicCount === 0) return MILESTONE_H;
  // Subtopics split evenly between left and right columns.
  const leftCount  = Math.ceil(subtopicCount / 2);
  const rightCount = subtopicCount - leftCount;
  const tallestFan = Math.max(fanColumnHeight(leftCount), fanColumnHeight(rightCount));
  // The milestone card must be at least as tall as the fan, centered on it.
  return Math.max(MILESTONE_H, tallestFan);
}

/**
 * Builds the vertical-spine node + edge arrays for the current expand/collapse state.
 * All Y positions are computed via accumulated heights — no fixed assumed row size —
 * so nodes never overlap regardless of subtopic count or label length.
 *
 * Layout:
 *   - Root node  : top center, centered at (0, 0)
 *   - Milestones : stacked downward on x=0 spine, connected root→m1→m2→…
 *   - Subtopics  : fan left/right from each expanded milestone, centered on it vertically
 *
 * @param {Array}   raw          - raw nodes from roadmap_json
 * @param {Array}   progress     - progress rows from DB
 * @param {Set}     collapsedSet - milestone IDs whose subtopics are hidden
 * @param {string|null} selectedId  - currently selected node id for highlight
 * @param {Function} onToggle    - called with milestoneId when clicked
 * @param {string}  domainTitle  - domain name shown in the root node
 * @returns {{ flowNodes, flowEdges }}
 */
export function buildLayout(raw, progress, collapsedSet, selectedId, onToggle, domainTitle) {
  if (!raw?.length) return { flowNodes: [], flowEdges: [] };

  const milestones = raw
    .filter((n) => !n.parent)
    .sort((a, b) => a.order - b.order);

  const childrenOf = (id) =>
    raw.filter((n) => n.parent === id).sort((a, b) => a.order - b.order);

  const getStatus = (id) =>
    progress.find((p) => p.node_id === id)?.status ?? 'not_started';

  const spineEdgeColor = (status) =>
    status === 'done' ? '#22c55e55' : status === 'in_progress' ? '#f9731644' : '#2a2a2a';

  const fanEdgeColor = (status) =>
    status === 'done' ? '#22c55e' : status === 'in_progress' ? '#f97316' : '#3a3a3a';

  const flowNodes = [];
  const flowEdges = [];

  // ── Root node centered at canvas origin (0, 0) ────────────────────────────
  flowNodes.push({
    id:       'root',
    type:     'rootNode',
    position: { x: -(ROOT_W / 2), y: -(ROOT_H / 2) },
    data:     { title: domainTitle || 'Learning Roadmap' },
    zIndex:   20,
  });

  // currentY tracks where the TOP of the next milestone block begins.
  // Starts just below the root node's bottom edge.
  let currentY = ROOT_H / 2 + ROOT_TO_FIRST_MS;

  milestones.forEach((m, idx) => {
    const subtopics   = childrenOf(m.id);
    const isExpanded  = !collapsedSet.has(m.id);
    const blockH      = milestoneBlockHeight(subtopics.length, isExpanded);
    const status      = getStatus(m.id);

    // Milestone card is centered vertically within its block.
    const milestoneCenterY = currentY + blockH / 2;

    // ── Place milestone node ────────────────────────────────────────────────
    flowNodes.push(makeMilestoneNode(
      m, 0, milestoneCenterY, status, selectedId, isExpanded, onToggle,
    ));

    // ── Spine edge: root → first milestone, milestone → next milestone ───────
    if (idx === 0) {
      flowEdges.push(makeSpineEdge('root', m.id, 'bottom', 'top', spineEdgeColor(status)));
    } else {
      const prevId = milestones[idx - 1].id;
      flowEdges.push(makeSpineEdge(prevId, m.id, 'bottom', 'top', spineEdgeColor(status)));
    }

    // ── Subtopic fan (only when expanded) ──────────────────────────────────
    if (isExpanded && subtopics.length > 0) {
      const leftCount  = Math.ceil(subtopics.length / 2);
      const leftSubs   = subtopics.slice(0, leftCount);
      const rightSubs  = subtopics.slice(leftCount);

      placeSubtopicColumn(
        leftSubs, -FAN_X, milestoneCenterY, m.id,
        'left', getStatus, fanEdgeColor, flowNodes, flowEdges, selectedId,
      );
      placeSubtopicColumn(
        rightSubs, FAN_X, milestoneCenterY, m.id,
        'right', getStatus, fanEdgeColor, flowNodes, flowEdges, selectedId,
      );
    }

    // Advance the cursor by this block's full height plus the gap to the next block.
    currentY += blockH + MILESTONE_GAP;
  });

  return { flowNodes, flowEdges };
}

// ── Subtopic column placer ─────────────────────────────────────────────────────

/**
 * Places a vertical column of subtopics centered on `anchorY` at horizontal `cx`,
 * and pushes the corresponding fan edges.
 */
function placeSubtopicColumn(
  subs, cx, anchorY, milestoneId,
  side, getStatus, fanEdgeColor, flowNodes, flowEdges, selectedId,
) {
  if (!subs.length) return;
  const totalH    = fanColumnHeight(subs.length);
  const startY    = anchorY - totalH / 2;

  subs.forEach((sub, i) => {
    const subCenterY = startY + i * (SUBTOPIC_H + SUBTOPIC_GAP) + SUBTOPIC_H / 2;
    const subStatus  = getStatus(sub.id);
    const color      = fanEdgeColor(subStatus);

    flowNodes.push(makeSubtopicNode(sub, cx, subCenterY, subStatus, selectedId, side));

    flowEdges.push({
      id:           `fan-${milestoneId}-${sub.id}`,
      source:       milestoneId,
      target:       sub.id,
      sourceHandle: side,
      targetHandle: side === 'left' ? 'right' : 'left',
      type:         'smoothstep',
      animated:     subStatus === 'in_progress',
      style: {
        stroke:          color,
        strokeWidth:     1.5,
        strokeDasharray: '5 4',
      },
    });
  });
}

// ── Node factory helpers ───────────────────────────────────────────────────────

/** Creates a milestone flow node centered at (cx, cy) on the canvas. */
function makeMilestoneNode(raw, cx, cy, status, selectedId, isExpanded, onToggle) {
  return {
    id:       raw.id,
    type:     'milestoneNode',
    position: { x: cx - MILESTONE_W / 2, y: cy - MILESTONE_H / 2 },
    data: {
      title:          raw.title,
      level:          raw.level,
      description:    raw.description,
      subtopics:      raw.subtopics,
      resources:      raw.resources,
      status,
      selected:       selectedId === raw.id,
      expanded:       isExpanded,
      onExpandToggle: () => onToggle(raw.id),
    },
  };
}

/** Creates a subtopic flow node centered at (cx, cy) on the canvas. */
function makeSubtopicNode(raw, cx, cy, status, selectedId, side) {
  return {
    id:       raw.id,
    type:     'subtopicNode',
    position: { x: cx - SUBTOPIC_W / 2, y: cy - SUBTOPIC_H / 2 },
    data: {
      title:       raw.title,
      level:       raw.level,
      description: raw.description,
      subtopics:   raw.subtopics,
      resources:   raw.resources,
      status,
      selected:    selectedId === raw.id,
      side,
    },
  };
}

/** Creates a spine or connector edge between two nodes. */
function makeSpineEdge(sourceId, targetId, sourceHandle, targetHandle, color) {
  return {
    id:            `spine-${sourceId}-${targetId}`,
    source:        sourceId,
    target:        targetId,
    sourceHandle,
    targetHandle,
    type:          'smoothstep',
    style:         { stroke: color, strokeWidth: 2 },
  };
}
