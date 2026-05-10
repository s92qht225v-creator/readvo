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

type MediaGalleryTab = 'upload' | 'video' | 'audio' | 'gallery';

export function MediaGalleryModal({ q, onClose, onChange, onPickMedia, allowedTabs }: {
  q: BuilderQuestion;
  onClose: () => void;
  onChange: (q: BuilderQuestion) => void;
  onPickMedia?: (media: QuestionMedia) => void;
  allowedTabs?: MediaGalleryTab[];
}) {
  const tabs = allowedTabs ?? ['upload', 'video', 'audio', 'gallery'];
  const [tab, setTab] = useState<MediaGalleryTab>(tabs[0] ?? 'upload');
  const [url, setUrl] = useState('');
  const [alt, setAlt] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const audioInputRef = useRef<HTMLInputElement | null>(null);

  const pickMedia = (media: QuestionMedia) => {
    if (onPickMedia) {
      onPickMedia(media);
      return;
    }
    onChange(setQuestionMedia(q, media));
  };

  const attachUrl = async (type: 'video', provider: QuestionMedia['provider'] = 'external') => {
    const trimmed = url.trim();
    if (!trimmed) {
      setError('Paste a URL first.');
      return;
    }
    pickMedia({
      type,
      url: trimmed,
      alt,
      provider,
    });
  };

  const upload = async (file: File, expectedType?: 'audio') => {
    setError(null);
    if (expectedType === 'audio' && !file.type.startsWith('audio/')) {
      setError('Upload MP3, WAV, OGG, M4A, AAC, or WebM audio.');
      return;
    }
    if (!file.type.startsWith('image/') && !file.type.startsWith('audio/')) {
      setError('Upload JPG, PNG, GIF, WebP, MP3, WAV, OGG, M4A, or WebM.');
      return;
    }
    const maxSize = file.type.startsWith('audio/') ? 20 * 1024 * 1024 : 4 * 1024 * 1024;
    if (file.size > maxSize) {
      setError(file.type.startsWith('audio/') ? 'Audio file must be 20MB or less.' : 'Image file must be 4MB or less.');
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
    const type: QuestionMedia['type'] = file.type.startsWith('audio/')
      ? 'audio'
      : file.type === 'image/gif' ? 'gif' : 'image';
    pickMedia({
      type,
      url: result.url,
      alt,
      provider: 'upload',
      aspectRatio: type === 'audio' ? undefined : 'original',
      naturalAspectRatio: type === 'audio' ? undefined : await getFileImageAspectRatio(file),
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
            ['video', 'Video'],
            ['audio', 'Audio'],
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
                accept="image/png,image/jpeg,image/gif,image/webp,audio/mpeg,audio/mp3,audio/wav,audio/wave,audio/x-wav,audio/mp4,audio/aac,audio/ogg,audio/webm"
                hidden
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) void upload(file);
                }}
              />
              <span style={uploadMain}>{uploading ? 'Uploading…' : 'Upload'} or drop a file here</span>
              <span style={uploadSub}>Images up to 4MB. Audio up to 20MB.</span>
            </button>
          ) : tab === 'video' ? (
            <MediaUrlForm
              label="YouTube or Vimeo URL"
              url={url}
              alt={alt}
              onUrl={setUrl}
              onAlt={setAlt}
              onAttach={() => attachUrl('video', videoProvider(url))}
            />
          ) : tab === 'audio' ? (
            <button
              type="button"
              onClick={() => audioInputRef.current?.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={e => {
                e.preventDefault();
                const file = e.dataTransfer.files[0];
                if (file) void upload(file, 'audio');
              }}
              style={uploadDropzone}
            >
              <input
                ref={audioInputRef}
                type="file"
                accept="audio/mpeg,audio/mp3,audio/wav,audio/wave,audio/x-wav,audio/mp4,audio/aac,audio/ogg,audio/webm"
                hidden
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) void upload(file, 'audio');
                }}
              />
              <span style={uploadMain}>{uploading ? 'Uploading…' : 'Upload'} or drop an audio file here</span>
              <span style={uploadSub}>MP3, WAV, OGG, M4A, AAC, or WebM. Up to 20MB.</span>
            </button>
          ) : (
            <div style={comingSoonBox}>
              Uploaded media gallery comes later.
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
