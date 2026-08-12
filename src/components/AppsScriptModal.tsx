import React, { useState } from 'react';
import { Clipboard, Check, Code, HelpCircle, X } from 'lucide-react';

interface AppsScriptModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AppsScriptModal({ isOpen, onClose }: AppsScriptModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const codeString = `/**
 * GOOGLE APPS SCRIPT - MINDFUL SCHOOL QUANTITATIVES INTEGRATION
 * 
 * Paste this code into your Google Spreadsheet:
 * Extensions -> Apps Script
 * 
 * Create two sheets in your spreadsheet:
 * 1. "Configurações" (Columns: Slug, EscolaNome, Status, DataLimite, Min_g2_alunos, Min_g2_turmas, Min_g3_alunos, etc.)
 * 2. "Confirmacoes_Log" (Columns: Timestamp, Slug, EscolaNome, ConfirmedBy, Nivel, Alunos, Turmas)
 */

const CONFIG_SHEET_NAME = "Configurações";
const LOG_SHEET_NAME = "Confirmacoes_Log";

// GET REQUEST - Returns school details by slug
function doGet(e) {
  const slug = e.parameter.slug;
  if (!slug) {
    return createJsonResponse({ error: "Parâmetro 'slug' é obrigatório." }, 400);
  }
  
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const configSheet = spreadsheet.getSheetByName(CONFIG_SHEET_NAME);
  if (!configSheet) {
    return createJsonResponse({ error: "Aba '" + CONFIG_SHEET_NAME + "' não encontrada." }, 500);
  }
  
  const data = configSheet.getDataRange().getValues();
  const headers = data[0];
  
  // Find row matching the slug
  let schoolRow = null;
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === slug) {
      schoolRow = data[i];
      break;
    }
  }
  
  if (!schoolRow) {
    return createJsonResponse({ error: "Escola com slug '" + slug + "' não cadastrada." }, 404);
  }
  
  // Format response matching our frontend model
  const school = {
    slug: schoolRow[0],
    name: schoolRow[1],
    status: schoolRow[2],
    dataLimite: formatDate(schoolRow[3]),
    minima: {},
    confirmed: {}
  };
  
  // Map levels (g2, g3, g4, g5, 01ano, 02ano, 03ano, 04ano, 05ano, 06ano, 07ano, 08ano)
  const levels = ["g2", "g3", "g4", "g5", "01ano", "02ano", "03ano", "04ano", "05ano", "06ano", "07ano", "08ano"];
  
  levels.forEach(level => {
    // Determine column index for level minima
    const colAlunosName = "Min_" + level + "_alunos";
    const colTurmasName = "Min_" + level + "_turmas";
    
    const idxAlunos = headers.indexOf(colAlunosName);
    const idxTurmas = headers.indexOf(colTurmasName);
    
    school.minima[level] = {
      alunos: idxAlunos !== -1 ? Number(schoolRow[idxAlunos]) || 0 : 0,
      turmas: idxTurmas !== -1 ? Number(schoolRow[idxTurmas]) || 0 : 0
    };
  });
  
  // If completed, fetch logs or values
  if (school.status === "Concluido") {
    const logSheet = spreadsheet.getSheetByName(LOG_SHEET_NAME);
    if (logSheet) {
      const logData = logSheet.getDataRange().getValues();
      school.confirmed = {};
      
      // Filter latest entries for this school slug
      for (let j = logData.length - 1; j >= 1; j--) {
        const logRow = logData[j];
        if (logRow[1] === slug) {
          const lvl = logRow[4];
          const alu = Number(logRow[5]) || 0;
          const tur = Number(logRow[6]) || 0;
          
          if (levels.indexOf(lvl) !== -1 && !school.confirmed[lvl]) {
            school.confirmed[lvl] = { alunos: alu, turmas: tur };
            school.confirmedBy = logRow[3];
            school.updatedAt = logRow[0];
          }
        }
      }
    }
  }
  
  return createJsonResponse(school);
}

// POST REQUEST - Receives finalized school quantities and writes back to Sheet
function doPost(e) {
  try {
    const postData = JSON.parse(e.postData.contents);
    const slug = postData.slug;
    const confirmedQuantities = postData.confirmedQuantities;
    const confirmedBy = postData.confirmedBy || "Gestor";
    
    if (!slug || !confirmedQuantities) {
      return createJsonResponse({ error: "Campos obrigatórios ausentes." }, 400);
    }
    
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const configSheet = spreadsheet.getSheetByName(CONFIG_SHEET_NAME);
    const logSheet = spreadsheet.getSheetByName(LOG_SHEET_NAME) || spreadsheet.insertSheet(LOG_SHEET_NAME);
    
    // 1. Update Status to 'Concluido' in Configurações sheet
    const configData = configSheet.getDataRange().getValues();
    let rowIndex = -1;
    for (let i = 1; i < configData.length; i++) {
      if (configData[i][0] === slug) {
        rowIndex = i + 1; // 1-indexed for sheets
        break;
      }
    }
    
    if (rowIndex === -1) {
      return createJsonResponse({ error: "Escola com slug '" + slug + "' não encontrada." }, 404);
    }
    
    // Update 'Status' column (Assumed Column C / Index 3)
    configSheet.getRange(rowIndex, 3).setValue("Concluido");
    
    // 2. Append entries to Confirmacoes_Log
    const timestamp = new Date();
    const schoolName = configData[rowIndex - 1][1];
    
    // If log is empty, append header
    if (logSheet.getLastRow() === 0) {
      logSheet.appendRow(["Timestamp", "Slug", "EscolaNome", "ConfirmadoPor", "Nivel", "Alunos", "Turmas"]);
    }
    
    Object.keys(confirmedQuantities).forEach(level => {
      const data = confirmedQuantities[level];
      logSheet.appendRow([
        timestamp,
        slug,
        schoolName,
        confirmedBy,
        level,
        data.alunos,
        data.turmas
      ]);
    });
    
    return createJsonResponse({ success: true, message: "Quantitativos gravados e consolidados." });
    
  } catch (error) {
    return createJsonResponse({ error: error.toString() }, 500);
  }
}

// Helpers
function createJsonResponse(data, statusCode = 200) {
  const output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}

function formatDate(dateVal) {
  if (dateVal instanceof Date) {
    const y = dateVal.getFullYear();
    const m = String(dateVal.getMonth() + 1).padStart(2, "0");
    const d = String(dateVal.getDate()).padStart(2, "0");
    return y + "-" + m + "-" + d;
  }
  return String(dateVal);
}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(codeString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div 
        id="apps-script-modal"
        className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden flex flex-col border border-neutral-100"
      >
        {/* Header */}
        <div className="p-6 border-b border-neutral-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-neutral-50 rounded-lg text-neutral-800">
              <Code className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-lg text-neutral-900">Integração com Google Sheets</h3>
              <p className="text-xs text-neutral-500">Código pronto para Google Apps Script (doGet & doPost)</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-neutral-900 rounded-full hover:bg-neutral-50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Instructions */}
        <div className="p-6 bg-neutral-50 border-b border-neutral-100 text-sm text-neutral-600 space-y-2">
          <p className="font-medium text-neutral-800 flex items-center gap-1.5">
            <HelpCircle className="w-4 h-4 text-violet-500" /> Como configurar na planilha oficial:
          </p>
          <ol className="list-decimal pl-5 space-y-1 text-xs">
            <li>Abra sua planilha Google Sheets e crie uma aba com o nome exato <code className="bg-white px-1.5 py-0.5 rounded border border-neutral-200 font-mono text-neutral-800 font-semibold">Configurações</code>.</li>
            <li>Cadastre as colunas básicas nas primeiras células da linha 1 (A: Slug, B: EscolaNome, C: Status, D: DataLimite) e depois as colunas <code className="bg-white px-1.5 py-0.5 rounded border border-neutral-200 font-mono text-neutral-800">Min_g2_alunos</code>, <code className="bg-white px-1.5 py-0.5 rounded border border-neutral-200 font-mono text-neutral-800">Min_g2_turmas</code>, etc., até o 08ano.</li>
            <li>Clique no menu superior: <strong>Extensões</strong> &gt; <strong>Apps Script</strong>.</li>
            <li>Substitua todo o código existente pelo código abaixo, salve, e clique em <strong>Implantar</strong> &gt; <strong>Nova Implantação</strong> (Tipo: App da Web, Acesso: Qualquer pessoa).</li>
            <li>Copie a URL gerada e configure em seu ambiente. O App fará fetch direto nela!</li>
          </ol>
        </div>

        {/* Code Block */}
        <div className="flex-1 overflow-y-auto p-6 font-mono text-[11px] leading-relaxed bg-neutral-900 text-neutral-300 relative">
          <button
            onClick={copyToClipboard}
            className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white rounded-lg py-1.5 px-3 flex items-center gap-2 text-xs transition-colors backdrop-blur-sm"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-green-400" />
                <span>Copiado!</span>
              </>
            ) : (
              <>
                <Clipboard className="w-3.5 h-3.5" />
                <span>Copiar Código</span>
              </>
            )}
          </button>
          <pre className="overflow-x-auto whitespace-pre">{codeString}</pre>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-100 bg-neutral-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-medium text-neutral-700 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 shadow-sm transition-all-custom"
          >
            Fechar Janela
          </button>
        </div>
      </div>
    </div>
  );
}
