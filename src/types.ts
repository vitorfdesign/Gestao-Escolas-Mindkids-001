export type LevelKey =
  | 'maternalBaby'
  | 'maternalI'
  | 'maternalII'
  | 'infantilI'
  | 'infantilII'
  | '01ano'
  | '02ano'
  | '03ano'
  | '04ano'
  | '05ano'
  | '06ano'
  | '07ano'
  | '08ano'
  | '09ano'
  | '1serie'
  | '2serie'
  | '3serie';

export interface LevelMetadata {
  key: LevelKey;
  label: string;
  category: 'Educação Infantil' | 'Ensino Fundamental I' | 'Ensino Fundamental II' | 'Ensino Médio';
  imageType: 'infantil' | 'fundamental1' | 'fundamental2' | 'medio';
  description: string;
  imageUrl: string;
}

export interface LevelData {
  alunos: number;
  turmas: number;
}

export type SchoolStatus = string;

export interface School {
  slug: string;
  name: string;
  status: SchoolStatus;
  dataLimite: string; // YYYY-MM-DD
  minima: Record<LevelKey, LevelData>;
  confirmed?: Record<LevelKey, LevelData>; // present if Concluido
  updatedAt?: string;
  confirmedBy?: string;
  confirmedEmail?: string;
  confirmedPhone?: string;
  confirmedAddress?: string;
}

export const LEVELS: LevelMetadata[] = [
  { 
    key: 'maternalBaby', 
    label: 'Maternal baby', 
    category: 'Educação Infantil', 
    imageType: 'infantil', 
    description: 'Livro e materiais de apoio didático',
    imageUrl: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&q=80&w=400'
  },
  { 
    key: 'maternalI', 
    label: 'Maternal I', 
    category: 'Educação Infantil', 
    imageType: 'infantil', 
    description: 'Livro e materiais de apoio didático',
    imageUrl: 'https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&q=80&w=400'
  },
  { 
    key: 'maternalII', 
    label: 'Maternal II', 
    category: 'Educação Infantil', 
    imageType: 'infantil', 
    description: 'Livro e materiais de apoio didático',
    imageUrl: 'https://images.unsplash.com/photo-1587654780291-39c9404d746b?auto=format&fit=crop&q=80&w=400'
  },
  { 
    key: 'infantilI', 
    label: 'Infantil I', 
    category: 'Educação Infantil', 
    imageType: 'infantil', 
    description: 'Livro e materiais de apoio didático',
    imageUrl: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&q=80&w=400'
  },
  { 
    key: 'infantilII', 
    label: 'Infantil II', 
    category: 'Educação Infantil', 
    imageType: 'infantil', 
    description: 'Livro e materiais de apoio didático',
    imageUrl: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&q=80&w=400'
  },
  { 
    key: '01ano', 
    label: '1º Ano (6 anos)', 
    category: 'Ensino Fundamental I', 
    imageType: 'fundamental1', 
    description: 'Livro e materiais de apoio didático',
    imageUrl: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&q=80&w=400'
  },
  { 
    key: '02ano', 
    label: '2º ano (7 anos)', 
    category: 'Ensino Fundamental I', 
    imageType: 'fundamental1', 
    description: 'Livro e materiais de apoio didático',
    imageUrl: 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&q=80&w=400'
  },
  { 
    key: '03ano', 
    label: '3º ano (8 anos)', 
    category: 'Ensino Fundamental I', 
    imageType: 'fundamental1', 
    description: 'Livro e materiais de apoio didático',
    imageUrl: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&q=80&w=400'
  },
  { 
    key: '04ano', 
    label: '4º ano (9 anos)', 
    category: 'Ensino Fundamental I', 
    imageType: 'fundamental1', 
    description: 'Livro e materiais de apoio didático',
    imageUrl: 'https://images.unsplash.com/photo-1513258496099-48168024aec0?auto=format&fit=crop&q=80&w=400'
  },
  { 
    key: '05ano', 
    label: '5º ano (10 anos)', 
    category: 'Ensino Fundamental I', 
    imageType: 'fundamental1', 
    description: 'Livro e materiais de apoio didático',
    imageUrl: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&q=80&w=400'
  },
  { 
    key: '06ano', 
    label: '6º ano (11 anos)', 
    category: 'Ensino Fundamental II', 
    imageType: 'fundamental2', 
    description: 'Livro e materiais de apoio didático',
    imageUrl: 'https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&q=80&w=400'
  },
  { 
    key: '07ano', 
    label: '7º ano (12 anos)', 
    category: 'Ensino Fundamental II', 
    imageType: 'fundamental2', 
    description: 'Livro e materiais de apoio didático',
    imageUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&q=80&w=400'
  },
  { 
    key: '08ano', 
    label: '8º ano (13 anos)', 
    category: 'Ensino Fundamental II', 
    imageType: 'fundamental2', 
    description: 'Livro e materiais de apoio didático',
    imageUrl: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&q=80&w=400'
  },
  { 
    key: '09ano', 
    label: '9º ano (14 anos)', 
    category: 'Ensino Fundamental II', 
    imageType: 'fundamental2', 
    description: 'Livro e materiais de apoio didático',
    imageUrl: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&q=80&w=400'
  },
  { 
    key: '1serie', 
    label: '1ª série (15 anos)', 
    category: 'Ensino Médio', 
    imageType: 'medio', 
    description: 'Livro e materiais de apoio didático',
    imageUrl: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=400'
  },
  { 
    key: '2serie', 
    label: '2ª série (16 anos)', 
    category: 'Ensino Médio', 
    imageType: 'medio', 
    description: 'Livro e materiais de apoio didático',
    imageUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=400'
  },
  { 
    key: '3serie', 
    label: '3ª série (17 anos)', 
    category: 'Ensino Médio', 
    imageType: 'medio', 
    description: 'Livro e materiais de apoio didático',
    imageUrl: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&q=80&w=400'
  }
];
