// src/lib/vector-store.ts
import PDFParser from 'pdf2json';
import fs from 'fs/promises';
import path from 'path';
import { ChatGroq } from "@langchain/groq";

export async function analyzeRfpWithRAG(projectId: string, attachmentPaths: string[]) {
  try {
    const pdfPaths = attachmentPaths.filter(p =>
      typeof p === 'string' && p.toLowerCase().endsWith('.pdf')
    );

    console.log(`📎 Total attachments: ${attachmentPaths.length}, PDFs found: ${pdfPaths.length}`);

    if (pdfPaths.length === 0) {
      throw new Error(`No PDF files found. Available attachments: ${attachmentPaths.join(', ')}`);
    }

    let fullText = '';

    for (const relPath of pdfPaths) {
      const fullPath = path.join(process.cwd(), "public", relPath);
      console.log(`📄 Reading: ${fullPath}`);

      const buffer = await fs.readFile(fullPath);
      const pdfParser = new PDFParser();

      const pageText = await new Promise<string>((resolve, reject) => {
        pdfParser.on("pdfParser_dataReady", (pdfData: any) => {
          let text = '';
          pdfData.Pages.forEach((page: any) => {
            page.Texts.forEach((textItem: any) => {
              try {
                if (textItem.R && textItem.R[0] && textItem.R[0].T) {
                  text += decodeURIComponent(textItem.R[0].T) + ' ';
                }
              } catch {
                text += ' ';
              }
            });
            text += '\n\n';
          });
          resolve(text);
        });

        pdfParser.on("pdfParser_dataError", reject);
        pdfParser.parseBuffer(buffer);
      });

      fullText += pageText + '\n\n';
    }

    if (!fullText.trim()) {
      throw new Error("Could not extract meaningful text from PDF(s)");
    }

    console.log(`✅ Extracted ${fullText.length} characters from PDFs`);

    const llm = new ChatGroq({
      model: "llama-3.3-70b-versatile",
      temperature: 0.1,
    });

    const prompt = `
You are an expert GIS and RFP analyst.
Analyze the following document and return **ONLY** valid JSON (no markdown, no extra text):

{
  "project_overview": "Brief summary",
  "scope_of_work": ["item1", "item2"],
  "technical_requirements": ["req1", "req2"],
  "budget_info": "Budget details or range",
  "timeline": { "start_date": "...", "end_date": "...", "duration": "..." },
  "deliverables": ["del1", "del2"],
  "evaluation_criteria": ["criteria1"],
  "risks_constraints": ["risk1"],
  "key_contact": "...",
  "confidence": 0.8
}

Document Content:
${fullText.slice(0, 40000)}
`;

    const response = await llm.invoke(prompt);

    let content = typeof response.content === 'string' 
      ? response.content 
      : JSON.stringify(response.content);

    // Clean response
    content = content
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();

    const firstBrace = content.indexOf('{');
    const lastBrace = content.lastIndexOf('}');

    if (firstBrace !== -1 && lastBrace !== -1) {
      content = content.slice(firstBrace, lastBrace + 1);
    }

    const parsed = JSON.parse(content);
    console.log("✅ Successfully parsed AI response");
    return parsed;

  } catch (error: any) {
    console.error("❌ analyzeRfpWithRAG Error:", error.message);
    throw error;
  }
}