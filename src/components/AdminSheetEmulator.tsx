import React, { useState, useEffect } from 'react';
import { Database, RefreshCw, Calendar, Sparkles, Sliders, CheckCircle, FileSpreadsheet, Lock } from 'lucide-react';
import { School } from '../types';
import { getAdminSchools, updateAdminSchoolRow, resetAdminSpreadsheet } from '../api';

interface AdminSheetEmulatorProps {
  currentSlug: string;
  onSelectSchool: (slug: string) => void;
  onSchoolUpdated: () => void;
  onOpenAppsScript: () => void;
}

export default function AdminSheetEmulator({
  currentSlug,
  onSelectSchool,
  onSchoolUpdated,
  onOpenAppsScript
}: AdminSheetEmulatorProps) {
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedEditSlug, setSelectedEditSlug] = useState<string>(currentSlug);
  const [customName, setCustomName] = useState('');
  const [customStatus, setCustomStatus] = useState<'Aberto' | 'Concluido'>('Aberto');
  const [customDate, setCustomDate] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  // Load admin view of simulated sheets
  const loadAdminSchools = async () => {
    try {
      const data = await getAdminSchools();
      setSchools(data);
      const active = data.find(s => s.slug === selectedEditSlug);
      if (active) {
        setCustomName(active.name);
        setCustomStatus(active.status);
        setCustomDate(active.dataLimite);
      }
    } catch (err) {
      console.error('Error loading admin schools:', err);
    }
  };

  useEffect(() => {
    loadAdminSchools();
  }, [selectedEditSlug, currentSlug]);

  const handleUpdateRow = async () => {
    setLoading(true);
    try {
      await updateAdminSchoolRow({
        slug: selectedEditSlug,
        name: customName,
        status: customStatus,
        dataLimite: customDate,
      });
      await loadAdminSchools();
      onSchoolUpdated();
    } catch (err) {
      alert('Erro ao atualizar a linha na planilha.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetSpreadsheet = async () => {
    if (confirm('Tem certeza que deseja restaurar as planilhas simuladas para o padrão?')) {
      setLoading(true);
      try {
        await resetAdminSpreadsheet();
        setSelectedEditSlug('colegio-objetivo');
        onSelectSchool('colegio-objetivo');
        await loadAdminSchools();
        onSchoolUpdated();
      } catch (err) {
        alert('Erro ao resetar planilha.');
      } finally {
        setLoading(false);
      }
    }
  };

  const setDatePreset = (preset: 'expired' | 'active') => {
    if (preset === 'expired') {
      setCustomDate('2026-06-10'); // Expired (Current date is 2026-07-02)
    } else {
      setCustomDate('2026-07-28'); // Active
    }
  };

  const activeSchoolForEdit = schools.find(s => s.slug === selectedEditSlug);

  return (
    <div className="bg-[#121212] text-white border-b border-neutral-800 text-xs font-sans">
      {/* Top Bar Trigger */}
      <div className="max-w-7xl mx-auto px-6 py-3.5 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse" />
          <div className="flex items-center gap-1.5 font-medium tracking-wide">
            <FileSpreadsheet className="w-4 h-4 text-green-400" />
            <span className="uppercase text-[10px] tracking-widest text-neutral-400">Google Sheets DB Simulado</span>
          </div>
          <span className="text-neutral-500 font-mono hidden md:inline">|</span>
          <p className="text-neutral-400 text-[11px] hidden md:inline">
            Altere as linhas do Google Sheets abaixo para simular as regras de negócio em tempo real.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="bg-neutral-800 hover:bg-neutral-700 text-white hover:text-neutral-200 px-3.5 py-1.5 rounded-lg transition-all-custom font-medium flex items-center gap-1.5 border border-neutral-700 shadow-sm"
          >
            <Sliders className="w-3.5 h-3.5 text-violet-400" />
            <span>{isExpanded ? 'Ocultar Planilha' : 'Mostrar Planilha (Controles)'}</span>
          </button>
          
          <button
            onClick={onOpenAppsScript}
            className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white px-3.5 py-1.5 rounded-lg transition-all-custom font-medium flex items-center gap-1.5 shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Código Apps Script</span>
          </button>
        </div>
      </div>

      {/* Expanded Control Spreadsheet Sheet Panel */}
      {isExpanded && (
        <div className="max-w-7xl mx-auto px-6 pb-6 pt-1 border-t border-neutral-800/60 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Quick Select Row */}
          <div className="lg:col-span-4 space-y-3.5">
            <div>
              <label className="block text-neutral-400 mb-1.5 font-medium uppercase tracking-wider text-[9px]">
                1. Selecionar Escola (Simular URL/Acesso)
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {schools.map(school => {
                  const isCurrent = school.slug === currentSlug;
                  return (
                    <button
                      key={school.slug}
                      onClick={() => {
                        onSelectSchool(school.slug);
                        setSelectedEditSlug(school.slug);
                      }}
                      className={`py-2 px-1 rounded-lg text-center font-mono font-medium border text-[10px] transition-all duration-200 ${
                        isCurrent
                          ? 'bg-white text-black border-white'
                          : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:bg-neutral-800 hover:text-white'
                      }`}
                    >
                      {school.slug === 'algodao-doce' && 'Algodão Doce'}
                      {school.slug === 'colegio-objetivo' && 'Objetivo'}
                      {school.slug === 'colegio-mindful' && 'Mindful'}
                      {school.slug === 'escola-lumiar' && 'Lumiar (Expirado)'}
                      {!['algodao-doce', 'colegio-objetivo', 'colegio-mindful', 'escola-lumiar'].includes(school.slug) && school.name}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="bg-neutral-900/60 p-3 rounded-xl border border-neutral-800/80 space-y-2">
              <span className="font-semibold text-neutral-300 block text-[10px] uppercase tracking-wider">Metadados da URL</span>
              <p className="text-[11px] font-mono text-neutral-400 break-all">
                URL Ativa:<br/>
                <span className="text-violet-400 font-sans">https://mindfulschool.com/?escola={currentSlug}</span>
              </p>
              <p className="text-[10px] text-neutral-500 leading-normal">
                No ambiente real, cada escola recebe esse link customizado que faz a leitura dos parâmetros diretamente do Google Sheets.
              </p>
            </div>
          </div>

          {/* Form to edit cells */}
          <div className="lg:col-span-5 bg-neutral-900 p-4 rounded-xl border border-neutral-800 space-y-4">
            <span className="font-semibold text-neutral-200 block text-[10px] uppercase tracking-wider">
              2. Simular Células do Google Sheets (Linha: {selectedEditSlug})
            </span>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-neutral-400 mb-1">Nome da Escola</label>
                <input
                  type="text"
                  value={customName}
                  onChange={e => setCustomName(e.target.value)}
                  className="w-full bg-neutral-800 border border-neutral-700 rounded px-2.5 py-1.5 text-white text-xs font-sans focus:outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="block text-neutral-400 mb-1">Status (Coluna C)</label>
                <select
                  value={customStatus}
                  onChange={e => setCustomStatus(e.target.value as 'Aberto' | 'Concluido')}
                  className="w-full bg-neutral-800 border border-neutral-700 rounded px-2 py-1.5 text-white text-xs font-sans focus:outline-none focus:border-violet-500"
                >
                  <option value="Aberto">Aberto (Edição)</option>
                  <option value="Concluido">Concluido (Leitura/Recibo)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-neutral-400 mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-neutral-500" /> Data Limite (Coluna D)
                </label>
                <input
                  type="date"
                  value={customDate}
                  onChange={e => setCustomDate(e.target.value)}
                  className="w-full bg-neutral-800 border border-neutral-700 rounded px-2.5 py-1 text-white text-xs font-mono focus:outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <span className="block text-neutral-400 mb-1">Presets de Data</span>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => setDatePreset('expired')}
                    className="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 py-1 rounded border border-neutral-700 transition-colors flex items-center justify-center gap-1 text-[10px]"
                  >
                    <Lock className="w-2.5 h-2.5 text-red-400" /> Expirada
                  </button>
                  <button
                    onClick={() => setDatePreset('active')}
                    className="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 py-1 rounded border border-neutral-700 transition-colors flex items-center justify-center gap-1 text-[10px]"
                  >
                    <CheckCircle className="w-2.5 h-2.5 text-green-400" /> No Prazo
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1 border-t border-neutral-800">
              <button
                onClick={handleUpdateRow}
                disabled={loading}
                className="bg-white hover:bg-neutral-100 text-black py-1.5 px-4 rounded font-medium transition-all duration-200 flex items-center gap-1 shadow-md disabled:opacity-50"
              >
                {loading ? <RefreshCw className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                <span>Salvar na Planilha</span>
              </button>
            </div>
          </div>

          {/* Database Info & Reset */}
          <div className="lg:col-span-3 space-y-4">
            <div className="bg-neutral-900/40 p-4 rounded-xl border border-neutral-800/80 h-full flex flex-col justify-between">
              <div>
                <span className="font-semibold text-neutral-200 block text-[10px] uppercase tracking-wider mb-2">
                  Status Atual no Sheets
                </span>
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-neutral-400">Escola:</span>
                    <span className="font-medium text-white truncate max-w-[120px]">{activeSchoolForEdit?.name}</span>
                  </div>
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-neutral-400">Status:</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium uppercase font-mono ${
                      activeSchoolForEdit?.status === 'Concluido'
                        ? 'bg-green-500/10 text-green-400'
                        : 'bg-yellow-500/10 text-yellow-400'
                    }`}>
                      {activeSchoolForEdit?.status}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-neutral-400">Data Limite:</span>
                    <span className="font-mono text-white">{activeSchoolForEdit?.dataLimite}</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-neutral-800/60 flex items-center justify-between">
                <span className="text-neutral-500 text-[10px]">Restaurar Planilha</span>
                <button
                  onClick={handleResetSpreadsheet}
                  disabled={loading}
                  className="bg-red-950/40 hover:bg-red-900/60 text-red-400 border border-red-900/60 px-2.5 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1 text-[10px] disabled:opacity-50"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Resetar Tudo</span>
                </button>
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
