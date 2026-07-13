"use client";

import Image from "next/image";
import { Archive, CheckCircle2, Download } from "lucide-react";
import { updateSocialAssetStatus } from "@/app/cms/social/actions";
import { resolveSocialAssetUrl } from "@/lib/social/social-asset-url";
import type { SocialAsset, SocialAssetType } from "@/types/social";
import type { SocialActionRunner } from "./social-post-editor-types";

interface SocialAssetHistoryProps {
  assets: SocialAsset[];
  type?: SocialAssetType;
  selectedAssetId?: string | null;
  onSelectAsset?: (assetId: string | null) => void;
  runAction: SocialActionRunner;
  compact?: boolean;
}

export function SocialAssetHistory({
  assets,
  type,
  selectedAssetId,
  onSelectAsset,
  runAction,
  compact = false,
}: SocialAssetHistoryProps) {
  const visibleAssets = type ? assets.filter((asset) => asset.asset_type === type) : assets;

  if (visibleAssets.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-4 text-sm font-medium text-gray-400">
        Belum ada asset.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {visibleAssets.map((asset) => {
        const url = resolveSocialAssetUrl(asset.storage_path);
        const selected = selectedAssetId === asset.id;
        return (
          <div key={asset.id} className="grid gap-3 rounded-lg border border-gray-200 bg-white p-2 sm:grid-cols-[88px_1fr_auto]">
            <button
              type="button"
              onClick={() => onSelectAsset?.(asset.id)}
              className={`relative h-20 overflow-hidden rounded-md border bg-gray-100 ${selected ? "border-arkara-amber ring-2 ring-arkara-amber/30" : "border-gray-100"}`}
            >
              {url ? (
                <Image src={url} alt={`Asset v${asset.version}`} fill sizes="88px" className="object-cover" unoptimized />
              ) : null}
            </button>
            <div className="min-w-0 text-xs">
              <div className="flex flex-wrap items-center gap-2 font-black text-gray-700">
                <span>{asset.asset_type} v{asset.version}</span>
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] uppercase text-gray-500">{asset.status}</span>
              </div>
              <div className="mt-1 text-gray-500">
                {asset.aspect_ratio ?? "free"} {asset.width && asset.height ? `- ${asset.width}x${asset.height}` : ""}
              </div>
              <div className="mt-1 truncate font-mono text-[10px] text-gray-400">{asset.storage_path}</div>
              {!compact ? <div className="mt-1 text-gray-400">{new Date(asset.created_at).toLocaleString("id-ID")}</div> : null}
            </div>
            <div className="flex items-center justify-end gap-1">
              {url ? (
                <a
                  href={url}
                  download
                  className="inline-flex rounded-md border border-gray-200 p-2 text-gray-600 hover:bg-gray-50"
                  title="Download"
                >
                  <Download className="h-4 w-4" />
                </a>
              ) : null}
              <button
                type="button"
                onClick={() => runAction(() => updateSocialAssetStatus(asset.id, "approved"))}
                disabled={asset.status === "approved"}
                className="rounded-md border border-green-100 p-2 text-green-700 disabled:opacity-40"
                title="Mark approved"
              >
                <CheckCircle2 className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => runAction(() => updateSocialAssetStatus(asset.id, "archived"))}
                disabled={asset.status === "archived"}
                className="rounded-md border border-gray-200 p-2 text-gray-500 disabled:opacity-40"
                title="Archive"
              >
                <Archive className="h-4 w-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}