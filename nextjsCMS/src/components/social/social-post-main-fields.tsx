"use client";

import { SocialEditorField } from "./social-editor-field";
import type { PostDraft, PostDraftUpdater } from "./social-post-editor-types";

interface SocialPostMainFieldsProps {
  post: PostDraft;
  update: PostDraftUpdater;
  captionValue: string;
}

export function SocialPostMainFields({
  post,
  update,
  captionValue,
}: SocialPostMainFieldsProps) {
  return (
    <>
      <SocialEditorField label="Internal Title">
        <input
          value={post.title}
          onChange={(event) => update("title", event.target.value)}
          className="input-social"
        />
      </SocialEditorField>

      <div className="grid gap-3 lg:grid-cols-2">
        <SocialEditorField label="Hook">
          <textarea
            value={post.hook ?? ""}
            onChange={(event) => update("hook", event.target.value || null)}
            rows={3}
            className="input-social resize-y text-[15px] leading-7"
          />
        </SocialEditorField>
        <SocialEditorField label="CTA">
          <textarea
            value={post.cta ?? ""}
            onChange={(event) => update("cta", event.target.value || null)}
            rows={3}
            className="input-social resize-y text-[15px] leading-7"
          />
        </SocialEditorField>
      </div>

      <SocialEditorField label="Body">
        <textarea
          value={post.body ?? ""}
          onChange={(event) => update("body", event.target.value || null)}
          rows={6}
          className="input-social resize-y text-[15px] leading-7"
        />
      </SocialEditorField>

      <SocialEditorField label="Target URL">
        <input
          value={post.target_url ?? ""}
          onChange={(event) => update("target_url", event.target.value)}
          className="input-social"
        />
      </SocialEditorField>

      <div className="grid gap-3 lg:grid-cols-2">
        <SocialEditorField label="First Comment">
          <textarea
            value={post.first_comment ?? ""}
            onChange={(event) => update("first_comment", event.target.value || null)}
            rows={3}
            className="input-social resize-y text-[15px] leading-7"
          />
        </SocialEditorField>
        <SocialEditorField label="Alt Text">
          <textarea
            value={post.alt_text ?? ""}
            onChange={(event) => update("alt_text", event.target.value || null)}
            rows={3}
            className="input-social resize-y text-[15px] leading-7"
          />
        </SocialEditorField>
      </div>

      <SocialEditorField label="Combined Caption Preview">
        <textarea
          value={captionValue}
          readOnly
          rows={6}
          className="input-social resize-y bg-gray-50 text-[15px] leading-7 text-gray-600"
        />
      </SocialEditorField>
    </>
  );
}