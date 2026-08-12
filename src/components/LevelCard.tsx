import React from 'react';
import { Plus, Minus, Users, DoorOpen, CheckCircle, Info } from 'lucide-react';
import { LevelMetadata, LevelData } from '../types';

interface LevelCardProps {
  key?: string;
  metadata: LevelMetadata;
  minima: LevelData;
  current: LevelData;
  status: string;
  onValueChange: (field: 'alunos' | 'turmas', value: number) => void;
  imageUrl?: string;
  isLocked?: boolean;
}

export default function LevelCard({
  metadata,
  minima,
  current,
  status,
  onValueChange,
  imageUrl,
  isLocked = false,
}: LevelCardProps) {
  const lowerStatus = (status || '').toLowerCase().trim();
  const isAberto = (lowerStatus === 'aberto' || lowerStatus === 'em aberto') && !isLocked;
  const isZeroAlunos = current.alunos <= 0;
  const isZeroTurmas = current.turmas <= 0;

  const displayImage = imageUrl || metadata.imageUrl;

  return (
    <div 
      id={`card-level-${metadata.key}`}
      className="bg-white rounded-2xl overflow-hidden border border-neutral-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_24px_rgba(0,0,0,0.08)] transition-all duration-300 flex flex-col group"
    >
      {/* Photo Placeholder */}
      <div className="relative overflow-hidden border-b border-neutral-100 h-40">
        <img 
          src={displayImage} 
          alt={metadata.label}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover rounded-t-2xl group-hover:scale-105 transition-transform duration-500"
        />
        <span className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm text-[9px] uppercase tracking-wider font-semibold font-sans px-2.5 py-1 rounded-full text-neutral-800 shadow-sm border border-neutral-100">
          {metadata.category}
        </span>
      </div>

      {/* Card Body */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <h4 className="font-display font-semibold text-neutral-950 text-base group-hover:text-violet-900 transition-colors">
            {metadata.label}
          </h4>
          <p className="text-xs text-neutral-500 mt-1 line-clamp-2 h-8 font-sans leading-normal">
            {metadata.description}
          </p>
        </div>

        {/* Quantities Controls or Receipts */}
        <div className="mt-5 space-y-4 pt-4 border-t border-neutral-100">
          
          {/* Alunos Segment */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-neutral-50 rounded-lg text-neutral-500">
                <Users className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="text-xs font-semibold text-neutral-800 block">Alunos</span>
                <span className="text-[9px] text-neutral-400 block">
                  Mínimo: <strong className="font-mono">{minima.alunos}</strong>
                </span>
              </div>
            </div>

            {isAberto ? (
              /* Edit Mode controls */
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => onValueChange('alunos', Math.max(0, current.alunos - 1))}
                  disabled={isZeroAlunos}
                  id={`btn-minus-alunos-${metadata.key}`}
                  className={`w-7 h-7 rounded-full flex items-center justify-center border transition-all duration-150 ${
                    isZeroAlunos
                      ? 'border-neutral-100 bg-neutral-50 text-neutral-300 cursor-not-allowed'
                      : 'border-neutral-200 bg-white hover:bg-neutral-50 hover:border-neutral-400 text-neutral-800 hover:scale-105 active:scale-95 shadow-sm'
                  }`}
                  title={isZeroAlunos ? "Mínimo 0 atingido" : "Diminuir alunos"}
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="w-8 text-center font-mono font-semibold text-sm text-neutral-900">
                  {current.alunos}
                </span>
                <button
                  onClick={() => onValueChange('alunos', current.alunos + 1)}
                  id={`btn-plus-alunos-${metadata.key}`}
                  className="w-7 h-7 rounded-full flex items-center justify-center border border-neutral-200 bg-white hover:bg-neutral-50 hover:border-neutral-400 text-neutral-800 hover:scale-105 active:scale-95 shadow-sm transition-all duration-150"
                  title="Aumentar alunos"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            ) : (
              /* Receipt Mode */
              <div className="text-right">
                <span className="font-mono font-semibold text-sm text-neutral-900 block">
                  {current.alunos}
                </span>
                {current.alunos > minima.alunos ? (
                  <span className="text-[9px] text-green-600 font-medium bg-green-50 px-1 py-0.5 rounded">
                    +{current.alunos - minima.alunos}
                  </span>
                ) : (
                  <span className="text-[9px] text-neutral-400 block font-mono">Contratual</span>
                )}
              </div>
            )}
          </div>

          {/* Turmas Segment */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-neutral-50 rounded-lg text-neutral-500">
                <DoorOpen className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="text-xs font-semibold text-neutral-800 block">Turmas</span>
                <span className="text-[9px] text-neutral-400 block">
                  Mínimo: <strong className="font-mono">{minima.turmas}</strong>
                </span>
              </div>
            </div>

            {isAberto ? (
              /* Edit Mode controls */
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => onValueChange('turmas', Math.max(0, current.turmas - 1))}
                  disabled={isZeroTurmas}
                  id={`btn-minus-turmas-${metadata.key}`}
                  className={`w-7 h-7 rounded-full flex items-center justify-center border transition-all duration-150 ${
                    isZeroTurmas
                      ? 'border-neutral-100 bg-neutral-50 text-neutral-300 cursor-not-allowed'
                      : 'border-neutral-200 bg-white hover:bg-neutral-50 hover:border-neutral-400 text-neutral-800 hover:scale-105 active:scale-95 shadow-sm'
                  }`}
                  title={isZeroTurmas ? "Mínimo 0 atingido" : "Diminuir turmas"}
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="w-8 text-center font-mono font-semibold text-sm text-neutral-900">
                  {current.turmas}
                </span>
                <button
                  onClick={() => onValueChange('turmas', current.turmas + 1)}
                  id={`btn-plus-turmas-${metadata.key}`}
                  className="w-7 h-7 rounded-full flex items-center justify-center border border-neutral-200 bg-white hover:bg-neutral-50 hover:border-neutral-400 text-neutral-800 hover:scale-105 active:scale-95 shadow-sm transition-all duration-150"
                  title="Aumentar turmas"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            ) : (
              /* Receipt Mode */
              <div className="text-right">
                <span className="font-mono font-semibold text-sm text-neutral-900 block">
                  {current.turmas}
                </span>
                {current.turmas > minima.turmas ? (
                  <span className="text-[9px] text-green-600 font-medium bg-green-50 px-1 py-0.5 rounded">
                    +{current.turmas - minima.turmas}
                  </span>
                ) : (
                  <span className="text-[9px] text-neutral-400 block font-mono">Contratual</span>
                )}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
