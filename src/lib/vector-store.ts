// src/lib/vector-store.ts
import PDFParser from 'pdf2json';
import fs from 'fs/promises';
import path from 'path';
import { ChatGroq } from '@langchain/groq';
import { query } from '@/lib/db';

const llm = new ChatGroq({ model: 'llama-3.3-70b-versatile', temperature: 0.1 });

// ─────────────────────────────────────────────────────────────
// Shared: extract text from PDF attachments
// ─────────────────────────────────────────────────────────────
async function extractPdfText(attachmentPaths: string[]): Promise<string> {
  const pdfPaths = attachmentPaths.filter(p =>
    typeof p === 'string' && p.toLowerCase().endsWith('.pdf')
  );

  if (pdfPaths.length === 0) {
    throw new Error(`No PDF attachments found. Got: ${attachmentPaths.join(', ')}`);
  }

  let fullText = '';

  for (const relPath of pdfPaths) {
    const fullPath = path.join(process.cwd(), 'public', relPath);
    const buffer = await fs.readFile(fullPath);
    const pdfParser = new PDFParser();

    const pageText = await new Promise<string>((resolve, reject) => {
      pdfParser.on('pdfParser_dataReady', (pdfData: any) => {
        let text = '';
        for (const page of pdfData.Pages) {
          for (const item of page.Texts) {
            try { text += decodeURIComponent(item.R?.[0]?.T ?? '') + ' '; } catch { text += ' '; }
          }
          text += '\n\n';
        }
        resolve(text);
      });
      pdfParser.on('pdfParser_dataError', reject);
      pdfParser.parseBuffer(buffer);
    });

    fullText += pageText + '\n\n';
  }

  if (!fullText.trim()) throw new Error('Could not extract text from PDF(s)');

  console.log(`✅ Extracted ${fullText.length} chars from ${pdfPaths.length} PDF(s)`);
  return fullText;
}

// ─────────────────────────────────────────────────────────────
// Shared: call LLM and parse JSON response
// ─────────────────────────────────────────────────────────────
async function callLlm(prompt: string): Promise<any> {
  const response = await llm.invoke(prompt);
  let content = typeof response.content === 'string'
    ? response.content
    : JSON.stringify(response.content);

  content = content.replace(/```json|```/g, '').trim();
  const start = content.indexOf('{');
  const end = content.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('LLM did not return valid JSON');
  return JSON.parse(content.slice(start, end + 1));
}

// ─────────────────────────────────────────────────────────────
// Shared: fetch all distinct skills from providerprofile
// Auto-updates as new providers join with new skills
// ─────────────────────────────────────────────────────────────
async function fetchPlatformSkills(): Promise<string[]> {
  try {
    const rows = await query(`
      SELECT DISTINCT jt.skill_value
      FROM providerprofile,
      JSON_TABLE(skills, '$[*]' COLUMNS (skill_value VARCHAR(100) PATH '$')) AS jt
      WHERE skills IS NOT NULL
      ORDER BY jt.skill_value ASC
    `);
    return rows.map((r: any) => r.skill_value).filter(Boolean);
  } catch {
    console.warn('⚠️ Could not fetch platform skills — taxonomy will be empty');
    return [];
  }
}

// ─────────────────────────────────────────────────────────────
// EXPORT 1: Full AI analysis for provider "AI Analyzer" button
// Returns rich structured data displayed in RfpDetailsModal
// ─────────────────────────────────────────────────────────────
export async function analyzeRfpWithRAG(projectId: string, attachmentPaths: string[]) {
  const fullText = await extractPdfText(attachmentPaths);

  const result = await callLlm(`
You are an expert GIS and RFP analyst.
Analyze this document and return ONLY valid JSON — no markdown, no extra text:

{
  "project_overview": "brief summary",
  "scope_of_work": ["item1"],
  "technical_requirements": ["req1"],
  "budget_info": "budget details",
  "timeline": { "start_date": "...", "end_date": "...", "duration": "..." },
  "deliverables": ["del1"],
  "evaluation_criteria": ["criteria1"],
  "risks_constraints": ["risk1"],
  "key_contact": "...",
  "confidence": 0.8
}

Document:
${fullText.slice(0, 40000)}
`);

  console.log(`✅ analyzeRfpWithRAG complete for RFP ${projectId}`);
  return result;
}

// ─────────────────────────────────────────────────────────────
// EXPORT 2: Skill extraction for matching at approval time
// Maps RFP requirements → platform's actual skill vocabulary
// so string matching works against real provider skills
// ─────────────────────────────────────────────────────────────
export async function extractRequiredSkills(projectId: string, attachmentPaths: string[]) {
  const [fullText, platformSkills] = await Promise.all([
    extractPdfText(attachmentPaths),
    fetchPlatformSkills(),
  ]);

  console.log(`🏷️ Platform has ${platformSkills.length} skills. RFP: ${projectId}`);

  const result = await callLlm(`
You are a GIS RFP analyst.

${platformSkills.length > 0 
  ? `Map to these exact platform skills when possible:\n${platformSkills.slice(0, 50).map(s => `- ${s}`).join('\n')}` 
  : 'Return the most relevant GIS/geospatial skills.'}

Return ONLY valid JSON (no extra text, no markdown):

{
  "required_services": ["GIS Mapping", "Geospatial Consulting"],
  "required_skills": ["ArcGIS Pro", "QGIS", "Spatial Analysis"],
  "confidence": 0.85
}

Document excerpt:
${fullText.slice(0, 35000)}
`);

  // Safety fallback
  if (!result?.required_services && !result?.required_skills) {
    console.warn("LLM returned bad format, using fallback");
    return {
      required_services: ["GIS Services"],
      required_skills: [],
      confidence: 0.5
    };
  }

  return result;
}