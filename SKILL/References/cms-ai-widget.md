# CMS AI Widget — React Component

This component lives inside the Keystatic CMS admin panel. It provides a sidebar panel for AI content and image generation.

## AIGeneratorPanel.tsx

```tsx
import { useState } from 'react';
import { AVAILABLE_MODELS } from '../../lib/openrouter';

type ContentType = 'blog' | 'panduan';
type ImageStyle = 'line-art' | 'semi-illustrative';

interface GeneratorState {
  model: string;
  prompt: string;
  contentType: ContentType;
  imageStyle: ImageStyle;
  isGeneratingText: boolean;
  isGeneratingImage: boolean;
  generatedText: string;
  generatedImageUrl: string;
  error: string;
}

export function AIGeneratorPanel({
  onInsertContent,
  onInsertImage,
}: {
  onInsertContent: (text: string) => void;
  onInsertImage: (url: string) => void;
}) {
  const [state, setState] = useState<GeneratorState>({
    model: 'anthropic/claude-haiku-4-5',
    prompt: '',
    contentType: 'blog',
    imageStyle: 'semi-illustrative',
    isGeneratingText: false,
    isGeneratingImage: false,
    generatedText: '',
    generatedImageUrl: '',
    error: '',
  });

  const update = (patch: Partial<GeneratorState>) =>
    setState(s => ({ ...s, ...patch }));

  async function handleGenerateText() {
    if (!state.prompt.trim()) return;
    update({ isGeneratingText: true, error: '', generatedText: '' });

    try {
      const res = await fetch('/api/generate-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: state.prompt,
          model: state.model,
          type: state.contentType,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      update({ generatedText: data.content });
    } catch (e) {
      update({ error: String(e) });
    } finally {
      update({ isGeneratingText: false });
    }
  }

  async function handleGenerateImage() {
    if (!state.prompt.trim()) return;
    update({ isGeneratingImage: true, error: '', generatedImageUrl: '' });

    try {
      const res = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: state.prompt,
          style: state.imageStyle,
          uploadToS3: true,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      update({ generatedImageUrl: data.url });
    } catch (e) {
      update({ error: String(e) });
    } finally {
      update({ isGeneratingImage: false });
    }
  }

  return (
    <div style={{
      background: '#F5F0E8',
      border: '1px solid #E6D8B5',
      borderRadius: '12px',
      padding: '20px',
      fontFamily: '"Source Sans 3", sans-serif',
    }}>
      <h3 style={{
        fontFamily: '"Playfair Display", serif',
        color: '#1F3D2B',
        fontSize: '18px',
        marginBottom: '16px',
      }}>
        AI Generator
      </h3>

      {/* Model Selector */}
      <div style={{ marginBottom: '12px' }}>
        <label style={labelStyle}>Model AI</label>
        <select
          value={state.model}
          onChange={e => update({ model: e.target.value })}
          style={selectStyle}
        >
          {AVAILABLE_MODELS.map(m => (
            <option key={m.id} value={m.id}>{m.label}</option>
          ))}
        </select>
      </div>

      {/* Content Type */}
      <div style={{ marginBottom: '12px' }}>
        <label style={labelStyle}>Tipe Konten</label>
        <div style={{ display: 'flex', gap: '8px' }}>
          {(['blog', 'panduan'] as ContentType[]).map(t => (
            <button
              key={t}
              onClick={() => update({ contentType: t })}
              style={{
                ...toggleBtn,
                background: state.contentType === t ? '#1F3D2B' : 'transparent',
                color: state.contentType === t ? '#E6D8B5' : '#5C5F61',
              }}
            >
              {t === 'blog' ? 'Artikel Blog' : 'Panduan Teknis'}
            </button>
          ))}
        </div>
      </div>

      {/* Prompt */}
      <div style={{ marginBottom: '12px' }}>
        <label style={labelStyle}>Topik / Prompt</label>
        <textarea
          value={state.prompt}
          onChange={e => update({ prompt: e.target.value })}
          placeholder="Contoh: cara membuat pompa air tanpa listrik dari bambu..."
          rows={3}
          style={textareaStyle}
        />
      </div>

      {/* Generate Text Button */}
      <button
        onClick={handleGenerateText}
        disabled={state.isGeneratingText || !state.prompt.trim()}
        style={primaryBtn(state.isGeneratingText)}
      >
        {state.isGeneratingText ? 'Membuat konten...' : 'Buat Konten Teks'}
      </button>

      {/* Image Style */}
      <div style={{ marginTop: '16px', marginBottom: '12px' }}>
        <label style={labelStyle}>Gaya Ilustrasi</label>
        <div style={{ display: 'flex', gap: '8px' }}>
          {(['line-art', 'semi-illustrative'] as ImageStyle[]).map(s => (
            <button
              key={s}
              onClick={() => update({ imageStyle: s })}
              style={{
                ...toggleBtn,
                background: state.imageStyle === s ? '#6B4F3A' : 'transparent',
                color: state.imageStyle === s ? '#F5F0E8' : '#5C5F61',
              }}
            >
              {s === 'line-art' ? 'Line Art (Teknis)' : 'Semi-Ilustratif'}
            </button>
          ))}
        </div>
      </div>

      {/* Generate Image Button */}
      <button
        onClick={handleGenerateImage}
        disabled={state.isGeneratingImage || !state.prompt.trim()}
        style={secondaryBtn(state.isGeneratingImage)}
      >
        {state.isGeneratingImage ? 'Membuat gambar (~30 detik)...' : 'Buat Ilustrasi'}
      </button>

      {/* Error */}
      {state.error && (
        <div style={{ marginTop: '12px', color: '#C0392B', fontSize: '13px' }}>
          {state.error}
        </div>
      )}

      {/* Generated Text Preview */}
      {state.generatedText && (
        <div style={{ marginTop: '16px' }}>
          <label style={labelStyle}>Hasil Teks</label>
          <div style={{
            background: 'white',
            border: '1px solid #E6D8B5',
            borderRadius: '8px',
            padding: '12px',
            fontSize: '13px',
            color: '#5C5F61',
            maxHeight: '200px',
            overflowY: 'auto',
            whiteSpace: 'pre-wrap',
            marginBottom: '8px',
          }}>
            {state.generatedText.slice(0, 500)}...
          </div>
          <button
            onClick={() => onInsertContent(state.generatedText)}
            style={insertBtn}
          >
            Sisipkan ke Editor
          </button>
        </div>
      )}

      {/* Generated Image Preview */}
      {state.generatedImageUrl && (
        <div style={{ marginTop: '16px' }}>
          <label style={labelStyle}>Ilustrasi Dihasilkan</label>
          <img
            src={state.generatedImageUrl}
            alt="Generated illustration"
            style={{ width: '100%', borderRadius: '8px', marginBottom: '8px' }}
          />
          <button
            onClick={() => onInsertImage(state.generatedImageUrl)}
            style={insertBtn}
          >
            Gunakan Gambar Ini
          </button>
        </div>
      )}
    </div>
  );
}

// Shared styles
const labelStyle = {
  display: 'block',
  fontSize: '11px',
  fontWeight: '600',
  color: '#5C5F61',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.08em',
  marginBottom: '6px',
};

const selectStyle = {
  width: '100%',
  padding: '8px 12px',
  background: 'white',
  border: '1px solid #E6D8B5',
  borderRadius: '6px',
  fontSize: '13px',
  color: '#1F3D2B',
};

const textareaStyle = {
  width: '100%',
  padding: '10px 12px',
  background: 'white',
  border: '1px solid #E6D8B5',
  borderRadius: '6px',
  fontSize: '13px',
  color: '#1A1208',
  resize: 'vertical' as const,
};

const toggleBtn = {
  padding: '6px 14px',
  border: '1px solid #E6D8B5',
  borderRadius: '999px',
  fontSize: '12px',
  cursor: 'pointer',
  fontFamily: '"Source Sans 3", sans-serif',
};

const primaryBtn = (loading: boolean) => ({
  width: '100%',
  padding: '10px',
  background: loading ? '#6B4F3A' : '#D98C2B',
  color: '#1F3D2B',
  border: 'none',
  borderRadius: '6px',
  fontSize: '13px',
  fontWeight: '600',
  cursor: loading ? 'not-allowed' : 'pointer',
  fontFamily: '"Source Sans 3", sans-serif',
});

const secondaryBtn = (loading: boolean) => ({
  width: '100%',
  padding: '10px',
  background: 'transparent',
  color: loading ? '#9C8060' : '#1F3D2B',
  border: '1px solid #1F3D2B',
  borderRadius: '6px',
  fontSize: '13px',
  fontWeight: '600',
  cursor: loading ? 'not-allowed' : 'pointer',
  fontFamily: '"Source Sans 3", sans-serif',
});

const insertBtn = {
  width: '100%',
  padding: '8px',
  background: '#1F3D2B',
  color: '#E6D8B5',
  border: 'none',
  borderRadius: '6px',
  fontSize: '12px',
  fontWeight: '600',
  cursor: 'pointer',
  fontFamily: '"Source Sans 3", sans-serif',
};
```