import React, { useState } from 'react';
import { ShieldAlert, Lock, AlertTriangle, FlaskConical, Ban, X, Plus, Check } from 'lucide-react';

export type SafetyTagType = 'DANGER' | 'LOTO' | 'TEST' | 'OUT_OF_SERVICE';

export interface AppliedSafetyTag {
  id: string; // e.g. 'TAG-101'
  equipmentId: string; // e.g. '52-1', '89-1A'
  type: SafetyTagType;
  label: string;
  appliedBy: string;
  appliedAt: string;
  workOrder?: string;
}

export const TAG_DEFINITIONS: Record<SafetyTagType, {
  label: string;
  shortLabel: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: typeof ShieldAlert;
  description: string;
}> = {
  DANGER: {
    label: 'DANGER: MEN WORKING ON LINE',
    shortLabel: 'DANGER: MEN WORKING',
    color: '#f43f5e',
    bgColor: 'bg-rose-950/80',
    borderColor: 'border-rose-500',
    icon: ShieldAlert,
    description: 'Prohibits any switching action. Line grounded or active crew present.',
  },
  LOTO: {
    label: 'DO NOT OPERATE (LOTO PERMIT)',
    shortLabel: 'LOTO LOCKED',
    color: '#f59e0b',
    bgColor: 'bg-amber-950/80',
    borderColor: 'border-amber-500',
    icon: Lock,
    description: 'Active Lockout/Tagout permit locked out. Remote operation disabled.',
  },
  TEST: {
    label: 'TEST IN PROGRESS (RELAY / HV)',
    shortLabel: 'TESTING',
    color: '#06b6d4',
    bgColor: 'bg-cyan-950/80',
    borderColor: 'border-cyan-500',
    icon: FlaskConical,
    description: 'Secondary injection or dielectric testing underway.',
  },
  OUT_OF_SERVICE: {
    label: 'OUT OF SERVICE (DECOMMISSIONED)',
    shortLabel: 'OUT OF SVC',
    color: '#a855f7',
    bgColor: 'bg-purple-950/80',
    borderColor: 'border-purple-500',
    icon: Ban,
    description: 'Asset decommissioned or isolated for major overhaul.',
  },
};

interface SldSafetyTagBarProps {
  selectedEquipmentId: string;
  activeTags: AppliedSafetyTag[];
  onApplyTag: (tag: Omit<AppliedSafetyTag, 'id' | 'appliedAt'>) => void;
  onRemoveTag: (tagId: string) => void;
}

const SldSafetyTagBarImpl: React.FC<SldSafetyTagBarProps> = ({
  selectedEquipmentId,
  activeTags,
  onApplyTag,
  onRemoveTag,
}) => {
  const [selectedTagType, setSelectedTagType] = useState<SafetyTagType>('DANGER');
  const [workOrder, setWorkOrder] = useState('WO-2026-884');
  const [isExpanded, setIsExpanded] = useState(false);

  const tagsOnSelected = activeTags.filter((t) => t.equipmentId === selectedEquipmentId);

  const handleApply = () => {
    onApplyTag({
      equipmentId: selectedEquipmentId,
      type: selectedTagType,
      label: TAG_DEFINITIONS[selectedTagType].label,
      appliedBy: 'Lead SCADA Operator (Badge #4092)',
      workOrder,
    });
  };

  return (
    <div className="bg-zinc-900/90 border border-zinc-800/80 rounded-xl p-2.5 space-y-2 text-xs font-mono">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Lock className="w-3.5 h-3.5 text-amber-400" />
          <span className="font-bold text-zinc-200">
            Safety & Danger Tags ({activeTags.length} Active in Substation)
          </span>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-[11px] text-cyan-400 hover:text-cyan-300 font-bold cursor-pointer"
        >
          {isExpanded ? 'Hide Tag Controls' : 'Attach / View Tags'}
        </button>
      </div>

      {isExpanded && (
        <div className="space-y-2.5 pt-1.5 border-t border-zinc-800">
          <div className="text-[11px] text-zinc-400">
            Target Equipment: <span className="text-cyan-300 font-bold">{selectedEquipmentId || 'None Selected'}</span>
          </div>

          {/* Tag Type Selector Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            {(Object.keys(TAG_DEFINITIONS) as SafetyTagType[]).map((type) => {
              const def = TAG_DEFINITIONS[type];
              const Icon = def.icon;
              const isSelected = selectedTagType === type;
              return (
                <button
                  key={type}
                  onClick={() => setSelectedTagType(type)}
                  className={`p-2 rounded-lg border text-left flex flex-col justify-between transition-all cursor-pointer ${
                    isSelected
                      ? `${def.bgColor} ${def.borderColor} text-zinc-100 shadow-md`
                      : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <Icon className="w-3.5 h-3.5" style={{ color: def.color }} />
                    {isSelected && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <span className="font-bold text-[10px]" style={{ color: isSelected ? '#fff' : def.color }}>
                    {def.shortLabel}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Work Order #"
              value={workOrder}
              onChange={(e) => setWorkOrder(e.target.value)}
              className="px-2 py-1 bg-zinc-950 border border-zinc-800 rounded text-[11px] text-zinc-200 focus:outline-none focus:border-cyan-500 w-36"
            />
            <button
              onClick={handleApply}
              disabled={!selectedEquipmentId}
              className="flex-1 py-1 px-3 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-zinc-950 font-bold rounded text-[11px] flex items-center justify-center gap-1 cursor-pointer transition-colors shadow-sm"
            >
              <Plus className="w-3 h-3" />
              <span>Attach Tag to {selectedEquipmentId || 'Select Target'}</span>
            </button>
          </div>

          {/* Active Tags list on Selected Asset */}
          {tagsOnSelected.length > 0 && (
            <div className="space-y-1 pt-1">
              <span className="text-[10px] text-zinc-400 font-bold uppercase block">
                Tags on {selectedEquipmentId}:
              </span>
              <div className="space-y-1">
                {tagsOnSelected.map((tag) => {
                  const def = TAG_DEFINITIONS[tag.type];
                  const Icon = def.icon;
                  return (
                    <div
                      key={tag.id}
                      className={`p-1.5 rounded-lg border ${def.bgColor} ${def.borderColor} flex items-center justify-between text-[11px]`}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="w-3.5 h-3.5 shrink-0" style={{ color: def.color }} />
                        <div>
                          <span className="font-bold" style={{ color: def.color }}>{def.label}</span>
                          <span className="text-[10px] text-zinc-400 block">{tag.appliedBy} ({tag.appliedAt})</span>
                        </div>
                      </div>
                      <button
                        onClick={() => onRemoveTag(tag.id)}
                        className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-zinc-100 cursor-pointer"
                        title="Remove Tag"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const SldSafetyTagBar = React.memo(SldSafetyTagBarImpl);
