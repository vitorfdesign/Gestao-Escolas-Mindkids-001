import { School, LevelKey, LevelData, LEVELS } from './types';

export const GOOGLE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzC4butaSzrEqT8XYUfSmS3vcHYki0WcpkmNdIa8ZlVGnij1ocjGlZgJKBw9Ekr0JL2/exec';

// Key alias mapping for incoming Google Apps Script JSON
const keyAliases: Record<string, LevelKey> = {
  maternalbaby: 'maternal_baby',
  maternal_baby: 'maternal_baby',
  maternal: 'maternal_baby',
  g3: 'g3',
  g4: 'g4',
  g5: 'g5',
  '1ano': '01ano',
  '01ano': '01ano',
  '2ano': '02ano',
  '02ano': '02ano',
  '3ano': '03ano',
  '03ano': '03ano',
  '4ano': '04ano',
  '04ano': '04ano',
  '5ano': '05ano',
  '05ano': '05ano',
  '6ano': '06ano',
  '06ano': '06ano',
  '7ano': '07ano',
  '07ano': '07ano',
  '8ano': '08ano',
  '08ano': '08ano',
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
    maternal_baby: 'maternalBaby',
    g3: 'g3',
    g4: 'g4',
    g5: 'g5',
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
  const name = data.name || data.escola || data.nomeEscola || 'Escola Algodão Doce';
  const dataLimite = data.dataLimite || data.data_limite || '2026-12-05';
  const status = data.status === 'Concluido' || data.status === 'Concluído' ? 'Concluido' : 'Aberto';
  
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
      if (item && typeof item === 'object') {
        minima[mappedKey] = {
          alunos: Number(item.alunos ?? item.qtdAlunos ?? 0),
          turmas: Number(item.turmas ?? item.qtdTurmas ?? 0),
        };
      } else if (typeof item === 'number') {
        minima[mappedKey] = { alunos: Number(item), turmas: 1 };
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
          confirmed![mappedKey] = {
            alunos: Number(item.alunos ?? item.qtdAlunos ?? 0),
            turmas: Number(item.turmas ?? item.qtdTurmas ?? 0),
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
        if (data && (data.escola || data.name || data.turmas || data.minima)) {
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

  const payload = {
    escola: escolaAtual || targetSlug,
    gestor: confirmedBy,
    cargo: confirmedRole,
    email: confirmedEmail || '',
    telefone: confirmedPhone || '',
    endereco: confirmedAddress || '',
    quantidadesConfirmadas: formattedQuantities
  };

  // 1. Post to Google Apps Script endpoint
  try {
    await fetch(GOOGLE_APPS_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
    });
  } catch (gasErr) {
    console.warn('Google Apps Script POST attempted:', gasErr);
  }

  // 2. Sync to local backend simulator
  const signature = `${confirmedBy} (${confirmedRole})`;
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

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || 'Erro ao salvar os quantitativos.');
  }

  const result = await response.json();
  return normalizeSchoolData(result.school, targetSlug);
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

