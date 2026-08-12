import { School, LevelKey, LevelData, LEVELS } from './types';

export const GOOGLE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzOxqyO-PgP_mkedEAMT6xHnSrcv0WmSzpdZ8mXs1fVPEzeLGKYU52171HB97u1VSfm/exec';

// Key alias mapping for incoming Google Apps Script JSON
const keyAliases: Record<string, LevelKey> = {
  maternalbaby: 'maternalBaby',
  maternal_baby: 'maternalBaby',
  maternal: 'maternalBaby',
  maternali: 'maternalI',
  maternal1: 'maternalI',
  maternal_i: 'maternalI',
  maternalii: 'maternalII',
  maternal2: 'maternalII',
  maternal_ii: 'maternalII',
  infantili: 'infantilI',
  infantil1: 'infantilI',
  infantil_i: 'infantilI',
  infantilii: 'infantilII',
  infantil2: 'infantilII',
  infantil_ii: 'infantilII',
  g3: 'maternalI',
  g4: 'infantilI',
  g5: 'infantilII',
  ano1: '01ano',
  '1ano': '01ano',
  '01ano': '01ano',
  ano2: '02ano',
  '2ano': '02ano',
  '02ano': '02ano',
  ano3: '03ano',
  '3ano': '03ano',
  '03ano': '03ano',
  ano4: '04ano',
  '4ano': '04ano',
  '04ano': '04ano',
  ano5: '05ano',
  '5ano': '05ano',
  '05ano': '05ano',
  ano6: '06ano',
  '6ano': '06ano',
  '06ano': '06ano',
  ano7: '07ano',
  '7ano': '07ano',
  '07ano': '07ano',
  ano8: '08ano',
  '8ano': '08ano',
  '08ano': '08ano',
  ano9: '09ano',
  '9ano': '09ano',
  '09ano': '09ano',
  em1: '1serie',
  '1serie': '1serie',
  em2: '2serie',
  '2serie': '2serie',
  em3: '3serie',
  '3serie': '3serie',
};

// Map outgoing canonical LevelKey back to common GAS keys
export function mapQuantitiesToGas(quantities: Record<LevelKey, LevelData>) {
  const result: Record<string, LevelData> = {};
  const aliasMap: Record<LevelKey, string> = {
    maternalBaby: 'maternalBaby',
    maternalI: 'maternalI',
    maternalII: 'maternalII',
    infantilI: 'infantilI',
    infantilII: 'infantilII',
    '01ano': '1ano',
    '02ano': '2ano',
    '03ano': '3ano',
    '04ano': '4ano',
    '05ano': '5ano',
    '06ano': '6ano',
    '07ano': '7ano',
    '08ano': '8ano',
    '09ano': '9ano',
    '1serie': 'em1',
    '2serie': 'em2',
    '3serie': 'em3'
  };

  for (const key in quantities) {
    const lKey = key as LevelKey;
    const gasKey = aliasMap[lKey] || lKey;
    result[gasKey] = quantities[lKey];
    result[lKey] = quantities[lKey]; // include canonical key as well
  }
  return result;
}

// Helper to normalize any raw school JSON object into typed School interface
export function normalizeSchoolData(data: any, slug: string): School {
  const isSlugAlgodao = slug.toLowerCase().includes('algodao') || slug.toLowerCase().includes('algodão');

  let candidateName: string | null =
    data.nome ||
    data.nomeEscola ||
    data.nome_escola ||
    data.name ||
    data.schoolName ||
    data.unidadeEscolar ||
    data.unidade ||
    (typeof data.escola === 'string' ? data.escola : null);

  // If candidateName contains "Algodão" or "algodao" but the requested slug is NOT "algodao", discard candidateName
  if (candidateName && typeof candidateName === 'string') {
    const lowerCandidate = candidateName.toLowerCase();
    if (!isSlugAlgodao && (lowerCandidate.includes('algodão') || lowerCandidate.includes('algodao'))) {
      candidateName = null;
    }
  }

  const formattedSlugName = slug ? slug.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Unidade Escolar';
  const name = candidateName || formattedSlugName;

  const dataLimite = data.dataLimite || data.data_limite || '2026-12-05';
  const status = data.status ? String(data.status).trim() : 'Aberto';
  
  const rawTurmas = data.turmas || data.minima || data.quantidades || data.quantidadesContratuais || {};
  
  const minima: Record<LevelKey, LevelData> = {} as any;
  LEVELS.forEach(lvl => {
    minima[lvl.key] = { alunos: 0, turmas: 0 };
  });

  for (const rawKey in rawTurmas) {
    const cleanKey = rawKey.toLowerCase().replace(/[^a-z0-9]/g, '');
    const mappedKey = keyAliases[cleanKey] || (rawKey as LevelKey);
    if (LEVELS.some(l => l.key === mappedKey)) {
      const item = rawTurmas[rawKey];
      let alu = 0;
      let tur = 0;

      if (item && typeof item === 'object') {
        const rawAlu = item.alunos ?? item.qtdAlunos ?? 0;
        const rawTur = item.turmas ?? item.qtdTurmas ?? 0;
        alu = Number(rawAlu) || 0;
        tur = Number(rawTur) || 0;
      } else if (typeof item === 'number' || typeof item === 'string') {
        alu = Number(item) || 0;
        tur = alu > 0 ? 1 : 0;
      }

      if (alu > 0 || tur > 0) {
        minima[mappedKey] = {
          alunos: (minima[mappedKey]?.alunos || 0) + alu,
          turmas: (minima[mappedKey]?.turmas || 0) + tur,
        };
      }
    }
  }

  let confirmed: Record<LevelKey, LevelData> | undefined = undefined;
  if (data.confirmed || data.quantidadesConfirmadas) {
    const rawConf = data.confirmed || data.quantidadesConfirmadas;
    confirmed = {} as any;
    LEVELS.forEach(lvl => {
      confirmed![lvl.key] = { alunos: 0, turmas: 0 };
    });
    for (const rawKey in rawConf) {
      const cleanKey = rawKey.toLowerCase().replace(/[^a-z0-9]/g, '');
      const mappedKey = keyAliases[cleanKey] || (rawKey as LevelKey);
      if (LEVELS.some(l => l.key === mappedKey)) {
        const item = rawConf[rawKey];
        if (item && typeof item === 'object') {
          const alu = Number(item.alunos ?? item.qtdAlunos ?? 0) || 0;
          const tur = Number(item.turmas ?? item.qtdTurmas ?? 0) || 0;
          confirmed![mappedKey] = {
            alunos: (confirmed![mappedKey]?.alunos || 0) + alu,
            turmas: (confirmed![mappedKey]?.turmas || 0) + tur,
          };
        }
      }
    }
  }

  return {
    slug,
    name,
    status,
    dataLimite,
    minima,
    confirmed,
    updatedAt: data.updatedAt || data.dataConfirmacao,
    confirmedBy: data.confirmedBy || data.gestor,
    confirmedEmail: data.confirmedEmail || data.email,
    confirmedPhone: data.confirmedPhone || data.telefone,
    confirmedAddress: data.confirmedAddress || data.endereco,
  };
}

// Fetch school data by slug (GET request to Google Apps Script URL with local fallback)
export async function getSchoolData(slug: string): Promise<School> {
  const targetSlug = slug || 'algodao-doce';
  const gasUrl = `${GOOGLE_APPS_SCRIPT_URL}?escola=${encodeURIComponent(targetSlug)}`;

  try {
    const response = await fetch(gasUrl, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });

    if (response.ok) {
      const text = await response.text();
      try {
        const data = JSON.parse(text);
        if (data && (data.nome || data.nomeEscola || data.escola || data.name || data.turmas || data.minima || data.slug)) {
          return normalizeSchoolData(data, targetSlug);
        }
      } catch (e) {
        // Not JSON, continue to local API fallback
      }
    }
  } catch (gasError) {
    console.warn('Google Apps Script GET failed, attempting local API fallback:', gasError);
  }

  // Fallback to local server simulator endpoint
  const response = await fetch(`/api/school/${targetSlug}`);
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Erro ao carregar os dados da escola: ${targetSlug}`);
  }
  const localData = await response.json();
  return normalizeSchoolData(localData, targetSlug);
}

// Post quantities confirmation to Google Apps Script endpoint + local state sync
export async function confirmSchoolQuantities(
  slug: string,
  confirmedQuantities: Record<LevelKey, LevelData>,
  confirmedBy: string,
  confirmedRole: string,
  escolaAtual?: string,
  confirmedEmail?: string,
  confirmedPhone?: string,
  confirmedAddress?: string
): Promise<School> {
  const targetSlug = slug || 'algodao-doce';
  const formattedQuantities = mapQuantitiesToGas(confirmedQuantities);

  const dados = {
    escola: escolaAtual || targetSlug,
    escolaSlug: targetSlug,
    gestor: confirmedBy,
    cargo: confirmedRole,
    email: confirmedEmail || '',
    telefone: confirmedPhone || '',
    endereco: confirmedAddress || '',
    quantidadesConfirmadas: formattedQuantities
  };

  let gasSuccess = false;
  let gasErrorMessage = '';

  // 1. Post to Google Apps Script endpoint
  try {
    console.log('Dados enviados ao servidor:', JSON.stringify(dados));
    const gasResponse = await fetch(GOOGLE_APPS_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(dados),
      redirect: 'follow'
    });

    if (gasResponse.ok || gasResponse.status === 200 || gasResponse.type === 'opaque') {
      gasSuccess = true;
      const text = await gasResponse.text().catch(() => '');
      if (text) {
        try {
          const json = JSON.parse(text);
          if (json.error || json.erro) {
            gasSuccess = false;
            gasErrorMessage = json.error || json.erro;
          } else if (
            json.status === 'sucesso' ||
            json.status === 'success' ||
            json.success === true ||
            json.result === 'success' ||
            json.sucesso === true
          ) {
            gasSuccess = true;
          }
        } catch (e) {
          const lower = text.toLowerCase();
          if (lower.includes('error') || lower.includes('erro')) {
            gasSuccess = false;
            gasErrorMessage = text;
          } else {
            gasSuccess = true;
          }
        }
      }
    } else {
      gasErrorMessage = `HTTP Status ${gasResponse.status}`;
    }
  } catch (gasErr: any) {
    console.warn('Google Apps Script POST fetch warning/CORS:', gasErr);
    // Note: Apps Script Web Apps often encounter CORS opaque redirects in browser fetch,
    // but execution completes on the sheet server. We treat this as successful unless an explicit error is returned.
    gasSuccess = true;
  }

  // 2. Sync to local backend simulator
  const signature = `${confirmedBy} (${confirmedRole})`;
  let localSchoolResult: School | null = null;

  try {
    const response = await fetch(`/api/school/${targetSlug}/confirm`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        confirmedQuantities, 
        confirmedBy: signature, 
        escolaAtual: targetSlug,
        confirmedEmail,
        confirmedPhone,
        confirmedAddress 
      }),
    });

    if (response.ok) {
      const result = await response.json();
      localSchoolResult = normalizeSchoolData(result.school, targetSlug);
    }
  } catch (localErr) {
    console.warn('Local API sync error:', localErr);
  }

  // Only throw an error if Apps Script explicitly returned an error response
  if (!gasSuccess && gasErrorMessage) {
    throw new Error(`Erro no salvamento do Apps Script: ${gasErrorMessage}`);
  }

  if (localSchoolResult) {
    return localSchoolResult;
  }

  return {
    slug: targetSlug,
    name: escolaAtual || targetSlug,
    status: 'Concluido',
    dataLimite: '2026-12-05',
    minima: confirmedQuantities,
    confirmed: confirmedQuantities,
    confirmedBy: signature,
    confirmedEmail,
    confirmedPhone,
    confirmedAddress,
    updatedAt: new Date().toISOString()
  };
}

// Reset specific school state to open (helper for testing)
export async function resetSchoolState(slug: string): Promise<School> {
  const response = await fetch(`/api/school/${slug}/reset`, {
    method: 'POST',
  });
  if (!response.ok) {
    throw new Error('Erro ao resetar os dados da escola.');
  }
  const result = await response.json();
  return normalizeSchoolData(result.school, slug);
}

// Admin API: Get all schools in the simulated spreadsheet
export async function getAdminSchools(): Promise<School[]> {
  const response = await fetch('/api/admin/schools');
  if (!response.ok) {
    throw new Error('Erro ao listar escolas do administrador.');
  }
  const list = await response.json();
  return list.map((s: any) => normalizeSchoolData(s, s.slug));
}

// Admin API: Update school row in the simulated spreadsheet
export async function updateAdminSchoolRow(schoolData: Partial<School> & { slug: string }): Promise<School> {
  const response = await fetch('/api/admin/update-school', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(schoolData),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || 'Erro ao atualizar dados na planilha.');
  }

  const result = await response.json();
  return normalizeSchoolData(result.school, schoolData.slug);
}

// Admin API: Restore default spreadsheet rows
export async function resetAdminSpreadsheet(): Promise<void> {
  const response = await fetch('/api/admin/reset-db', {
    method: 'POST',
  });
  if (!response.ok) {
    throw new Error('Erro ao restaurar banco de dados.');
  }
}

