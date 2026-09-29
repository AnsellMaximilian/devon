"use client";

import { Brain, Code2, Plus, Shield } from "lucide-react";
import type { Developer } from "@/lib/game-data";

export function DevCard({ dev, count, compact = false, onClick, selected = false, disabled = false }: {
  dev: Developer; count?: number; compact?: boolean; onClick?: () => void; selected?: boolean; disabled?: boolean;
}) {
  return (
    <button
      className={`dev-card ${compact ? "compact" : ""} ${selected ? "selected" : ""}`}
      style={{ "--accent": dev.accent } as React.CSSProperties}
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
    >
      <div className="card-art"><img src={dev.art} alt={`${dev.name} portrait`} draggable={false} /></div>
      <div className="card-role"><Code2 size={11} /> {dev.role}</div>
      {!compact && <div className="card-info">
        <div className="card-name"><strong>{dev.name}</strong>{typeof count === "number" && <span className="copy-count">×{count}</span>}</div>
        <div className="card-stats">
          <span><Brain size={13} /> {dev.completion}%</span>
          <span><Shield size={13} /> {dev.sanity}</span>
        </div>
        <div className="trait"><b>{dev.traitLabel}</b><small>{dev.trait}</small></div>
      </div>}
      {onClick && !compact && <span className="card-add"><Plus size={14} /></span>}
    </button>
  );
}
