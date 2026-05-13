'use client';

import { useEffect, useMemo, type CSSProperties } from 'react';
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
import { CSS, type Transform } from '@dnd-kit/utilities';

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

  const order = value.order && value.order.length === items.length ? value.order : initialOrder;

  useEffect(() => {
    if (!value.order || value.order.length !== items.length) {
      onChange({ order: initialOrder });
    }
  }, [initialOrder, items.length, onChange, value.order]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const from = order.indexOf(String(active.id));
    const to = order.indexOf(String(over.id));
    if (from < 0 || to < 0) return;
    onChange({ order: arrayMove(order, from, to) });
  };

  return (
    <div className="test-ordering-list" style={{ display: 'grid', gap: 8 }}>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd} modifiers={[restrictToVerticalAxis]}>
        <SortableContext items={order} strategy={verticalListSortingStrategy}>
          <div style={{ display: 'grid', gap: 8 }}>
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
      <div style={orderingHint}>Drag rows into the correct order.</div>
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

  return (
    <div
      ref={setNodeRef}
      className="test-ordering-row"
      style={orderingRow(isDragging, transform, transition)}
      {...attributes}
      {...listeners}
    >
      <span style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: 22, height: 22, borderRadius: 3,
        background: '#fff', color: '#0445af',
        fontSize: 11, fontWeight: 700,
        border: '1px solid #0445af', flexShrink: 0,
      }}>{index + 1}</span>
      <span style={{ flex: 1 }}>{text}</span>
      <span aria-hidden style={dragHandle}>⋮⋮</span>
    </div>
  );
}

const orderingRow = (
  dragging: boolean,
  transform: Transform | null,
  transition: string | undefined,
): CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '9px 10px',
  background: 'rgba(4, 69, 175, 0.08)',
  color: '#0445af',
  border: dragging ? '1px solid rgba(4, 69, 175, 0.42)' : '1px solid transparent',
  borderRadius: 1,
  cursor: 'grab',
  opacity: dragging ? 0.5 : 1,
  touchAction: 'none',
  transform: CSS.Transform.toString(transform),
  transition,
  boxShadow: dragging ? '0 10px 24px rgba(4,69,175,0.16)' : undefined,
});

const dragHandle: CSSProperties = {
  color: 'rgba(4, 69, 175, 0.45)',
  fontWeight: 900,
  letterSpacing: -2,
  cursor: 'grab',
  padding: '0 2px',
};

const orderingHint: CSSProperties = {
  color: '#64748b',
  fontSize: 13,
  marginTop: 2,
};

/** Constrain drag motion to the vertical axis so items can't be flung
 *  horizontally off the page (especially noticeable on mobile). */
const restrictToVerticalAxis: Modifier = ({ transform }) => ({
  ...transform,
  x: 0,
});
