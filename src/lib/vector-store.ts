// src/lib/vector-store.ts
import PDFParser from 'pdf2json';
import mammoth from 'mammoth';
import { ChatGroq } from '@langchain/groq';
import { query } from '@/lib/db';

const llm = new ChatGroq({ model: 'llama-3.3-70b-versatile', temperature: 0.1 });

// ─────────────────────────────────────────────────────────────
// Helpers: fetch a remote file into a Buffer
// ─────────────────────────────────────────────────────────────
async function fetchBuffer(url: string): Promise<Buffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch file: ${response.status} ${response.statusText} — ${url}`);
  }
  return Buffer.from(await response.arrayBuffer());
}

async function readLocalBuffer(filePath: string): Promise<Buffer> {
  const { default: fs }   = await import('fs/promises');
  const { default: path } = await import('path');
  return fs.readFile(path.join(process.cwd(), 'public', filePath));
}

// ─────────────────────────────────────────────────────────────
// Extract text from a single PDF buffer
// ─────────────────────────────────────────────────────────────
async function extractPdfBuffer(buffer: Buffer): Promise<string> {
  const pdfParser = new PDFParser();
  return new Promise<string>((resolve, reject) => {
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
}

// ─────────────────────────────────────────────────────────────
// Extract text from a single DOCX buffer
// ─────────────────────────────────────────────────────────────
async function extractDocxBuffer(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer });
  if (result.messages?.length) {
    console.warn('[DOCX warnings]', result.messages.map((m: any) => m.message).join(', '));
  }
  return result.value;
}

// ─────────────────────────────────────────────────────────────
// Shared: extract text from any supported attachment
// Supports PDF and DOCX/DOC, both remote (Blob URLs) and local
// ─────────────────────────────────────────────────────────────
async function extractDocumentText(attachmentPaths: string[]): Promise<string> {
  const supported = attachmentPaths.filter(p =>
    typeof p === 'string' && (
      p.toLowerCase().endsWith('.pdf')  ||
      p.toLowerCase().endsWith('.docx') ||
      p.toLowerCase().endsWith('.doc')
    )
  );

  if (supported.length === 0) {
    throw new Error(`No supported attachments found (PDF/DOCX). Got: ${attachmentPaths.join(', ')}`);
  }

  let fullText = '';

  for (const filePath of supported) {
    const isRemote = filePath.startsWith('http://') || filePath.startsWith('https://');
    const buffer   = isRemote ? await fetchBuffer(filePath) : await readLocalBuffer(filePath);

    const ext = filePath.toLowerCase().split('.').pop();

    if (ext === 'pdf') {
      fullText += await extractPdfBuffer(buffer) + '\n\n';
    } else if (ext === 'docx' || ext === 'doc') {
      fullText += await extractDocxBuffer(buffer) + '\n\n';
    }
  }

  if (!fullText.trim()) throw new Error('Could not extract text from attachment(s)');

  console.log(`✅ Extracted ${fullText.length} chars from ${supported.length} file(s)`);
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
  const end   = content.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('LLM did not return valid JSON');
  return JSON.parse(content.slice(start, end + 1));
}

// ─────────────────────────────────────────────────────────────
// Shared: fetch all distinct skills from providerprofile
// ─────────────────────────────────────────────────────────────
async function fetchPlatformSkills(): Promise<string[]> {
  try {
    const rows = await query(`
      SELECT DISTINCT skill_value
      FROM providerprofile,
      jsonb_array_elements_text(skills::jsonb) AS skill_value
      WHERE skills IS NOT NULL
      ORDER BY skill_value ASC
    `);
    return rows.map((r: any) => r.skill_value).filter(Boolean);
  } catch (err) {
    console.warn('⚠️ Could not fetch platform skills — taxonomy will be empty', err);
    return [];
  }
}

// ─────────────────────────────────────────────────────────────
// EXPORT 1: Full AI analysis for the ReviewPanel summary
// ─────────────────────────────────────────────────────────────
export async function analyzeRfpWithRAG(projectId: string, attachmentPaths: string[]) {
  const fullText = await extractDocumentText(attachmentPaths);

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
// EXPORT 2: Skill extraction for provider matching
// ─────────────────────────────────────────────────────────────
export async function extractRequiredSkills(projectId: string, attachmentPaths: string[]) {
  const [fullText, platformSkills] = await Promise.all([
    extractDocumentText(attachmentPaths),
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

  if (!result?.required_services && !result?.required_skills) {
    console.warn('LLM returned bad format, using fallback');
    return {
      required_services: ['GIS Services'],
      required_skills: [],
      confidence: 0.5,
    };
  }

  return result;
}