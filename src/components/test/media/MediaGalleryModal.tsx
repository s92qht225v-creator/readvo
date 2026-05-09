'use client';

import { useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import type { QuestionMedia } from '@/lib/test/types';
import type { BuilderQuestion } from '../builderTypes';
import { Field, inputStyle } from '../settings/_shared';
import { setQuestionMedia } from './_helpers';
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

export function MediaGalleryModal({ q, onClose, onChange, onPickMedia, allowedTabs }: {
  q: BuilderQuestion;
  onClose: () => void;
  onChange: (q: BuilderQuestion) => void;
  onPickMedia?: (media: QuestionMedia) => void;
  allowedTabs?: Array<'upload' | 'image' | 'video' | 'icon' | 'gallery'>;
}) {
  const tabs = allowedTabs ?? ['upload', 'image', 'video', 'icon', 'gallery'];
  const [tab, setTab] = useState<'upload' | 'image' | 'video' | 'icon' | 'gallery'>(tabs[0] ?? 'upload');
  const [url, setUrl] = useState('');
  const [alt, setAlt] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const pickMedia = (media: QuestionMedia) => {
    if (onPickMedia) {
      onPickMedia(media);
      return;
    }
    onChange(setQuestionMedia(q, media));
  };

  const attachUrl = async (type: 'image' | 'gif' | 'video', provider: QuestionMedia['provider'] = 'external') => {
    const trimmed = url.trim();
    if (!trimmed) {
      setError('Paste a URL first.');
      return;
    }
    const naturalAspectRatio = type === 'video' ? undefined : await getImageAspectRatio(trimmed);
    pickMedia({
      type,
      url: trimmed,
      alt,
      provider,
      aspectRatio: type === 'video' ? undefined : 'original',
      naturalAspectRatio,
    });
  };

  const upload = async (file: File) => {
    setError(null);
    if (!file.type.startsWith('image/') && file.type !== 'image/gif') {
      setError('Upload JPG, PNG, GIF, or WebP.');
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      setError('File must be 4MB or less.');
      return;
    }
    setUploading(true);
    const form = new FormData();
    form.append('file', file);
    form.append('questionId', q.clientId);
    const response = await fetch('/api/tests/media', {
      method: 'POST',
      body: form,
    });
    const result = await response.json().catch(() => ({}));
    setUploading(false);
    if (!response.ok || !result.url) {
      setError(result.error ?? 'Upload failed.');
      return;
    }
    pickMedia({
      type: file.type === 'image/gif' ? 'gif' : 'image',
      url: result.url,
      alt,
      provider: 'upload',
      aspectRatio: 'original',
      naturalAspectRatio: await getFileImageAspectRatio(file),
    });
  };

  return (
    <div style={modalBackdrop} onMouseDown={onClose}>
      <div style={mediaModal} onMouseDown={e => e.stopPropagation()}>
        <div style={mediaModalHeader}>
          <div style={mediaModalTitle}>Media gallery</div>
          <button type="button" onClick={onClose} style={modalClose}>×</button>
        </div>
        <div style={mediaTabs}>
          {[
            ['upload', 'Upload'],
            ['image', 'Image'],
            ['video', 'Video'],
            ['icon', 'Icon'],
            ['gallery', 'My gallery'],
          ].filter(([id]) => tabs.includes(id as typeof tab)).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id as typeof tab)}
              style={mediaTab(tab === id)}
            >
              {label}
            </button>
          ))}
        </div>

        <div style={mediaModalBody}>
          {tab === 'upload' ? (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={e => {
                e.preventDefault();
                const file = e.dataTransfer.files[0];
                if (file) void upload(file);
              }}
              style={uploadDropzone}
            >
              <input
                ref={inputRef}
                type="file"
                accept="image/png,image/jpeg,image/gif,image/webp"
                hidden
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) void upload(file);
                }}
              />
              <span style={uploadMain}>{uploading ? 'Uploading…' : 'Upload'} or drop an image here</span>
              <span style={uploadSub}>JPG, PNG, or GIF. Up to 4MB.</span>
            </button>
          ) : tab === 'image' ? (
            <MediaUrlForm
              label="Image or GIF URL"
              url={url}
              alt={alt}
              onUrl={setUrl}
              onAlt={setAlt}
              onAttach={() => attachUrl(url.toLowerCase().includes('.gif') ? 'gif' : 'image')}
            />
          ) : tab === 'video' ? (
            <MediaUrlForm
              label="YouTube or Vimeo URL"
              url={url}
              alt={alt}
              onUrl={setUrl}
              onAlt={setAlt}
              onAttach={() => attachUrl('video', videoProvider(url))}
            />
          ) : (
            <div style={comingSoonBox}>
              {tab === 'icon' ? 'Icon library comes later.' : 'Uploaded media gallery comes later.'}
            </div>
          )}
          {error ? <div style={mediaError}>{error}</div> : null}
        </div>
      </div>
    </div>
  );
}

function MediaUrlForm({ label, url, alt, onUrl, onAlt, onAttach }: {
  label: string;
  url: string;
  alt: string;
  onUrl: (value: string) => void;
  onAlt: (value: string) => void;
  onAttach: () => void | Promise<void>;
}) {
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <Field label={label}>
        <input value={url} onChange={e => onUrl(e.target.value)} placeholder="https://…" style={inputStyle} />
      </Field>
      <Field label="Alt text">
        <input value={alt} onChange={e => onAlt(e.target.value)} placeholder="Describe this media" style={inputStyle} />
      </Field>
      <button type="button" onClick={onAttach} style={attachMediaButton}>
        Add media
      </button>
    </div>
  );
}

function getFileImageAspectRatio(file: File): Promise<number | undefined> {
  return new Promise(resolve => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image.naturalWidth && image.naturalHeight ? image.naturalWidth / image.naturalHeight : undefined);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(undefined);
    };
    image.src = url;
  });
}

function getImageAspectRatio(url: string): Promise<number | undefined> {
  return new Promise(resolve => {
    const image = new Image();
    image.onload = () => resolve(image.naturalWidth && image.naturalHeight ? image.naturalWidth / image.naturalHeight : undefined);
    image.onerror = () => resolve(undefined);
    image.src = url;
  });
}

function videoProvider(url: string): QuestionMedia['provider'] {
  try {
    const host = new URL(url).hostname;
    if (host.includes('youtube') || host === 'youtu.be') return 'youtube';
    if (host.includes('vimeo')) return 'vimeo';
  } catch {
    return 'external';
  }
  return 'external';
}

const mediaTabs: CSSProperties = {
  display: 'flex',
  gap: 20,
  padding: '0 16px',
  borderBottom: '1px solid #eee7df',
};

const mediaTab = (active: boolean): CSSProperties => ({
  border: 'none',
  borderBottom: active ? '2px solid #1c1626' : '2px solid transparent',
  background: 'transparent',
  color: active ? '#1c1626' : '#9b949e',
  padding: '15px 0 13px',
  fontSize: 14,
  cursor: 'pointer',
});

const uploadDropzone: CSSProperties = {
  width: '100%',
  minHeight: 388,
  border: '1px dashed #bbb4bd',
  borderRadius: 6,
  background: '#e9e7e9',
  color: '#2f2835',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 9,
  cursor: 'pointer',
  fontFamily: 'inherit',
};

const uploadMain: CSSProperties = {
  fontSize: 16,
  textDecoration: 'underline',
};

const uploadSub: CSSProperties = {
  color: '#6b6470',
  fontSize: 14,
};

const mediaError: CSSProperties = {
  marginTop: 10,
  color: '#b91c1c',
  fontSize: 13,
};
