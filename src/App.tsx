import React, { useState, useEffect } from 'react';
import { 
  School as SchoolIcon, 
  Calendar, 
  Clock, 
  Lock, 
  CheckCircle, 
  HelpCircle, 
  ShieldAlert, 
  User, 
  Briefcase,
  Mail,
  Phone,
  MapPin,
  ArrowRight, 
  Loader2, 
  AlertCircle,
  FileSpreadsheet,
  Info,
  Check
} from 'lucide-react';
import { School, LevelKey, LevelData, LEVELS } from './types';
import { getSchoolData, confirmSchoolQuantities, resetSchoolState } from './api';
import LevelCard from './components/LevelCard';
import AppsScriptModal from './components/AppsScriptModal';

// Current system date for mock deadline comparison
const SYSTEM_DATE = new Date('2026-07-02');

// Phone number helper: supports landline (8 digits after DDD) and mobile (9 digits after DDD)
const formatPhoneNumber = (value: string): string => {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (!digits) return '';
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
};

// Helper to determine status badge presentation and state flags
const getStatusInfo = (statusStr?: string, isExpiredByDate?: boolean) => {
  const rawStatus = (statusStr || 'Aberto').trim();
  const lower = rawStatus.toLowerCase();

  const isConcludedState = 
    lower === 'concluido' || 
    lower === 'concluído' || 
    lower === 'finalizado' || 
    lower === 'confirmado';

  const isExpiredState = 
    lower === 'expirado' || 
    lower === 'encerrado' || 
    lower === 'prazo encerrado' || 
    (!isConcludedState && isExpiredByDate);

  if (isConcludedState) {
    return {
      label: rawStatus === 'Concluido' ? 'Concluído' : rawStatus,
      bg: 'bg-green-50 text-green-700 border-green-200',
      dot: 'bg-green-600',
      isConcluded: true,
      isExpired: false
    };
  }

  if (isExpiredState) {
    return {
      label: rawStatus !== 'Aberto' ? rawStatus : 'Prazo Encerrado',
      bg: 'bg-red-50 text-red-700 border-red-200',
      dot: 'bg-red-600',
      isConcluded: false,
      isExpired: true
    };
  }

  return {
    label: rawStatus,
    bg: 'bg-amber-50 text-amber-700 border-amber-200',
    dot: 'bg-amber-600',
    isConcluded: false,
    isExpired: false
  };
};

export default function App() {
  const [slug, setSlug] = useState<string>('algodao-doce');
  const [escolaAtual, setEscolaAtual] = useState<string>('algodao-doce');
  const [school, setSchool] = useState<School | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quantities, setQuantities] = useState<Record<LevelKey, LevelData>>({} as any);
  
  // Confirmation state
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmedBy, setConfirmedBy] = useState('');
  const [confirmedRole, setConfirmedRole] = useState('');
  const [confirmedEmail, setConfirmedEmail] = useState('');
  const [confirmedPhone, setConfirmedPhone] = useState('');
  const [confirmedAddress, setConfirmedAddress] = useState('');
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Modal & Help States
  const [isOpenAppsScript, setIsOpenAppsScript] = useState(false);
  const [successToast, setSuccessToast] = useState<{ title: string; message: string } | null>(null);

  // Parse current URL parameter to set active school slug
  const parseUrlSlug = () => {
    const params = new URLSearchParams(window.location.search);
    const escolaParam = params.get('escola');
    if (escolaParam) {
      setEscolaAtual(escolaParam);
      setSlug(escolaParam);
    } else {
      setEscolaAtual('algodao-doce');
      setSlug('algodao-doce');
    }
  };

  useEffect(() => {
    parseUrlSlug();
    
    // Listen for path changes (SPA navigation)
    const handlePopState = () => {
      parseUrlSlug();
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Fetch school data when slug changes
  const loadSchool = async (activeSlug: string) => {
    if (!activeSlug) {
      setSchool(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await getSchoolData(activeSlug);
      setSchool(data);
      
      // Initialize quantities
      const initialQuantities: Partial<Record<LevelKey, LevelData>> = {};
      const lowerStatus = (data.status || '').toLowerCase().trim();
      const isClosedStatus = lowerStatus === 'concluido' || lowerStatus === 'concluído' || lowerStatus === 'finalizado' || lowerStatus === 'confirmado';

      LEVELS.forEach(lvl => {
        if (isClosedStatus && data.confirmed && data.confirmed[lvl.key]) {
          initialQuantities[lvl.key] = { ...data.confirmed[lvl.key] };
        } else if (data.minima && data.minima[lvl.key]) {
          initialQuantities[lvl.key] = { ...data.minima[lvl.key] };
        } else {
          initialQuantities[lvl.key] = { alunos: 0, turmas: 0 };
        }
      });
      setQuantities(initialQuantities as Record<LevelKey, LevelData>);
    } catch (err: any) {
      setError(err.message || 'Link de acesso inválido. Por favor, verifique o endereço fornecido pela Mindful School.');
      setSchool(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (slug) {
      loadSchool(slug);
    }
  }, [slug]);

  // Navigate cleanly without full page refresh
  const navigateToSchool = (targetSlug: string) => {
    const targetUrl = targetSlug ? `?escola=${targetSlug}` : '/';
    window.history.pushState({}, '', targetUrl);
    setEscolaAtual(targetSlug);
    setSlug(targetSlug);
  };

  // Adjust level quantity state (+ / -)
  const handleQuantityChange = (levelKey: LevelKey, field: 'alunos' | 'turmas', value: number) => {
    if (!school) return;
    if (value < 0) return; // Users can decrease freely down to 0

    setQuantities(prev => ({
      ...prev,
      [levelKey]: {
        ...prev[levelKey],
        [field]: value
      }
    }));
  };

  // Calculate totals for summary cards and header counts
  const getTotals = () => {
    let totalAlunos = 0;
    let totalTurmas = 0;
    let totalAlunosMin = 0;
    let totalTurmasMin = 0;

    LEVELS.forEach(lvl => {
      const currentVal = quantities[lvl.key];
      const minVal = school?.minima[lvl.key];
      if (currentVal) {
        totalAlunos += currentVal.alunos;
        totalTurmas += currentVal.turmas;
      }
      if (minVal) {
        totalAlunosMin += minVal.alunos;
        totalTurmasMin += minVal.turmas;
      }
    });

    return { totalAlunos, totalTurmas, totalAlunosMin, totalTurmasMin };
  };

  const totals = school ? getTotals() : { totalAlunos: 0, totalTurmas: 0, totalAlunosMin: 0, totalTurmasMin: 0 };

  // Determine if quantities have been modified
  const getModificationsCount = () => {
    if (!school) return 0;
    let changes = 0;
    LEVELS.forEach(lvl => {
      const cur = quantities[lvl.key];
      const min = school.minima[lvl.key];
      if (cur && min) {
        if (cur.alunos !== min.alunos) changes++;
        if (cur.turmas !== min.turmas) changes++;
      }
    });
    return changes;
  };

  const modificationsCount = getModificationsCount();

  // Validate deadline rules
  const isExpiredByDate = () => {
    if (!school) return false;
    const lower = (school.status || '').toLowerCase().trim();
    if (lower === 'concluido' || lower === 'concluído' || lower === 'finalizado' || lower === 'confirmado') {
      return false;
    }
    const limitDate = new Date(school.dataLimite);
    return SYSTEM_DATE > limitDate;
  };

  const statusInfo = getStatusInfo(school?.status, isExpiredByDate());
  const schoolIsExpired = statusInfo.isExpired;

  // Determine visible levels based strictly on initial contractual minima (school.minima)
  // Hide levels where initial contractual turmas <= 0 AND alunos <= 0
  const visibleLevels = LEVELS.filter(level => {
    if (!school || !school.minima) return false;
    const minData = school.minima[level.key];
    if (!minData) return false;

    const baseTurmas = Number(minData.turmas ?? 0);
    const baseAlunos = Number(minData.alunos ?? 0);

    return baseTurmas > 0 || baseAlunos > 0;
  });

  // Submit quantity confirmation
  const handleConfirmSubmission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slug || !confirmedBy || !confirmedRole || !confirmedEmail || !confirmedPhone || !confirmedAddress || !hasAcceptedTerms) return;
    
    if (confirmedAddress.trim().length < 10) {
      alert('Por favor, informe o endereço de entrega completo (com no mínimo 10 caracteres).');
      return;
    }

    const digitsPhone = confirmedPhone.replace(/\D/g, '');
    if (digitsPhone.length < 10) {
      alert('Por favor, informe um número de telefone/celular válido com DDD.');
      return;
    }

    setSubmitting(true);
    try {
      const updatedSchool = await confirmSchoolQuantities(
        slug, 
        quantities, 
        confirmedBy, 
        confirmedRole,
        escolaAtual,
        confirmedEmail,
        confirmedPhone,
        confirmedAddress
      );
      setSchool(updatedSchool);
      setIsConfirming(false);
      setSuccessToast({
        title: 'Tudo pronto!',
        message: 'Enviamos um resumo desta confirmação para o e-mail informado e nossa equipe já dará continuidade às próximas etapas de produção dos materiais. Obrigado!'
      });
      setTimeout(() => setSuccessToast(null), 8000);
    } catch (err: any) {
      alert(err.message || 'Erro ao finalizar confirmação.');
    } finally {
      setSubmitting(false);
    }
  };

  // Quick reset helper for testing inside the demo workspace
  const handleQuickReset = async () => {
    if (!slug) return;
    setLoading(true);
    try {
      const updated = await resetSchoolState(slug);
      setSchool(updated);
      
      const initialQuantities: Record<LevelKey, LevelData> = {} as any;
      LEVELS.forEach(lvl => {
        initialQuantities[lvl.key] = { ...updated.minima[lvl.key] };
      });
      setQuantities(initialQuantities);
      
      setSuccessToast({
        title: 'Estado Reiniciado',
        message: 'O formulário foi reaberto para edição para fins de teste.'
      });
      setTimeout(() => setSuccessToast(null), 4000);
    } catch (err) {
      alert('Erro ao resetar escola.');
    } finally {
      setLoading(false);
    }
  };

  // Format date string to BR format
  const formatDateBr = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex flex-col antialiased font-sans">
      
      {/* ==================== TOP NAVIGATION HEADER ==================== */}
      <header className="bg-white/80 backdrop-blur-md border-b border-neutral-200/80 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          
          {/* Left: Brand Identity & School Title */}
          <div className="flex items-center gap-3">
            <div className="bg-neutral-900 text-white p-2 rounded-xl flex items-center justify-center font-display font-bold text-xs tracking-wider shadow-sm">
              MS
            </div>
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-sm tracking-tight text-neutral-900">
                MINDFUL SCHOOL
              </span>
              <span className="text-neutral-300 font-light text-xs">|</span>
              <span className="text-xs font-medium text-neutral-600 truncate max-w-[200px] sm:max-w-none">
                {school?.name || 'Portal do Cliente'}
              </span>
            </div>
          </div>

          {/* Right: Clean Status Badge */}
          <div className="flex items-center gap-3">
            {school && (
              <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 border ${statusInfo.bg}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dot}`} />
                {statusInfo.label}
              </span>
            )}
          </div>

        </div>
      </header>

      {/* Success Notification Toast */}
      {successToast && (
        <div className="fixed top-20 right-6 z-50 max-w-md bg-neutral-900 text-white p-4 rounded-2xl shadow-2xl border border-neutral-700 flex items-start gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
          <CheckCircle className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-semibold text-xs text-white">{successToast.title}</h4>
            <p className="text-xs text-neutral-300 leading-relaxed">{successToast.message}</p>
          </div>
        </div>
      )}

      {/* ==================== MAIN CONTENT AREA ==================== */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8">

        {loading ? (
          <div className="min-h-[400px] flex flex-col items-center justify-center gap-3 text-neutral-400">
            <Loader2 className="w-8 h-8 animate-spin text-neutral-800" />
            <p className="text-xs font-medium font-mono">Carregando dados da escola...</p>
          </div>
        ) : error ? (
          /* Error State */
          <div className="bg-white border border-red-100 rounded-3xl p-8 md:p-12 text-center max-w-xl mx-auto shadow-sm my-12 space-y-4">
            <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h2 className="font-display font-bold text-xl text-neutral-900">Link de Acesso Inválido</h2>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Link de acesso inválido. Por favor, verifique o endereço fornecido pela Mindful School.
            </p>
          </div>
        ) : schoolIsExpired ? (
          /* ==================== EXPIRED VIEW ==================== */
          <div className="space-y-8">
            {/* Header */}
            <div className="bg-white border border-neutral-200/80 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
              <div className="max-w-2xl">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-neutral-100 rounded-xl text-neutral-800">
                    <SchoolIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h1 className="font-display font-bold text-xl md:text-2xl text-neutral-900 tracking-tight">
                      {school?.name}
                    </h1>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 md:self-center shrink-0">
                <div className="flex items-center gap-2.5 bg-red-50/80 border border-red-200/60 px-4 py-2.5 rounded-xl">
                  <Lock className="w-4 h-4 text-red-600" />
                  <div>
                    <span className="text-[9px] uppercase tracking-wider font-bold text-red-700 block font-mono">STATUS DA CONFIRMAÇÃO</span>
                    <span className="text-xs font-semibold text-red-950 block font-sans">EXPIRADO / BLOQUEADO</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Expired Full Banner */}
            <div className="bg-red-50 border border-red-200/80 rounded-2xl p-6 space-y-3 shadow-sm">
              <div className="flex items-center gap-2 text-red-800 font-display font-bold text-base">
                <ShieldAlert className="w-5 h-5 text-red-600 shrink-0" />
                <span>Prazo encerrado.</span>
              </div>
              <div className="text-xs text-red-900 leading-relaxed space-y-2">
                <p>O período para confirmação das quantidades foi finalizado em <strong>05/12/2026</strong>.</p>
                <p>Como não houve confirmação dentro do prazo, a produção seguirá as quantidades previstas em contrato, com entrega estimada para fevereiro de 2027.</p>
                <p className="pt-2 text-red-800 border-t border-red-200/60">
                  Caso sua escola precise solicitar materiais adicionais, entre em contato com nossa equipe pelos canais abaixo:<br />
                  <strong>E-mail:</strong> contato@mindkids.net | <strong>WhatsApp:</strong> (11) 94056-2368 (segunda a sexta-feira, das 9h às 18h).
                </p>
              </div>
            </div>

            {/* Readonly Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
              {visibleLevels.map(level => {
                const minData = school?.minima[level.key] || { alunos: 0, turmas: 0 };
                const currentData = quantities[level.key] || minData;
                
                return (
                  <LevelCard
                    key={level.key}
                    metadata={level}
                    minima={minData}
                    current={currentData}
                    status={school?.status || 'Aberto'}
                    onValueChange={(field, value) => handleQuantityChange(level.key, field, value)}
                    imageUrl={level.imageUrl}
                    isLocked={true}
                  />
                );
              })}
            </div>
          </div>
        ) : (
          /* ==================== ACTIVE VIEW (ABERTO & CONCLUIDO) ==================== */
          <div className="space-y-8">
            
            {/* Main Title & Subtitle Panel */}
            <div className="bg-white border border-neutral-200/80 rounded-3xl p-6 md:p-8 space-y-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
              
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-neutral-100">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md w-fit border border-amber-200/60 font-mono">
                    <Clock className="w-3 h-3" />
                    <span>Prazo de confirmação</span>
                  </div>
                  <h1 className="font-display font-bold text-2xl md:text-3xl text-neutral-900 tracking-tight">
                    Confirmação de Materiais do Aluno
                  </h1>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right hidden sm:block">
                    <span className="text-[10px] uppercase tracking-wider text-neutral-400 font-mono font-semibold block">UNIDADE ESCOLAR</span>
                    <span className="text-sm font-semibold text-neutral-900">{school?.name}</span>
                  </div>
                </div>
              </div>

              {/* Explanatory intro */}
              <div className="space-y-3 text-xs text-neutral-600 leading-relaxed">
                <p className="text-sm font-medium text-neutral-800">
                  Garanta que sua escola receba a quantidade correta de materiais para o ano letivo de 2027.
                </p>
                <p>
                  Confira abaixo as quantidades de alunos e turmas da sua unidade, preenchidas com base no contrato atual. Caso necessário, ajuste apenas os campos editáveis antes de finalizar a confirmação.
                </p>
              </div>

              {/* Informative Dates Box */}
              <div className="bg-neutral-50 border border-neutral-200/80 rounded-2xl p-5 md:p-6 space-y-3">
                <div className="flex items-center gap-2 text-neutral-900 font-display font-bold text-xs uppercase tracking-wider font-mono">
                  <Info className="w-4 h-4 text-neutral-700" />
                  <span>Prazo para confirmação</span>
                </div>
                <p className="text-xs text-neutral-600">
                  A data da sua confirmação define o período de recebimento dos materiais na sua escola:
                </p>
                <ul className="text-xs text-neutral-700 space-y-1.5 list-disc pl-5">
                  <li><strong>Confirmação até 05/10/2026:</strong> Entrega prevista em dezembro de 2026.</li>
                  <li><strong>Confirmação até 05/11/2026:</strong> Entrega prevista em janeiro de 2027.</li>
                  <li><strong>Confirmação até 05/12/2026:</strong> Entrega prevista em fevereiro de 2027.</li>
                </ul>
                <p className="text-[11px] text-neutral-500 pt-2 border-t border-neutral-200/60 leading-normal italic">
                  <strong>Importante:</strong> Caso a confirmação não seja realizada até 05/12/2026, a produção seguirá automaticamente as quantidades previstas em contrato. Solicitações realizadas após esse prazo serão tratadas como pedidos adicionais e seguirão os prazos de produção posteriores.
                </p>
              </div>

              {/* Doubts contact box */}
              <div className="text-xs text-neutral-600 bg-neutral-100/60 p-4 rounded-xl border border-neutral-200/60">
                <p>
                  Em caso de dúvidas, entre em contato com nossa equipe pelos canais abaixo:<br />
                  <strong>E-mail:</strong> <a href="mailto:contato@mindkids.net" className="text-neutral-900 underline">contato@mindkids.net</a> ou <strong>WhatsApp:</strong> <span className="text-neutral-900 font-medium">(11) 94056-2368</span>, de segunda à sexta-feira das 9h às 18h.
                </p>
              </div>

            </div>

            {/* Post-Confirmation Summary Card (Visible when concluded/finalized) */}
            {statusInfo.isConcluded && (
              <div 
                id="receipt-header-banner"
                className="bg-white border border-green-200 rounded-3xl overflow-hidden shadow-sm"
              >
                <div className="bg-[#121212] text-white p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                      <h3 className="font-display font-semibold text-lg">Resumo da confirmação</h3>
                    </div>
                    <p className="text-xs text-neutral-300">
                      Esta página registra a confirmação das quantidades de alunos e turmas por série que serão consideradas para produção dos materiais do aluno da Mindful School em 2027.
                    </p>
                  </div>
                  <span className="font-mono text-[10px] bg-green-950 text-green-400 border border-green-800/80 px-3 py-1 rounded-full uppercase tracking-wider font-bold">
                    Status da confirmação - {statusInfo.label}
                  </span>
                </div>

                <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-3 gap-6 bg-white">
                  <div className="space-y-1">
                    <span className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold">Total de alunos confirmados</span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-mono font-bold text-neutral-900">{totals.totalAlunos}</span>
                      {totals.totalAlunos > totals.totalAlunosMin && (
                        <span className="text-xs text-green-600 font-semibold font-sans bg-green-50 px-2 py-0.5 rounded-full">
                          +{totals.totalAlunos - totals.totalAlunosMin}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold">Total de turmas confirmadas</span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-mono font-bold text-neutral-900">{totals.totalTurmas}</span>
                      {totals.totalTurmas > totals.totalTurmasMin && (
                        <span className="text-xs text-green-600 font-semibold font-sans bg-green-50 px-2 py-0.5 rounded-full">
                          +{totals.totalTurmas - totals.totalTurmasMin}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 bg-neutral-50 p-4 rounded-xl border border-neutral-100">
                    <div className="text-xs text-neutral-600 space-y-1">
                      <p className="flex justify-between">
                        <span>Confirmado por:</span>
                        <strong className="text-neutral-900 font-medium">{school?.confirmedBy || 'Gestor Responsável'}</strong>
                      </p>
                      {school?.confirmedEmail && (
                        <p className="flex justify-between">
                          <span>E-mail:</span>
                          <strong className="text-neutral-900 font-medium">{school.confirmedEmail}</strong>
                        </p>
                      )}
                      <p className="flex justify-between pt-1 border-t border-neutral-200/60">
                        <span>Data do Registro:</span>
                        <strong className="text-neutral-900 font-mono">
                          {school?.updatedAt ? new Date(school.updatedAt).toLocaleString('pt-BR') : '02/12/2026 14:20'}
                        </strong>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Section Title */}
            <div className="flex items-center justify-between pt-2">
              <div>
                <h3 className="font-display font-semibold text-lg text-neutral-900 flex items-center gap-2">
                  <span>Quantitativos por Nível de Ensino</span>
                  <span className="text-xs font-mono font-normal bg-neutral-100 text-neutral-500 px-2 py-0.5 rounded-full">
                    {visibleLevels.length} {visibleLevels.length === 1 ? 'Nível' : 'Níveis'}
                  </span>
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  {statusInfo.isConcluded 
                    ? 'Visualização em Modo de Leitura. Quantitativos confirmados sem possibilidade de alteração.' 
                    : 'Ajuste os valores do número de turmas e alunos caso necessário.'}
                </p>
              </div>

              {statusInfo.isConcluded && (
                <button
                  onClick={handleQuickReset}
                  className="text-xs text-neutral-500 hover:text-neutral-900 underline font-mono"
                >
                  [Simular Reabertura]
                </button>
              )}
            </div>

            {/* Level Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
              {visibleLevels.map(level => {
                const minData = school?.minima[level.key] || { alunos: 0, turmas: 0 };
                const currentData = quantities[level.key] || minData;
                
                return (
                  <LevelCard
                    key={level.key}
                    metadata={level}
                    minima={minData}
                    current={currentData}
                    status={school?.status || 'Aberto'}
                    onValueChange={(field, value) => handleQuantityChange(level.key, field, value)}
                    imageUrl={level.imageUrl}
                  />
                );
              })}
            </div>

            {/* ==================== STICKY FOOTER SUMMARY BAR (ABERTO MODE ONLY) ==================== */}
            {!statusInfo.isConcluded && !statusInfo.isExpired && (
              <div className="sticky bottom-6 left-0 right-0 bg-white/95 backdrop-blur-md border border-neutral-200/80 rounded-2xl shadow-[0_16px_36px_rgba(0,0,0,0.1)] p-5 md:p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-5 z-40 transition-all duration-300">
                <div className="flex flex-wrap items-center gap-6">
                  
                  {/* Total Alunos Summary block */}
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-neutral-400 font-sans block">Total de alunos confirmados</span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-mono font-bold text-neutral-900">{totals.totalAlunos}</span>
                      <span className="text-[10px] text-neutral-400 font-mono">
                        (Mínimo Contratual: {totals.totalAlunosMin})
                      </span>
                    </div>
                  </div>

                  {/* Divider */}
                  <span className="text-neutral-200 font-light hidden md:inline">|</span>

                  {/* Total Turmas Summary block */}
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-neutral-400 font-sans block">Total de turmas confirmadas</span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-mono font-bold text-neutral-900">{totals.totalTurmas}</span>
                      <span className="text-[10px] text-neutral-400 font-mono">
                        (Mínimo Contratual: {totals.totalTurmasMin})
                      </span>
                    </div>
                  </div>

                  {/* Changes count badge */}
                  {modificationsCount > 0 && (
                    <div className="bg-violet-50 border border-violet-100 text-violet-700 px-3 py-1 rounded-full text-[10px] font-semibold flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 bg-violet-600 rounded-full animate-ping" />
                      <span>{modificationsCount} ajustes realizados</span>
                    </div>
                  )}
                </div>

                {/* Finalizar confirmação Trigger */}
                <button
                  onClick={() => setIsConfirming(true)}
                  id="btn-confirmar-quantitativo"
                  className="bg-[#121212] hover:bg-neutral-800 text-white font-medium px-8 py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 text-xs shadow-md active:scale-95 group shrink-0"
                >
                  <span>Finalizar confirmação</span>
                  <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            )}

          </div>
        )}

      </main>

      {/* ==================== REFORMULATED CONFIRMATION MODAL ==================== */}
      {isConfirming && school && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div 
            id="confirmation-signature-modal"
            className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-neutral-100 my-8"
          >
            {/* Header */}
            <div className="bg-[#121212] text-white p-6 relative">
              <h3 className="font-display font-bold text-xl">Confirmar quantidades</h3>
              <div className="mt-2 pt-2 border-t border-neutral-800 space-y-0.5">
                <span className="text-sm font-semibold text-neutral-100 block">{school.name}</span>
                <span className="text-[11px] font-mono text-neutral-400 block break-all">
                  https://mindfulschool.com/?escola={slug}
                </span>
              </div>
            </div>

            {/* Body */}
            <form onSubmit={handleConfirmSubmission} className="p-6 space-y-5">
              
              {/* Disclaimer text */}
              <div className="text-xs text-neutral-700 leading-relaxed bg-neutral-50 p-4 rounded-xl border border-neutral-200/80 space-y-2">
                <p>
                  As quantidades confirmadas de <strong>{totals.totalAlunos} alunos</strong> e <strong>{totals.totalTurmas} turmas</strong> serão utilizadas para produção dos materiais do aluno da <strong>Mindful School</strong> para o ano letivo de 2027.
                </p>
                <p className="text-xs text-amber-700 font-semibold bg-amber-50/80 p-2.5 rounded-lg border border-amber-200/60">
                  Aviso: Após a confirmação, este formulário será encerrado e não será possível alterar as quantidades informadas. Antes de prosseguir, revise os dados com atenção.
                </p>
              </div>

              {/* Form Inputs */}
              <div className="space-y-3">
                
                {/* 1. Nome do responsável */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-neutral-400" /> Nome do responsável *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Nome completo do responsável"
                    value={confirmedBy}
                    onChange={e => setConfirmedBy(e.target.value)}
                    className="w-full border border-neutral-200 rounded-lg px-3 py-2.5 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900 transition-colors"
                  />
                </div>

                {/* 2. Cargo/função */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1 flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-neutral-400" /> Cargo / Função *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Diretor(a), Coordenador(a), Mantenedor(a)"
                    value={confirmedRole}
                    onChange={e => setConfirmedRole(e.target.value)}
                    className="w-full border border-neutral-200 rounded-lg px-3 py-2.5 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900 transition-colors"
                  />
                </div>

                {/* 3. E-mail */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-neutral-400" /> E-mail *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="seu.email@escola.com.br"
                    value={confirmedEmail}
                    onChange={e => setConfirmedEmail(e.target.value)}
                    className="w-full border border-neutral-200 rounded-lg px-3 py-2.5 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900 transition-colors"
                  />
                </div>

                {/* 4. Celular / Telefone */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-neutral-400" /> Telefone / WhatsApp *
                  </label>
                  <input
                    type="tel"
                    required
                    maxLength={15}
                    placeholder="(11) 99999-8888 ou (11) 3333-4444"
                    value={confirmedPhone}
                    onChange={e => setConfirmedPhone(formatPhoneNumber(e.target.value))}
                    className="w-full border border-neutral-200 rounded-lg px-3 py-2.5 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900 transition-colors font-mono"
                  />
                </div>

                {/* 5. Endereço de entrega (completo com CEP) */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-neutral-400" /> Endereço de entrega (Completo com CEP) *
                  </label>
                  <textarea
                    required
                    rows={2}
                    minLength={10}
                    placeholder="Rua, número, complemento, bairro, cidade/UF e CEP (mínimo 10 caracteres)"
                    value={confirmedAddress}
                    onChange={e => setConfirmedAddress(e.target.value)}
                    className={`w-full border rounded-lg px-3 py-2.5 text-xs text-neutral-900 focus:outline-none transition-colors resize-none ${
                      confirmedAddress.length > 0 && confirmedAddress.trim().length < 10
                        ? 'border-red-300 focus:border-red-500 bg-red-50/20'
                        : 'border-neutral-200 focus:border-neutral-900'
                    }`}
                  />
                  {confirmedAddress.length > 0 && confirmedAddress.trim().length < 10 && (
                    <p className="text-[11px] text-red-600 font-medium mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span>O endereço deve conter no mínimo 10 caracteres ({confirmedAddress.trim().length}/10).</span>
                    </p>
                  )}
                </div>

                {/* Note */}
                <p className="text-[11px] text-neutral-500 italic">
                  Utilizaremos essas informações apenas caso seja necessário entrar em contato sobre esta confirmação.
                </p>

              </div>

              {/* Mandatory Checkbox (Aceite) */}
              <div className="pt-2 border-t border-neutral-100">
                <label className="flex items-start gap-2.5 cursor-pointer group">
                  <input
                    type="checkbox"
                    required
                    checked={hasAcceptedTerms}
                    onChange={e => setHasAcceptedTerms(e.target.checked)}
                    className="mt-0.5 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900 h-4 w-4 shrink-0"
                  />
                  <span className="text-xs text-neutral-700 leading-normal select-none">
                    Declaro que revisei as informações apresentadas e estou de acordo com as quantidades confirmadas, ciente dos prazos de entrega vinculados a esta confirmação.
                  </span>
                </label>
              </div>

              {/* Actions buttons */}
              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsConfirming(false)}
                  className="flex-1 py-3 text-xs font-semibold text-neutral-700 bg-white border border-neutral-200 rounded-xl hover:bg-neutral-50 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={
                    submitting || 
                    !confirmedBy || 
                    !confirmedRole || 
                    !confirmedEmail || 
                    confirmedPhone.replace(/\D/g, '').length < 10 || 
                    confirmedAddress.trim().length < 10 || 
                    !hasAcceptedTerms
                  }
                  className="flex-1 py-3 text-xs font-semibold text-white bg-[#121212] hover:bg-neutral-800 rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Confirmando...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Finalizar confirmação</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ==================== GOOGLE APPS SCRIPT TUTORIAL MODAL ==================== */}
      <AppsScriptModal 
        isOpen={isOpenAppsScript}
        onClose={() => setIsOpenAppsScript(false)}
      />

      {/* Footer */}
      <footer className="border-t border-neutral-200/60 py-6 mt-12 bg-white">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-500">
          <div className="flex items-center gap-2">
            <span className="font-display font-bold text-neutral-800">MINDFUL SCHOOL</span>
            <span>• Confirmação de Quantitativos Escolares 2027</span>
          </div>
          <p className="text-[11px] text-neutral-400">
            Ambiente seguro para homologação de dados B2B.
          </p>
        </div>
      </footer>

    </div>
  );
}
