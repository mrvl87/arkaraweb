"use client";

import type { SocialPostType, SocialVisualSpec } from "@/types/social";
import { getSocialRenderDimensions } from "@/lib/social/render/dimensions";
import { getSocialRenderTemplate } from "@/lib/social/render/template-registry";
import { validateTextBox, validateVisualSpecForTemplate } from "@/lib/social/render/text-validation";

export function getVisualSpecWarnings(spec: SocialVisualSpec | null, postType?: SocialPostType | null) {
  if (!spec) return ["Visual spec belum tersedia."];

  const warnings: string[] = [];
  try {
    const template = getSocialRenderTemplate(spec.template_id, postType);
    warnings.push(...validateVisualSpecForTemplate(spec, template));
    const safe = template.safeZones[spec.aspect_ratio];

    const headline = validateTextBox({
      text: spec.headline,
      boxWidth: safe.text.width,
      boxHeight: spec.aspect_ratio === "1:1" ? 250 : 330,
      fontSize: template.textHierarchy.headline,
      lineHeight: template.textHierarchy.headline + 12,
      maxLines: spec.aspect_ratio === "1:1" ? 3 : 4,
    });
    if (headline) warnings.push(`Headline ${headline}.`);

    if (spec.information_blocks.length < 2) warnings.push("Minimal 2 information block.");
    if (!spec.footer.trim()) warnings.push("Footer wajib diisi.");
    if (!spec.template_id.trim()) warnings.push("Template wajib dipilih.");
    if (!template.supportedAspectRatios.includes(spec.aspect_ratio)) warnings.push("Aspect ratio tidak didukung template.");
  } catch (error) {
    warnings.push(error instanceof Error ? error.message : "Visual spec tidak valid.");
  }

  return warnings;
}

interface SocialVisualPreviewProps {
  spec: SocialVisualSpec | null;
  postType?: SocialPostType | null;
  backgroundUrl?: string;
}

export function SocialVisualPreview({ spec, postType, backgroundUrl }: SocialVisualPreviewProps) {
  if (!spec) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-sm font-medium text-gray-400">
        Visual spec belum tersedia.
      </div>
    );
  }

  const template = getSocialRenderTemplate(spec.template_id, postType);
  const dimensions = getSocialRenderDimensions(spec.aspect_ratio);
  const isChecklist = template.id === "editorial-checklist-v1";
  const isCarousel = template.id === "editorial-carousel-v1";

  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-xs font-bold text-gray-500">
        <span>{dimensions.width} x {dimensions.height}</span>
        <span>{template.id}</span>
      </div>
      <div
        className="overflow-hidden rounded-lg border border-gray-200 bg-[#1A2E1A] shadow-sm"
        style={{ aspectRatio: `${dimensions.width} / ${dimensions.height}` }}
      >
        <div
          className="relative h-full w-full p-[6%] text-[#fffaf0]"
          style={{
            backgroundImage: backgroundUrl
              ? `linear-gradient(90deg, rgba(26,46,26,.92), rgba(26,46,26,.62)), url(${backgroundUrl})`
              : "linear-gradient(135deg, #1A2E1A 0%, #244424 52%, #D4AF37 180%)",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="flex h-full flex-col justify-between gap-4">
            <div className={isCarousel ? "text-center" : "max-w-[78%]"}>
              <div className="mb-3 inline-flex rounded-full border border-[#D4AF37]/70 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[#D4AF37]">
                {spec.label || "LABEL"}
              </div>
              <h3 className="text-balance text-2xl font-black leading-tight sm:text-4xl">
                {spec.headline || "Headline"}
              </h3>
              <p className="mt-3 text-sm font-semibold leading-6 text-[#fffaf0]/85 sm:text-base">
                {spec.subheadline}
              </p>
            </div>

            <div className={isChecklist ? "grid gap-2 sm:grid-cols-2" : "space-y-2"}>
              {spec.information_blocks.slice(0, 6).map((block, index) => (
                <div key={index} className="rounded-md border border-white/12 bg-white/10 p-3 backdrop-blur-sm">
                  <div className="text-xs font-black uppercase tracking-wide text-[#D4AF37]">
                    {block.icon ? `${block.icon} ` : ""}{block.title || `Poin ${index + 1}`}
                  </div>
                  <div className="mt-1 text-sm font-semibold leading-5 text-[#fffaf0]">
                    {block.text}
                  </div>
                </div>
              ))}
            </div>

            <div>
              {spec.emphasis_text ? (
                <div className="mb-3 rounded-md bg-[#D4AF37] px-3 py-2 text-sm font-black text-[#1A2E1A]">
                  {spec.emphasis_text}
                </div>
              ) : null}
              <div className="text-[10px] font-bold uppercase tracking-widest text-[#fffaf0]/75">
                {spec.footer || "ArkaraWeb.com | Survive with Knowledge"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}