
import { GoogleGenAI, Type } from "@google/genai";
import { CompetitorAnalysis, FormData, ChatMessage, GroundingLink, ImagePrompt, ImageStyle } from "../types";
import { PAUL_GRAHAM_GUIDE, ANTI_AI_GUIDE, BANNED_TERMS, CITATION_RULES } from "../utils/writingGuidelines";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

const extractGroundingLinks = (response: any): GroundingLink[] => {
  const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
  if (!chunks) return [];
  
  return chunks
    .map((chunk: any) => ({
      title: chunk.web?.title || chunk.web?.uri || 'Source',
      uri: chunk.web?.uri
    }))
    .filter((link: any) => link.uri);
};

export const parseMarkdownToHTML = (md: string): string => {
    if (!md) return '';
    
    let text = md
        .replace(/```markdown/g, '')
        .replace(/```html/g, '')
        .replace(/```/g, '')
        .trim();

    const lines = text.split('\n');
    let html = '';
    let inList = false;
    let listType: 'ul' | 'ol' | null = null;
    let inTable = false;

    const processInline = (lineText: string) => {
        return lineText
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-600 underline font-medium">$1</a>');
    };

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();

        if (line.startsWith('|')) {
            if (!inTable) {
                html += '<table class="min-w-full border border-gray-200 my-4 text-sm"><tbody>';
                inTable = true;
            }
            if (line.includes('---')) continue;
            const cells = line.split('|').filter(c => c.trim().length > 0);
            html += '<tr>' + cells.map(c => `<td class="border p-2">${processInline(c.trim())}</td>`).join('') + '</tr>';
            continue;
        } else if (inTable) {
            html += '</tbody></table>';
            inTable = false;
        }

        if (!line) {
            if (inList) {
                html += listType === 'ul' ? '</ul>' : '</ol>';
                inList = false;
                listType = null;
            }
            continue;
        }

        if (line.startsWith('#')) {
            if (inList) {
                html += listType === 'ul' ? '</ul>' : '</ol>';
                inList = false;
            }
            const match = line.match(/^(#+)\s*(.*)/);
            if (match) {
                const level = Math.min(match[1].length, 6);
                html += `<h${level}>${processInline(match[2])}</h${level}>`;
                continue;
            }
        }

        const ulMatch = line.match(/^[\-\*]\s+(.*)/);
        const olMatch = line.match(/^\d+\.\s+(.*)/);

        if (ulMatch) {
            if (!inList || listType !== 'ul') {
                if (inList) html += listType === 'ul' ? '</ul>' : '</ol>';
                html += '<ul class="list-disc pl-5 my-2">';
                inList = true;
                listType = 'ul';
            }
            html += `<li>${processInline(ulMatch[1])}</li>`;
            continue;
        }

        if (olMatch) {
            if (!inList || listType !== 'ol') {
                if (inList) html += listType === 'ul' ? '</ul>' : '</ol>';
                html += '<ol class="list-decimal pl-5 my-2">';
                inList = true;
                listType = 'ol';
            }
            html += `<li>${processInline(olMatch[1])}</li>`;
            continue;
        }

        if (inList) {
            html += listType === 'ul' ? '</ul>' : '</ol>';
            inList = false;
            listType = null;
        }

        if (line.startsWith('<') && line.endsWith('>')) {
            html += line;
        } else {
            html += `<p class="mb-4">${processInline(line)}</p>`;
        }
    }

    if (inList) html += listType === 'ul' ? '</ul>' : '</ol>';
    if (inTable) html += '</tbody></table>';

    return html;
};

export const analyzeCompetitorUrls = async (urls: string[]): Promise<CompetitorAnalysis[]> => {
  const validUrls = urls.filter(u => u.trim().startsWith('http'));
  if (validUrls.length === 0) return [];

  const ai = getAI();
  const prompt = `Analyze these competitor URLs using Google Search and provide a structured report on their titles, headings, topics, and content gaps: \n${validUrls.join('\n')}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: { tools: [{ googleSearch: {} }] }
    });
    const links = extractGroundingLinks(response);
    return validUrls.map(url => ({ 
      url, 
      analysis: response.text || "", 
      links 
    }));
  } catch (error) {
    console.error("Competitor analysis failed:", error);
    return [];
  }
};

export const generateSEOBrief = async (formData: FormData, competitorData: CompetitorAnalysis[] | null): Promise<{ text: string; links: GroundingLink[] }> => {
  const ai = getAI();
  const serpAnalysis = competitorData && competitorData.length > 0 
    ? competitorData.map(c => `### Competitor: ${c.url}\n${c.analysis}`).join('\n\n')
    : null;

  const prompt = `
# Content Brief Generator - Gemini 3 Pro Edition

## CONTEXT
You are the lead SEO Strategist. Create a detailed content blueprint.

## INPUTS
- Client: ${formData.client}
- Target Keyword: ${formData.targetKeyword}
- SEO Title: ${formData.seoTitle}
- Article Direction: ${formData.articleDirection}
- Word Count: ${formData.wordCountTarget}
- Location: ${formData.location}
- Content Type: ${formData.contentType}

## COMPETITIVE LANDSCAPE
${serpAnalysis || 'Base on general SEO best practices.'}

## COMPANY MISSION
${formData.companyBrief}

## OUTPUT SECTIONS
1. SEARCH INTENT (Why are they searching?)
2. TARGET PERSONA (Who are we talking to?)
3. COMPETITIVE EDGE (How do we win?)
4. STRUCTURED OUTLINE (H2s/H3s with word count targets and key concepts)
5. KEYWORD LIST (Primary + Secondary)
6. E-E-A-T REQUIREMENTS
7. RESEARCH THEMES (What facts do we need to verify?)

Total Length: ~1,500-2,000 words.
`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: prompt,
    config: { thinkingConfig: { thinkingBudget: 16384 } }
  });
  
  return {
    text: response.text || "Error generating brief.",
    links: extractGroundingLinks(response)
  };
};

export const generateResearchFramework = async (brief: string, formData: FormData): Promise<string> => {
  const ai = getAI();
  const prompt = `
# Research Framework Designer

Create a deep research blueprint for the keyword: "${formData.targetKeyword}".

Brief Context: ${brief.substring(0, 2000)}

Deliver:
1. Topic Deep Dive (narrative explanation)
2. Nuanced Questions (The stuff people actually ask but is hard to find)
3. Specific Entities to verify (Laws, stats, agencies)
4. Differentiation strategy (What others miss)
`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: prompt,
    config: { thinkingConfig: { thinkingBudget: 8192 } }
  });
  
  return response.text || "Framework failed.";
};

export const performDeepResearch = async (
  brief: string, 
  formData: FormData, 
  researchFramework: string
): Promise<{ text: string; links: GroundingLink[] }> => {
  const ai = getAI();
  const prompt = `
# Evidence-Based Deep Research Phase

Use Google Search to find verified, high-authority data for:
${researchFramework}

RULES:
- Find at least 10 authoritative sources (.gov, .edu, official reports).
- DO NOT cite competitors.
- Extract specific stats and legal provisions.
- Every claim must have a clickable link [Title](URL).

Current Year: ${new Date().getFullYear()}
Location focus: ${formData.location}
`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: prompt,
    config: { 
      tools: [{ googleSearch: {} }],
      thinkingConfig: { thinkingBudget: 24000 }
    }
  });
  
  return {
    text: response.text || "Research failed.",
    links: extractGroundingLinks(response)
  };
};

export const generateFullArticle = async (brief: string, research: string, formData: FormData, instructions?: string): Promise<string> => {
    const ai = getAI();
    const titleToUse = formData.seoTitle || formData.targetKeyword;
    const masterPrompt = `
## ROLE: ELITE HUMAN-LIKE WRITER (GEMINI 3 PRO)
Write a definitive article for "${titleToUse}".

## GUIDELINES
${PAUL_GRAHAM_GUIDE}
${ANTI_AI_GUIDE}
${BANNED_TERMS}
${CITATION_RULES}

## RESOURCES
<STRATEGIC_BRIEF>
${brief}
</STRATEGIC_BRIEF>

<RESEARCH_DOSSIER>
${research}
</RESEARCH_DOSSIER>

${instructions ? `## USER NOTES\n${instructions}` : ''}

Write a high-retention, authoritative, and helpful article. Use strict Markdown.
`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: masterPrompt,
            config: { thinkingConfig: { thinkingBudget: 32768 } }
        });
        return parseMarkdownToHTML(response.text || "");
    } catch (error) {
        console.error("Article generation error:", error);
        return "<p>Error generating article. Please try again.</p>";
    }
}

export const generateImagePrompts = async (content: string, style: ImageStyle, aspectRatio: string, suggestions: string): Promise<ImagePrompt[]> => {
  const ai = getAI();
  const promptText = `
# Blog Cover Image Prompt Generator v2.1

## CONTEXT
Article Content: ${content.substring(0, 3000)}
Preferred Style: ${style}
Aspect Ratio: ${aspectRatio}
User Suggestions: ${suggestions || "None"}

## TASK
Generate 5 unique, strategically differentiated cover image prompts for Google Gemini (Nano Banana).

## DIFFERENTIATION FRAMEWORK
- Concept 1: Literal/Direct (Subject explicit)
- Concept 2: Metaphorical/Symbolic (Theme representation)
- Concept 3: Human-Centric (Emotional impact)
- Concept 4: Environmental/Contextual (Industry context)
- Concept 5: Data/Abstract (Conceptual visualization)

## RULES
- 2 of the 5 concepts (preferably 1 and 3) MUST incorporate the user's "Suggestions" if provided.
- Use narrative paragraphs for prompts (50-100 words).
- Start with the subject.
- Describe lighting, mood, and composition.
- Include aspect ratio "${aspectRatio}" in the narrative.
- Use "Without [elements]" for exclusions.
- Output ONLY valid JSON in the following format:
{
  "prompts": [
    {
      "id": "unique-id-1",
      "title": "Short title",
      "rationale": "Why this works",
      "gemini_prompt": "Complete narrative prompt"
    }
  ]
}
`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: promptText,
      config: { 
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            prompts: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  title: { type: Type.STRING },
                  rationale: { type: Type.STRING },
                  gemini_prompt: { type: Type.STRING }
                },
                required: ["id", "title", "rationale", "gemini_prompt"]
              }
            }
          }
        }
      }
    });

    const parsed = JSON.parse(response.text || '{"prompts":[]}');
    return parsed.prompts;
  } catch (error) {
    console.error("Image prompt generation failed:", error);
    return [];
  }
};

export const generateImage = async (prompt: string, aspectRatio: string): Promise<string | null> => {
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: prompt,
      config: {
        imageConfig: {
          aspectRatio: aspectRatio as any || "16:9"
        }
      }
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Image generation failed:", error);
    return null;
  }
};

export const chatWithBrief = async (
  message: string, 
  history: ChatMessage[], 
  contextText: string, 
  formData: FormData,
  isEditRequest: boolean = false
): Promise<{ response: string; editedContent?: string }> => {
  const ai = getAI();
  const systemPrompt = isEditRequest 
    ? `You are an expert AI editor. Update the following document based on user request.
       Return exactly in this structure:
       ---EXPLANATION---
       Explain what you did.
       ---UPDATED_CONTENT---
       [The full updated document]
       ---END---
       
       Context: ${contextText}`
    : `Context: ${contextText}\nClient: ${formData.client}`;

  const contents = [
    { role: 'user', parts: [{ text: systemPrompt }] },
    ...history.map(msg => ({ role: msg.role, parts: [{ text: msg.text }] })),
    { role: 'user', parts: [{ text: message }] }
  ];
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: contents,
    config: { thinkingConfig: { thinkingBudget: isEditRequest ? 8192 : 4096 } }
  });
  
  const text = response.text || "Error.";
  
  if (isEditRequest && text.includes('---UPDATED_CONTENT---')) {
    const explanationMatch = text.match(/---EXPLANATION---([\s\S]*?)---UPDATED_CONTENT---/);
    const contentMatch = text.match(/---UPDATED_CONTENT---([\s\S]*?)---END---/);
    
    return {
      response: explanationMatch ? explanationMatch[1].trim() : 'Document updated.',
      editedContent: contentMatch ? contentMatch[1].trim() : undefined
    };
  }
  
  return { response: text };
};
