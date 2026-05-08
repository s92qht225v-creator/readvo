'use client';

import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import type { QuestionMedia } from '@/lib/test/types';
import type { BuilderQuestion } from '../builderTypes';
import { getQuestionMedia, setQuestionMedia } from './_helpers';
import {
  attachMediaButton,
  comingSoonBox,
  mediaModal,
  mediaModalBody,
  mediaModalHeader,
  mediaModalTitle,
  modalBackdrop,
  modalClose,
} from './_styles';

export function MediaSettingsModal({ q, onClose, onChange }: {
  q: BuilderQuestion;
  onClose: () => void;
  onChange: (q: BuilderQuestion) => void;
}) {
  const media = getQuestionMedia(q);
  const [draft, setDraft] = useState<QuestionMedia>(() => normalizeMediaDraft(media ?? { type: 'image', url: '' }));
  const [activeTab, setActiveTab] = useState<'crop' | 'adjustments'>('crop');

  const save = () => {
    if (!media?.url) {
      onClose();
      return;
    }
    onChange(setQuestionMedia(q, {
      ...media,
      aspectRatio: draft.aspectRatio ?? 'original',
      crop: usesCrop(draft.aspectRatio) ? draft.crop : undefined,
      rotation: draft.rotation ?? 0,
      flipX: !!draft.flipX,
      flipY: !!draft.flipY,
    }));
  };

  return (
    <div style={modalBackdrop} onMouseDown={onClose}>
      <div style={mediaModal} onMouseDown={e => e.stopPropagation()}>
        <div style={mediaModalHeader}>
          <div style={mediaModalTitle}>Image editor</div>
          <button type="button" onClick={onClose} style={modalClose}>×</button>
        </div>
        {media?.url && media.type !== 'video' ? (
          <div style={editorTabs}>
            <button type="button" onClick={() => setActiveTab('crop')} style={editorTab(activeTab === 'crop')}>Crop</button>
            <button type="button" onClick={() => setActiveTab('adjustments')} style={editorTab(activeTab === 'adjustments')}>Adjustments</button>
          </div>
        ) : null}
        <div style={mediaModalBody}>
          {!media?.url ? (
            <div style={comingSoonBox}>No media attached.</div>
          ) : media.type === 'video' ? (
            <div style={comingSoonBox}>Video settings come later.</div>
          ) : (
            <div style={{ display: 'grid', gap: 14 }}>
              {activeTab === 'crop' ? (
                <>
                  <div style={aspectRatioRow}>
                    <div style={aspectRatioLabel}>Aspect ratio</div>
                    <AspectRatioDropdown
                      value={draft.aspectRatio ?? 'original'}
                      onChange={e => {
                        const aspectRatio = e;
                        setDraft({
                          ...draft,
                          aspectRatio,
                          crop: usesCrop(aspectRatio) ? cropForAspect(aspectRatio, draft.crop) : undefined,
                        });
                      }}
                    />
                  </div>

                  <MediaCropPreview
                    media={media}
                    draft={draft}
                    onChange={setDraft}
                  />
                </>
              ) : (
                <MediaAdjustmentPreview
                  media={media}
                  draft={draft}
                  onChange={setDraft}
                />
              )}

              <div style={modalActions}>
                <button type="button" onClick={() => setDraft(normalizeMediaDraft(media))} style={secondaryModalButton}>Reset</button>
                <button type="button" onClick={save} style={attachMediaButton}>Save</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const MEDIA_ASPECT_OPTIONS: Array<{ value: NonNullable<QuestionMedia['aspectRatio']>; label: string }> = [
  { value: 'free', label: 'Free' },
  { value: 'original', label: 'Original' },
  { value: 'portrait', label: 'Portrait' },
  { value: 'square', label: 'Square' },
  { value: 'landscape', label: 'Landscape' },
  { value: 'circle', label: 'Circle' },
];

function AspectRatioDropdown({ value, onChange }: {
  value: NonNullable<QuestionMedia['aspectRatio']>;
  onChange: (value: NonNullable<QuestionMedia['aspectRatio']>) => void;
}) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const selected = MEDIA_ASPECT_OPTIONS.find(option => option.value === value) ?? MEDIA_ASPECT_OPTIONS[0];

  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => {
      if (dropdownRef.current?.contains(event.target as Node)) return;
      setOpen(false);
    };
    window.addEventListener('pointerdown', close);
    return () => window.removeEventListener('pointerdown', close);
  }, [open]);

  return (
    <div ref={dropdownRef} style={aspectDropdownWrap}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen(v => !v)}
        style={aspectDropdownButton(open)}
      >
        <span>{selected.label}</span>
        <span style={aspectDropdownChevron}>⌄</span>
      </button>
      {open ? (
        <div style={aspectDropdownMenu}>
          <ul role="listbox" style={aspectDropdownList}>
            {MEDIA_ASPECT_OPTIONS.map(option => (
              <li
                key={option.value}
                role="option"
                aria-selected={option.value === value}
                onPointerDown={event => {
                  event.preventDefault();
                  onChange(option.value);
                  setOpen(false);
                }}
                style={aspectDropdownItem(option.value === value)}
              >
                {option.label}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function normalizeMediaDraft(media: QuestionMedia): QuestionMedia {
  const aspectRatio = normalizeAspectRatio(media.aspectRatio);
  return {
    ...media,
    aspectRatio,
    crop: usesCrop(aspectRatio) ? cropForAspect(aspectRatio, media.crop) : undefined,
  };
}

function normalizeAspectRatio(value: QuestionMedia['aspectRatio']): NonNullable<QuestionMedia['aspectRatio']> {
  if (value === '1:1') return 'square';
  if (value === '16:9' || value === '4:3') return 'landscape';
  if (value === '3:4') return 'portrait';
  return value ?? 'free';
}

function usesCrop(value: QuestionMedia['aspectRatio']) {
  return value === 'free' || value === 'portrait' || value === 'square' || value === 'landscape' || value === 'circle';
}

function cropForAspect(value: QuestionMedia['aspectRatio'], existing?: QuestionMedia['crop']): NonNullable<QuestionMedia['crop']> {
  if (existing) {
    const ratio = cropAspectRatio(value);
    return ratio ? clampFixedRatioCrop(existing, ratio) : clampCrop(existing);
  }

  const ratio = cropAspectRatio(value) ?? 1;

  if (value === 'free') {
    return { x: 8, y: 0, width: 84, height: 100 };
  }

  const maxWidth = 74;
  const maxHeight = 74;
  let width = maxWidth;
  let height = width / ratio;
  if (height > maxHeight) {
    height = maxHeight;
    width = height * ratio;
  }
  return {
    x: (100 - width) / 2,
    y: (100 - height) / 2,
    width,
    height,
  };
}

function cropAspectRatio(value: QuestionMedia['aspectRatio']): number | null {
  if (value === 'portrait') return 3 / 4;
  if (value === 'landscape') return 16 / 9;
  if (value === 'square' || value === 'circle') return 1;
  return null;
}

function clampCrop(crop: QuestionMedia['crop'], minSize = 18): NonNullable<QuestionMedia['crop']> {
  const width = clamp(crop?.width ?? 64, minSize, 100);
  const height = clamp(crop?.height ?? 64, minSize, 100);
  return {
    x: clamp(crop?.x ?? 18, 0, 100 - width),
    y: clamp(crop?.y ?? 14, 0, 100 - height),
    width,
    height,
  };
}

function clampFixedRatioCrop(crop: QuestionMedia['crop'], ratio: number, minSize = 18): NonNullable<QuestionMedia['crop']> {
  const rawWidth = clamp(crop?.width ?? 64, minSize, 100);
  const rawHeight = clamp(crop?.height ?? 64, minSize, 100);
  let width = rawWidth;
  let height = width / ratio;

  if (height > rawHeight) {
    height = rawHeight;
    width = height * ratio;
  }
  if (width > 100) {
    width = 100;
    height = width / ratio;
  }
  if (height > 100) {
    height = 100;
    width = height * ratio;
  }

  width = clamp(width, minSize, 100);
  height = clamp(height, minSize, 100);

  return {
    x: clamp(crop?.x ?? 18, 0, 100 - width),
    y: clamp(crop?.y ?? 14, 0, 100 - height),
    width,
    height,
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function MediaCropPreview({ media, draft, onChange }: {
  media: QuestionMedia;
  draft: QuestionMedia;
  onChange: (next: QuestionMedia) => void;
}) {
  const frameRef = useRef<HTMLDivElement | null>(null);
  const [frameRatio, setFrameRatio] = useState(16 / 9);
  const crop = usesCrop(draft.aspectRatio) ? cropForAspect(draft.aspectRatio, draft.crop) : undefined;
  const cropRatio = cropAspectRatio(draft.aspectRatio);
  const transform = `rotate(${draft.rotation ?? 0}deg) scaleX(${draft.flipX ? -1 : 1}) scaleY(${draft.flipY ? -1 : 1})`;
  const imageBounds = getContainedImageBounds(media.naturalAspectRatio, frameRatio);
  const visibleCrop = crop ? cropToFrame(crop, imageBounds) : undefined;

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const update = () => {
      const rect = frame.getBoundingClientRect();
      if (rect.width && rect.height) setFrameRatio(rect.width / rect.height);
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);

  const updateFreeCrop = (nextCrop: QuestionMedia['crop']) => {
    onChange({
      ...draft,
      crop: cropRatio
        ? clampFixedRatioCrop(nextCrop, cropRatio)
        : clampCrop(nextCrop, draft.aspectRatio === 'free' ? 8 : 18),
    });
  };

  const startDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!crop) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    const frame = frameRef.current;
    if (!frame) return;
    const rect = frame.getBoundingClientRect();
    const startX = event.clientX;
    const startY = event.clientY;
    const startCrop = crop;
    const imagePixelWidth = rect.width * (imageBounds.width / 100);
    const imagePixelHeight = rect.height * (imageBounds.height / 100);

    const onPointerMove = (moveEvent: PointerEvent) => {
      const dx = ((moveEvent.clientX - startX) / imagePixelWidth) * 100;
      const dy = ((moveEvent.clientY - startY) / imagePixelHeight) * 100;
      updateFreeCrop({
        ...startCrop,
        x: startCrop.x + dx,
        y: startCrop.y + dy,
      });
    };
    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp, { once: true });
  };

  const startResize = (event: React.PointerEvent<HTMLDivElement>, direction: ResizeDirection) => {
    if (!crop) return;
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    const frame = frameRef.current;
    if (!frame) return;
    const rect = frame.getBoundingClientRect();
    const startX = event.clientX;
    const startY = event.clientY;
    const startCrop = crop;
    const imagePixelWidth = rect.width * (imageBounds.width / 100);
    const imagePixelHeight = rect.height * (imageBounds.height / 100);

    const onPointerMove = (moveEvent: PointerEvent) => {
      const dx = ((moveEvent.clientX - startX) / imagePixelWidth) * 100;
      const dy = ((moveEvent.clientY - startY) / imagePixelHeight) * 100;
      updateFreeCrop(cropRatio
        ? resizeFixedRatioCrop(startCrop, direction, dx, dy, cropRatio)
        : resizeCrop(startCrop, direction, dx, dy));
    };
    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp, { once: true });
  };

  if (!crop) {
    return (
      <div style={settingsPreviewFrame}>
        <img
          src={media.url}
          alt={media.alt || ''}
          style={{ ...settingsPreviewImage, transform }}
        />
      </div>
    );
  }

  return (
    <div ref={frameRef} style={cropPreviewFrame}>
      <img
        src={media.url}
        alt={media.alt || ''}
        style={{ ...cropPreviewImage, transform }}
      />
      <div
        onPointerDown={startDrag}
        style={{
          ...cropSelection,
          left: `${visibleCrop?.x ?? 0}%`,
          top: `${visibleCrop?.y ?? 0}%`,
          width: `${visibleCrop?.width ?? 0}%`,
          height: `${visibleCrop?.height ?? 0}%`,
          borderRadius: draft.aspectRatio === 'circle' ? '50%' : 0,
          cursor: 'grab',
        }}
      >
        <>
          {CROP_EDGE_BARS.map(bar => (
            <div
              key={bar.direction}
              onPointerDown={e => startResize(e, bar.direction)}
              style={{
                ...cropEdgeBar,
                ...bar.style,
                cursor: bar.cursor,
              }}
            />
          ))}
          {CROP_DRAG_HANDLES.map(handle => (
            <div
              key={handle.direction}
              onPointerDown={e => startResize(e, handle.direction)}
              style={{
                ...cropDragHandle,
                ...handle.style,
                cursor: handle.cursor,
              }}
            >
              <span style={cropHandleDot(handle.dot)} />
            </div>
          ))}
        </>
      </div>
    </div>
  );
}

function MediaAdjustmentPreview({ media, draft, onChange }: {
  media: QuestionMedia;
  draft: QuestionMedia;
  onChange: (next: QuestionMedia) => void;
}) {
  const transform = `rotate(${draft.rotation ?? 0}deg) scaleX(${draft.flipX ? -1 : 1}) scaleY(${draft.flipY ? -1 : 1})`;
  const rotate = (delta: -90 | 90) => {
    const next = (((draft.rotation ?? 0) + delta + 360) % 360) as QuestionMedia['rotation'];
    onChange({ ...draft, rotation: next });
  };

  return (
    <>
      <div style={settingsPreviewFrame}>
        <img
          src={media.url}
          alt={media.alt || ''}
          style={{ ...settingsPreviewImage, transform }}
        />
      </div>

      <div style={adjustmentControls} aria-label="Image adjustments">
        <button type="button" style={adjustmentIconButton(false)} onClick={() => rotate(-90)} aria-label="Rotate left" title="Rotate left">
          <RotateLeftIcon />
        </button>
        <button type="button" style={adjustmentIconButton(false)} onClick={() => rotate(90)} aria-label="Rotate right" title="Rotate right">
          <RotateRightIcon />
        </button>
        <button
          type="button"
          style={adjustmentIconButton(!!draft.flipX)}
          onClick={() => onChange({ ...draft, flipX: !draft.flipX })}
          aria-label="Flip horizontal"
          title="Flip horizontal"
        >
          <FlipHorizontalIcon />
        </button>
        <button
          type="button"
          style={adjustmentIconButton(!!draft.flipY)}
          onClick={() => onChange({ ...draft, flipY: !draft.flipY })}
          aria-label="Flip vertical"
          title="Flip vertical"
        >
          <FlipVerticalIcon />
        </button>
      </div>
    </>
  );
}

function RotateLeftIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path fill="#898989" d="M0.48722 8.66478C1.20692 8.44428 1.97732 8.74921 2.32162 9.38883C3.24162 11.0999 5.00169 12.1245 6.92359 12.0549C9.55073 11.9779 11.75 9.77776 11.8257 7.15061C11.8659 5.77339 11.3589 4.46966 10.3977 3.48005C9.43524 2.48957 8.14726 1.94401 6.77134 1.94401C5.37618 1.94401 4.0672 2.51232 3.11432 3.51724C3.83927 3.54349 4.42113 4.14154 4.42113 4.87303V5.0874H0.13672V0.803034H0.35112C1.09922 0.803034 1.70782 1.41159 1.70782 2.1597V2.1772C3.93289 -0.1682 7.45514 -0.692316 10.298 0.965344C12.1801 2.06301 13.4584 3.99367 13.7183 6.13038C13.9615 8.13147 13.3394 10.1387 12.0112 11.6375C10.6812 13.139 8.77112 14 6.77134 14C3.77802 14 1.11672 12.0912 0.149019 9.25014L0.000219345 8.81134L0.48722 8.66478Z"/>
    </svg>
  );
}

function RotateRightIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path fill="#898989" d="M13.2828 8.66478C12.5631 8.44428 11.7927 8.74921 11.4484 9.38883C10.5284 11.0999 8.76833 12.1245 6.84643 12.0549C4.21929 11.9779 2.02001 9.77776 1.94432 7.15061C1.90408 5.77339 2.41113 4.46966 3.3723 3.48005C4.33478 2.48957 5.62276 1.94401 6.99868 1.94401C8.39384 1.94401 9.70282 2.51232 10.6557 3.51724C9.93075 3.54349 9.34889 4.14154 9.34889 4.87303V5.0874H13.6333V0.803034H13.4189C12.6708 0.803034 12.0622 1.41159 12.0622 2.1597V2.1772C9.83713 -0.1682 6.31488 -0.692316 3.47205 0.965344C1.58996 2.06301 0.311602 3.99367 0.0517318 6.13038C-0.191514 8.13147 0.4306 10.1387 1.75883 11.6375C3.08881 13.139 4.9989 14 6.99868 14C9.992 14 12.6533 12.0912 13.621 9.25014L13.7698 8.81134L13.2828 8.66478Z"/>
    </svg>
  );
}

function FlipHorizontalIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="19" height="19" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path fillRule="evenodd" clipRule="evenodd" fill="#141C24" fillOpacity="0.87" d="M15.9872 6.79548C16.0479 6.47748 15.8799 6.17081 15.5852 6.04948L0.918526 0.0494803C0.713192 -0.0345197 0.479192 -0.0105197 0.294525 0.11348C0.110525 0.236814 -0.000141163 0.444814 -0.000141173 0.666814L-0.000141435 6.66681C-0.000141451 7.03481 0.297858 7.33348 0.666525 7.33348L15.3332 7.33348C15.6519 7.33348 15.9259 7.10815 15.9872 6.79548Z"/>
      <path fillRule="evenodd" clipRule="evenodd" fill="#141C24" fillOpacity="0.6" d="M0.91881 15.9505L15.5855 9.9505C15.8801 9.82984 16.0488 9.5225 15.9875 9.2045C15.9261 8.89184 15.6521 8.6665 15.3335 8.6665L0.66681 8.6665C0.298143 8.6665 0.000143038 8.9645 0.000143022 9.33317L0.00014276 15.3332C0.00014275 15.5552 0.110809 15.7632 0.294809 15.8865C0.479476 16.0105 0.713477 16.0345 0.91881 15.9505Z"/>
    </svg>
  );
}

function FlipVerticalIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="19" height="19" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path fillRule="evenodd" clipRule="evenodd" fill="#141C24" fillOpacity="0.87" d="M6.79548 0.012809C6.47748 -0.0478576 6.17081 0.120142 6.04948 0.414809L0.049481 15.0815C-0.034519 15.2868 -0.010519 15.5208 0.113481 15.7055C0.236814 15.8895 0.444814 16.0001 0.666814 16.0001H6.66681C7.03481 16.0001 7.33348 15.7021 7.33348 15.3335L7.33348 0.666809C7.33348 0.348142 7.10815 0.0741424 6.79548 0.012809Z"/>
      <path fillRule="evenodd" clipRule="evenodd" fill="#141C24" fillOpacity="0.6" d="M15.9505 15.0812L9.9505 0.414525C9.82984 0.119858 9.5225 -0.0488083 9.2045 0.0125251C8.89184 0.0738584 8.6665 0.347858 8.6665 0.666525L8.6665 15.3332C8.6665 15.7019 8.9645 15.9999 9.33317 15.9999L15.3332 15.9999C15.5552 15.9999 15.7632 15.8892 15.8865 15.7052C16.0105 15.5205 16.0345 15.2865 15.9505 15.0812Z"/>
    </svg>
  );
}

type ResizeDirection =
  | 'top'
  | 'right'
  | 'bottom'
  | 'left'
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right';

const CROP_DRAG_HANDLES: Array<{
  direction: ResizeDirection;
  style: CSSProperties;
  dot: CSSProperties;
  cursor: CSSProperties['cursor'];
}> = [
  { direction: 'top-left', style: { left: -29, top: -29 }, dot: { left: 26, top: 26 }, cursor: 'nw-resize' },
  { direction: 'top', style: { left: '50%', top: -29, transform: 'translateX(-50%)' }, dot: { left: 26, top: 26 }, cursor: 'n-resize' },
  { direction: 'top-right', style: { right: -29, top: -29 }, dot: { right: 26, top: 26 }, cursor: 'ne-resize' },
  { direction: 'right', style: { right: -29, top: '50%', transform: 'translateY(-50%)' }, dot: { right: 26, top: 26 }, cursor: 'e-resize' },
  { direction: 'bottom-right', style: { right: -29, bottom: -29 }, dot: { right: 26, bottom: 26 }, cursor: 'se-resize' },
  { direction: 'bottom', style: { left: '50%', bottom: -29, transform: 'translateX(-50%)' }, dot: { left: 26, bottom: 26 }, cursor: 's-resize' },
  { direction: 'bottom-left', style: { left: -29, bottom: -29 }, dot: { left: 26, bottom: 26 }, cursor: 'sw-resize' },
  { direction: 'left', style: { left: -29, top: '50%', transform: 'translateY(-50%)' }, dot: { left: 26, top: 26 }, cursor: 'w-resize' },
];

const CROP_EDGE_BARS: Array<{
  direction: ResizeDirection;
  style: CSSProperties;
  cursor: CSSProperties['cursor'];
}> = [
  { direction: 'top', style: { left: 0, top: -5, right: 0, height: 10 }, cursor: 'n-resize' },
  { direction: 'right', style: { right: -5, top: 0, bottom: 0, width: 10 }, cursor: 'e-resize' },
  { direction: 'bottom', style: { left: 0, bottom: -5, right: 0, height: 10 }, cursor: 's-resize' },
  { direction: 'left', style: { left: -5, top: 0, bottom: 0, width: 10 }, cursor: 'w-resize' },
];

function resizeCrop(crop: NonNullable<QuestionMedia['crop']>, direction: ResizeDirection, dx: number, dy: number): QuestionMedia['crop'] {
  let { x, y, width, height } = crop;

  if (direction.includes('left')) {
    x += dx;
    width -= dx;
  }
  if (direction.includes('right')) {
    width += dx;
  }
  if (direction.includes('top')) {
    y += dy;
    height -= dy;
  }
  if (direction.includes('bottom')) {
    height += dy;
  }

  return { x, y, width, height };
}

function resizeFixedRatioCrop(
  crop: NonNullable<QuestionMedia['crop']>,
  direction: ResizeDirection,
  dx: number,
  dy: number,
  ratio: number
): QuestionMedia['crop'] {
  const horizontalDelta = direction.includes('left') ? -dx
    : direction.includes('right') ? dx
      : 0;
  const verticalDelta = direction.includes('top') ? -dy
    : direction.includes('bottom') ? dy
      : 0;
  const widthFromVertical = verticalDelta * ratio;
  const widthDelta = Math.abs(widthFromVertical) > Math.abs(horizontalDelta)
    ? widthFromVertical
    : horizontalDelta;
  const nextWidth = crop.width + widthDelta;
  const nextHeight = nextWidth / ratio;

  let x = crop.x;
  let y = crop.y;
  if (direction.includes('left')) x = crop.x + (crop.width - nextWidth);
  if (direction.includes('top')) y = crop.y + (crop.height - nextHeight);
  if (direction === 'top' || direction === 'bottom') x = crop.x + (crop.width - nextWidth) / 2;
  if (direction === 'left' || direction === 'right') y = crop.y + (crop.height - nextHeight) / 2;

  return { x, y, width: nextWidth, height: nextHeight };
}

function getContainedImageBounds(naturalAspectRatio: number | undefined, frameRatio: number) {
  const imageRatio = naturalAspectRatio && Number.isFinite(naturalAspectRatio) && naturalAspectRatio > 0
    ? naturalAspectRatio
    : frameRatio;

  if (imageRatio > frameRatio) {
    const height = (frameRatio / imageRatio) * 100;
    return { x: 0, y: (100 - height) / 2, width: 100, height };
  }

  const width = (imageRatio / frameRatio) * 100;
  return { x: (100 - width) / 2, y: 0, width, height: 100 };
}

function cropToFrame(crop: NonNullable<QuestionMedia['crop']>, bounds: ReturnType<typeof getContainedImageBounds>) {
  return {
    x: bounds.x + (crop.x / 100) * bounds.width,
    y: bounds.y + (crop.y / 100) * bounds.height,
    width: (crop.width / 100) * bounds.width,
    height: (crop.height / 100) * bounds.height,
  };
}

const editorTabs: CSSProperties = {
  display: 'flex',
  gap: 20,
  padding: '0 16px',
  borderBottom: '1px solid #eee7df',
};

const editorTab = (active: boolean): CSSProperties => ({
  border: 'none',
  borderBottom: active ? '2px solid #1c1626' : '2px solid transparent',
  background: 'transparent',
  color: active ? '#1c1626' : '#8b848f',
  padding: '14px 0 12px',
  fontSize: 14,
  fontWeight: active ? 500 : 400,
  cursor: active ? 'default' : 'not-allowed',
});

const aspectRatioRow: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 16,
};

const aspectRatioLabel: CSSProperties = {
  color: '#2f2835',
  fontSize: 14,
};

const aspectDropdownWrap: CSSProperties = {
  position: 'relative',
  width: 128,
};

const aspectDropdownButton = (open: boolean): CSSProperties => ({
  width: 128,
  height: 34,
  border: '1px solid #ded8d1',
  borderColor: open ? '#bbbbbb' : '#ded8d1',
  borderRadius: open ? '4px 4px 0 0' : 4,
  background: '#fff',
  color: '#2f2835',
  padding: '0 10px 0 11px',
  fontSize: 14,
  fontFamily: 'inherit',
  outline: 'none',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
});

const aspectDropdownChevron: CSSProperties = {
  color: '#6b6470',
  fontSize: 18,
  lineHeight: 1,
  marginTop: -2,
};

const aspectDropdownMenu: CSSProperties = {
  position: 'absolute',
  top: 33,
  right: 0,
  zIndex: 2100,
  width: 128,
  background: '#fff',
  border: '1px solid #bbbbbb',
  borderTop: 'none',
  borderRadius: '0 0 4px 4px',
  boxShadow: 'rgba(0,0,0,0.08) 0 2px 4px, rgba(0,0,0,0.06) 0 2px 12px',
};

const aspectDropdownList: CSSProperties = {
  width: 126,
  margin: 0,
  padding: 0,
  listStyle: 'none',
};

const aspectDropdownItem = (active: boolean): CSSProperties => ({
  display: 'block',
  height: 32,
  lineHeight: '32px',
  padding: '0 11px',
  fontSize: 14,
  color: '#262627',
  fontWeight: 400,
  background: active ? '#e3e3e3' : '#ffffff',
  cursor: 'pointer',
  listStyle: 'none',
});

const settingsPreviewFrame: CSSProperties = {
  height: 180,
  borderRadius: 7,
  overflow: 'hidden',
  background: '#f1efec',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const settingsPreviewImage: CSSProperties = {
  width: '100%',
  height: '100%',
  objectFit: 'contain',
  transition: 'transform 160ms ease',
};

const cropPreviewFrame: CSSProperties = {
  position: 'relative',
  height: 222,
  borderRadius: 4,
  overflow: 'hidden',
  background: '#f1f1f1',
  userSelect: 'none',
  touchAction: 'none',
};

const cropPreviewImage: CSSProperties = {
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
  objectFit: 'contain',
  transformOrigin: 'center',
  transition: 'transform 160ms ease',
};

const cropSelection: CSSProperties = {
  position: 'absolute',
  overflow: 'visible',
  border: '2px solid rgb(4, 135, 175)',
  boxSizing: 'border-box',
  boxShadow: 'rgba(255,255,255,0.8) 0 0 0 139986px',
};

const cropEdgeBar: CSSProperties = {
  position: 'absolute',
  background: 'transparent',
  zIndex: 3,
};

const cropDragHandle: CSSProperties = {
  position: 'absolute',
  width: 58,
  height: 58,
  background: 'transparent',
  zIndex: 4,
};

const cropHandleDot = (position: CSSProperties): CSSProperties => ({
  position: 'absolute',
  width: 7,
  height: 7,
  borderRadius: '50%',
  background: 'rgb(4, 135, 175)',
  boxShadow: '0 0 0 1px rgba(255,255,255,0.75)',
  ...position,
});

const adjustmentControls: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 10,
};

const adjustmentIconButton = (active: boolean): CSSProperties => ({
  width: 42,
  height: 42,
  border: active ? '1px solid #1c1626' : '1px solid #ded8d1',
  borderRadius: 11,
  background: active ? '#f1efec' : '#ffffff',
  color: '#1c1626',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  boxShadow: active ? 'inset 0 0 0 1px rgba(28, 22, 38, 0.05)' : 'none',
});

const modalActions: CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: 8,
};

const secondaryModalButton: CSSProperties = {
  border: '1px solid #ded8d1',
  background: '#fff',
  color: '#4f4655',
  borderRadius: 7,
  padding: '10px 14px',
  fontWeight: 850,
  cursor: 'pointer',
};
