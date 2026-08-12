import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { fileURLToPath } from 'url';

// Define ES Modules equivalents for file paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// In-memory "Google Sheets" simulator database
interface LevelData {
  alunos: number;
  turmas: number;
}

interface School {
  slug: string;
  name: string;
  status: 'Aberto' | 'Concluido';
  dataLimite: string; // YYYY-MM-DD
  minima: Record<string, LevelData>;
  confirmed?: Record<string, LevelData>;
  updatedAt?: string;
  confirmedBy?: string;
  confirmedEmail?: string;
  confirmedPhone?: string;
  confirmedAddress?: string;
}

// Helper to seed default schools
const initialSchools: Record<string, School> = {
  'algodao-doce': {
    slug: 'algodao-doce',
    name: 'Escola Algodão Doce',
    status: 'Aberto',
    dataLimite: '2026-12-05',
    minima: {
      maternal_baby: { turmas: 2, alunos: 4 },
      g3: { turmas: 2, alunos: 19 },
      g4: { turmas: 2, alunos: 26 },
      g5: { turmas: 3, alunos: 42 },
      '01ano': { turmas: 3, alunos: 38 },
      '02ano': { turmas: 4, alunos: 44 },
      '03ano': { turmas: 3, alunos: 38 },
      '04ano': { turmas: 2, alunos: 29 },
      '05ano': { turmas: 2, alunos: 27 },
      '06ano': { turmas: 3, alunos: 35 },
      '07ano': { turmas: 0, alunos: 0 },
      '08ano': { turmas: 0, alunos: 0 },
      '09ano': { turmas: 0, alunos: 0 },
      '1serie': { turmas: 0, alunos: 0 },
      '2serie': { turmas: 0, alunos: 0 },
      '3serie': { turmas: 0, alunos: 0 }
    }
  },
  'colegio-objetivo': {
    slug: 'colegio-objetivo',
    name: 'Colégio Objetivo - Unidade Central',
    status: 'Aberto',
    dataLimite: '2026-12-05',
    minima: {
      maternal_baby: { alunos: 8, turmas: 1 },
      g3: { alunos: 12, turmas: 1 },
      g4: { alunos: 15, turmas: 1 },
      g5: { alunos: 15, turmas: 1 },
      '01ano': { alunos: 20, turmas: 1 },
      '02ano': { alunos: 20, turmas: 1 },
      '03ano': { alunos: 22, turmas: 1 },
      '04ano': { alunos: 22, turmas: 1 },
      '05ano': { alunos: 25, turmas: 1 },
      '06ano': { alunos: 30, turmas: 2 },
      '07ano': { alunos: 30, turmas: 2 },
      '08ano': { alunos: 28, turmas: 2 },
      '09ano': { alunos: 0, turmas: 0 },
      '1serie': { alunos: 0, turmas: 0 },
      '2serie': { alunos: 0, turmas: 0 },
      '3serie': { alunos: 0, turmas: 0 }
    }
  },
  'colegio-mindful': {
    slug: 'colegio-mindful',
    name: 'Colégio Mindful - Vila Mariana',
    status: 'Concluido',
    dataLimite: '2026-12-05',
    minima: {
      maternal_baby: { alunos: 5, turmas: 1 },
      g3: { alunos: 8, turmas: 1 },
      g4: { alunos: 10, turmas: 1 },
      g5: { alunos: 10, turmas: 1 },
      '01ano': { alunos: 15, turmas: 1 },
      '02ano': { alunos: 15, turmas: 1 },
      '03ano': { alunos: 18, turmas: 1 },
      '04ano': { alunos: 18, turmas: 1 },
      '05ano': { alunos: 20, turmas: 1 },
      '06ano': { alunos: 22, turmas: 2 },
      '07ano': { alunos: 22, turmas: 2 },
      '08ano': { alunos: 20, turmas: 2 },
      '09ano': { alunos: 0, turmas: 0 },
      '1serie': { alunos: 0, turmas: 0 },
      '2serie': { alunos: 0, turmas: 0 },
      '3serie': { alunos: 0, turmas: 0 }
    },
    confirmed: {
      maternal_baby: { alunos: 7, turmas: 1 },
      g3: { alunos: 10, turmas: 2 },
      g4: { alunos: 12, turmas: 1 },
      g5: { alunos: 14, turmas: 2 },
      '01ano': { alunos: 18, turmas: 1 },
      '02ano': { alunos: 19, turmas: 2 },
      '03ano': { alunos: 21, turmas: 2 },
      '04ano': { alunos: 20, turmas: 1 },
      '05ano': { alunos: 22, turmas: 2 },
      '06ano': { alunos: 26, turmas: 2 },
      '07ano': { alunos: 25, turmas: 2 },
      '08ano': { alunos: 24, turmas: 2 },
      '09ano': { alunos: 0, turmas: 0 },
      '1serie': { alunos: 0, turmas: 0 },
      '2serie': { alunos: 0, turmas: 0 },
      '3serie': { alunos: 0, turmas: 0 }
    },
    updatedAt: '2026-07-01T14:30:00-03:00',
    confirmedBy: 'Ana Souza (Diretora Pedagógica)',
    confirmedEmail: 'ana.souza@mindful.edu.br',
    confirmedPhone: '(11) 98888-7777',
    confirmedAddress: 'Rua Domingos de Morais, 1200 - São Paulo/SP - CEP 04010-100'
  },
  'escola-lumiar': {
    slug: 'escola-lumiar',
    name: 'Escola Lumiar - Jardim Paulistano',
    status: 'Aberto',
    dataLimite: '2026-06-15', // Expired
    minima: {
      maternal_baby: { alunos: 4, turmas: 1 },
      g3: { alunos: 5, turmas: 1 },
      g4: { alunos: 6, turmas: 1 },
      g5: { alunos: 8, turmas: 1 },
      '01ano': { alunos: 12, turmas: 1 },
      '02ano': { alunos: 12, turmas: 1 },
      '03ano': { alunos: 14, turmas: 1 },
      '04ano': { alunos: 14, turmas: 1 },
      '05ano': { alunos: 15, turmas: 1 },
      '06ano': { alunos: 18, turmas: 1 },
      '07ano': { alunos: 18, turmas: 1 },
      '08ano': { alunos: 18, turmas: 1 },
      '09ano': { alunos: 0, turmas: 0 },
      '1serie': { alunos: 0, turmas: 0 },
      '2serie': { alunos: 0, turmas: 0 },
      '3serie': { alunos: 0, turmas: 0 }
    }
  }
};

let dbSchools: Record<string, School> = { ...initialSchools };

// ---------------- API Routes ----------------

// Get all schools inside the sheets simulator database
app.get('/api/admin/schools', (req, res) => {
  res.json(Object.values(dbSchools));
});

// Reset database to initial state
app.post('/api/admin/reset-db', (req, res) => {
  dbSchools = JSON.parse(JSON.stringify(initialSchools));
  res.json({ success: true, message: 'Simulated database restored to default states.' });
});

// Update school details directly from the "Admin Sheets Emulator" UI
app.post('/api/admin/update-school', (req, res) => {
  const { slug, name, status, dataLimite, minima } = req.body;
  if (!slug) {
    return res.status(400).json({ error: 'Slug is required' });
  }

  if (!dbSchools[slug]) {
    // Create new school on-the-fly
    dbSchools[slug] = {
      slug,
      name: name || 'Nova Escola',
      status: status || 'Aberto',
      dataLimite: dataLimite || '2026-07-31',
      minima: minima || {
        g2: { alunos: 5, turmas: 1 },
        g3: { alunos: 5, turmas: 1 },
        g4: { alunos: 5, turmas: 1 },
        g5: { alunos: 5, turmas: 1 },
        '01ano': { alunos: 10, turmas: 1 },
        '02ano': { alunos: 10, turmas: 1 },
        '03ano': { alunos: 10, turmas: 1 },
        '04ano': { alunos: 10, turmas: 1 },
        '05ano': { alunos: 10, turmas: 1 },
        '06ano': { alunos: 15, turmas: 1 },
        '07ano': { alunos: 15, turmas: 1 },
        '08ano': { alunos: 15, turmas: 1 }
      }
    };
  } else {
    // Update existing
    if (name) dbSchools[slug].name = name;
    if (status) dbSchools[slug].status = status;
    if (dataLimite) dbSchools[slug].dataLimite = dataLimite;
    if (minima) dbSchools[slug].minima = minima;
    
    // If status changed back to open, clear previous confirmation
    if (status === 'Aberto') {
      delete dbSchools[slug].confirmed;
      delete dbSchools[slug].updatedAt;
      delete dbSchools[slug].confirmedBy;
    }
  }

  res.json({ success: true, school: dbSchools[slug] });
});

// Fetch school data by slug
app.get('/api/school/:slug', (req, res) => {
  const { slug } = req.params;
  const school = dbSchools[slug];
  
  if (!school) {
    return res.status(404).json({ error: `Escola não encontrada com o slug: "${slug}"` });
  }
  
  res.json(school);
});

// Confirm quantities (write quantities to the sheet)
app.post('/api/school/:slug/confirm', (req, res) => {
  const { 
    slug 
  } = req.params;
  const { 
    confirmedQuantities, 
    confirmedBy, 
    escolaAtual,
    confirmedEmail,
    confirmedPhone,
    confirmedAddress 
  } = req.body;
  
  console.log(`[Google Sheets Webhook API] Gravando dados para a aba/escola "${escolaAtual || slug}" (slug: ${slug}).`);

  const school = dbSchools[slug];
  if (!school) {
    return res.status(404).json({ error: `Escola não encontrada` });
  }

  if (school.status === 'Concluido') {
    return res.status(400).json({ error: 'O quantitativo para esta escola já foi concluído anteriormente.' });
  }

  // Validate non-negative numbers
  if (confirmedQuantities) {
    for (const level in confirmedQuantities) {
      const confVal = confirmedQuantities[level];
      if (confVal && (confVal.alunos < 0 || confVal.turmas < 0)) {
        return res.status(400).json({ error: `Quantitativos para o nível ${level} não podem ser negativos.` });
      }
    }
  }

  // Record confirmation
  school.status = 'Concluido';
  school.confirmed = confirmedQuantities;
  school.updatedAt = new Date().toISOString();
  school.confirmedBy = confirmedBy || 'Gestor Responsável';
  school.confirmedEmail = confirmedEmail || '';
  school.confirmedPhone = confirmedPhone || '';
  school.confirmedAddress = confirmedAddress || '';

  res.json({
    success: true,
    message: 'Quantitativo confirmado e gravado no "Google Sheets" simulado com sucesso!',
    school
  });
});

// Reset a specific school's status to Aberto for testing
app.post('/api/school/:slug/reset', (req, res) => {
  const { slug } = req.params;
  const school = dbSchools[slug];
  if (!school) {
    return res.status(404).json({ error: `Escola não encontrada` });
  }
  school.status = 'Aberto';
  delete school.confirmed;
  delete school.updatedAt;
  delete school.confirmedBy;

  res.json({ success: true, message: 'Escola reiniciada para estado Aberto.', school });
});


// ---------------- Vite Middleware Setup ----------------

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
