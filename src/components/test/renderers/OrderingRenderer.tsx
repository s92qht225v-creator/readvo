'use client';

import { useMemo, type CSSProperties } from 'react';
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type Modifier,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export function OrderingPlayer({ items, value, onChange }: {
  items: { id: string; text: string }[];
  value: { order?: string[] };
  onChange: (v: { order: string[] }) => void;
}) {
  const itemMap = useMemo(() => new Map(items.map(item => [item.id, item])), [items]);
  const initialOrder = useMemo(() => items.map(item => item.id), [items]);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // Render order falls back to the initial order so the list shows even when
  // the user has not interacted yet. We deliberately do NOT push that
  // fallback into `value.order` — leaving it `undefined` keeps `hasAnswer`
  // false in `grade.ts`, so the question navigator doesn't mark the
  // question as answered just because it was viewed.
  const order = value.order && value.order.length === items.length ? value.order : initialOrder;

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const from = order.indexOf(String(active.id));
    const to = order.indexOf(String(over.id));
    if (from < 0 || to < 0) return;
    onChange({ order: arrayMove(order, from, to) });
  };

  return (
    <div className="test-ordering-list">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd} modifiers={[restrictToVerticalAxis]}>
        <SortableContext items={order} strategy={verticalListSortingStrategy}>
          <div className="test-ordering-list__rows">
            {order.map((itemId, i) => (
              <SortableOrderingRow
                key={itemId}
                id={itemId}
                index={i}
                text={itemMap.get(itemId)?.text ?? ''}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      <div className="test-ordering-hint">Drag rows into the correct order.</div>
    </div>
  );
}

function SortableOrderingRow({ id, index, text }: { id: string; index: number; text: string }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  /* Only dnd-kit-driven properties stay inline (per-item transform +
     transition). Visuals (size, padding, badge, hover, dragging
     border/opacity/shadow) live in tq-options.css under --ord-*. */
  const dndStyle: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      className="test-ordering-row"
      data-dragging={isDragging ? 'true' : 'false'}
      style={dndStyle}
      {...attributes}
      {...listeners}
    >
      <span className="test-ordering-row__badge">{index + 1}</span>
      <span className="test-ordering-row__text">{text}</span>
      <span aria-hidden className="test-ordering-row__handle">⋮⋮</span>
    </div>
  );
}

/** Constrain drag motion to the vertical axis so items can't be flung
 *  horizontally off the page (especially noticeable on mobile). */
const restrictToVerticalAxis: Modifier = ({ transform }) => ({
  ...transform,
  x: 0,
});
