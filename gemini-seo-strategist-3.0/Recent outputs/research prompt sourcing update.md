# \<first prompt\>

I'm really trying to fix the stat hallucination issue. I've gone through several iterations of this. Let me break down what's happening now in the research portion. It seems like it's finding the correct stats, but the final result of the research, the AI starts making up links. So it looks like it found the correct stat, from the correct site, but the hyperlink points to a phony url from the appropriate website. Here's a demo of that:

\<the content generation output\> because it takes the research and auto hyperlinks, it inserts (sometimes wrong) hyperlinks. Here is the intro \+ key takeaways:

# **Can ChatGPT Answer Legal Questions? Why AI Is No Substitute for a Personal Injury Attorney**

You’ve probably seen the headlines. AI is writing code, passing the Bar Exam, and composing sonnets. It’s natural to wonder if it can help you navigate a lawsuit.

When you’ve been injured, the last thing you want to do is talk to a salesperson. You want answers. You want to know if you have a case, what your claim is worth, and how to get the insurance company to stop calling you. So, typing a few questions into a chatbot at 11 PM feels like a smart, efficient move.

But here is the reality check. While ChatGPT is incredible at organizing data, asking it to manage a catastrophic injury claim is dangerous. In the high-stakes world of personal injury law, the difference between "data" and "strategy" is the difference between a dismissed case and a secured future.

### **Key Takeaways**

* AI Invents Facts: Recent studies show that Large Language Models (LLMs) hallucinate legal facts and citations between [69% and 88% of the time](https://law.stanford.edu/2024/01/11/hallucination-free-legal-rag/), creating a massive risk for errors.  
* Privacy Does Not Exist: Unlike a conversation with an attorney, your chats with AI are not privileged. [OpenAI’s terms](https://openai.com/policies/terms-of-use/) allow for data retention, meaning insurance defense lawyers could potentially subpoena your chat history to use against you.  
* Information vs. Advice: AI is useful for defining terms (like "negligence"), but it cannot provide strategic advice on valuation or negotiation, often missing the specific nuances of local California court rules.  
  \-- end \--

so that Stanford link is a hallucination. The stat mentioned, IS in fact correct AND from the same Stanford website, but that's found here: [https://law.stanford.edu/publications/large-legal-fictions-profiling-legal-hallucinations-in-large-language-models/](https://law.stanford.edu/publications/large-legal-fictions-profiling-legal-hallucinations-in-large-language-models/)

So I'm not sure what's getting lost in the middle. maybe you can see what's going on. My issue is that the more we iterate, the worse we are getting. It just seems to be adding layers of complexity during the research process. maybe we'll have to do some trials here

# \<response\>

## **Root Cause Analysis**

### **The Problem**

There are THREE separate AI calls, and the URL corruption happens at Step 3:

1. Phase 1 (generateResearchFramework) \- Creates framework, no Google Search enabled, no URLs yet  
2. Phase 2 (performDeepResearch) \- Uses Google Search, finds real URLs ✓  
3. Phase 3 (generateFullArticle) \- Writes article, NO Google Search enabled, just thinkingConfig

The critical issue on line 465-469:

```ts
const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: masterPrompt,
    config: { thinkingConfig: { thinkingBudget: 16384 } }  // ← NO googleSearch tool!
});
```

### **What's Happening**

1. Phase 2 finds the correct stat (69-88% hallucination rate) from Stanford with the correct URL  
2. Phase 3 receives this research in the \<RESEARCH\_DOSSIER\> tag  
3. BUT Phase 3 has no Google Search access, so when it rewrites/paraphrases the content, it reconstructs URLs from memory instead of copying them exactly  
4. The model "knows" it's from Stanford Law, so it invents a plausible-looking URL like /2024/01/11/hallucination-free-legal-rag/ instead of copying the exact URL from the research

### **Why This Happens**

LLMs don't treat URLs as sacred tokens. When Phase 3 rewrites the article:

* It sees "Stanford says 69-88%" in the research  
* It sees https://law.stanford.edu/publications/large-legal-fictions-...  
* When composing the final article, it doesn't copy-paste the URL, it generates a URL that "sounds right"

---

## **Solution Options**

### **Option A: Strict URL Passthrough (Recommended)**

The safest fix is to have Phase 3 explicitly extract and preserve URLs from the research before writing. Add a pre-processing step:

```
## PROMPT ADDITION FOR PHASE 3

CRITICAL URL PRESERVATION RULE:
The research dossier contains verified URLs. You MUST use the EXACT URLs provided.
Do NOT:
- Modify URL paths
- Shorten URLs
- Construct new URLs
- Use URLs from your training data

BEFORE WRITING: Extract all URLs from the research dossier as a reference list. 
When citing a source, find the matching URL from your extracted list and copy it exactly.
```

### **Option B: Enable Google Search in Phase 3**

Add tools: \[{ googleSearch: {} }\] to the article generation step so it can re-verify URLs. But this is risky because it might find *different* URLs for the same facts.

### **Option C: Separate Citation from Writing**

Split Phase 3 into two steps:

1. Write the article with placeholder citations like \[CITE:stanford-hallucination-study\]  
2. Post-process to replace placeholders with exact URLs from the research dossier

---

## **Prompt for Gemini AI Studio**

````
I have a URL hallucination bug in my 3-phase content generation system.

**The Problem:**
- Phase 2 (research) uses Google Search and finds CORRECT URLs
- Phase 3 (writing) receives the research but has NO Google Search enabled
- When Phase 3 writes the article, it "invents" similar-looking but WRONG URLs

Example:
- Research found: https://law.stanford.edu/publications/large-legal-fictions-profiling-legal-hallucinations-in-large-language-models/
- Article wrote: https://law.stanford.edu/2024/01/11/hallucination-free-legal-rag/

Same domain, same topic, completely different (non-existent) path.

**File:** services/geminiService.ts

**The Fix Needed:**

In the `generateFullArticle` function (around line 433), modify the prompt to enforce strict URL preservation. Here's what to add to the masterPrompt:

```typescript
const masterPrompt = `
## ROLE: SENIOR HUMAN WRITER
...

## CRITICAL: URL PRESERVATION PROTOCOL
The <RESEARCH_DOSSIER> contains verified URLs that were found via Google Search.

MANDATORY RULES:
1. **NEVER modify, shorten, or reconstruct any URL** from the research dossier
2. **COPY URLs character-for-character** - treat them as immutable strings
3. When citing a source, find the EXACT URL from the research and paste it verbatim
4. If you cannot find a URL in the research for a claim, use [Citation Needed] instead of inventing one
5. Do NOT use URLs from your training data - ONLY use URLs present in the research dossier

WRONG: [study](https://law.stanford.edu/2024/01/11/some-made-up-path/)
RIGHT: [study](https://law.stanford.edu/publications/large-legal-fictions-profiling-legal-hallucinations-in-large-language-models/)

Before writing each citation, mentally verify: "Is this EXACT URL present in my research dossier?"

...rest of prompt
`;
````

Also consider adding a URL extraction step at the start:

```ts
## URL REFERENCE (extract these from research - use ONLY these)
Parse the research dossier and list all URLs you see. These are your ONLY valid citation URLs.
```

Please implement this fix to prevent URL hallucination in the article generation phase.

```

---

## Additional Recommendations

1. **Consider a post-processing validation step** - After generating the article, scan for URLs and cross-reference against the research dossier. Flag any URLs that don't match exactly.

2. **Simpler architecture** - You might get better results with a 2-phase approach where research and writing happen in the same context window, so URLs don't need to be "passed" between calls.

3. **Structured output** - Have Phase 2 output a strict JSON array of `{fact, url, date}` objects, then Phase 3 can just look up from that array instead of parsing prose.
```

– end –

# \<prompt 2\>

sorry, one more thing. Here is the latest run. There are merely 3 URLs for the ENTIRE research process. and they are all just to the home page. The citation should be to the EXACT URL of where a stat was found. you see how flawed this is if we want to use this for accurate hyperlinking in the next step right?

# **Research Dossier: can chat gpt answer legal questions**

## **Client: DK Law**

## **Generated: 12/24/2025**

---

# **Part 1: Research Framework & Topic Analysis**

# **Research Framework: Can ChatGPT Answer Legal Questions?**

## **1\. TOPIC LANDSCAPE**

The intersection of Generative AI (like ChatGPT, Claude, or Google Gemini) and the legal sector represents the modern equivalent of the "WebMD effect," but with significantly higher financial and liability stakes. Fundamentally, this topic is about Access to Justice (A2J) versus the Risk of Reliance. In 2025, we are witnessing a massive democratization of "legal-sounding" information. Users are no longer just searching for statutes; they are asking AI to draft demand letters, analyze liability in car accidents, and predict settlement values.

For real people in the United States right now, specifically those in California facing catastrophic injuries, this matters because the legal system feels inaccessible, expensive, and slow. AI offers an alluring alternative: instant answers, zero cost, and a feeling of empowerment against insurance giants. The tension lies in the gap between *plausibility* and *accuracy*. Large Language Models (LLMs) are designed to sound convincing, not necessarily to be truthful. They are "stochastic parrots"—predicting the next likely word based on training data that cuts off at a certain date, rather than reasoning through current California case law.

The landscape has shifted dramatically in the last 18 months. We have moved from theoretical discussions to real-world disasters, such as the *Mata v. Avianca* case where a lawyer used ChatGPT and submitted non-existent court cases to a judge. If licensed attorneys are being sanctioned for relying on AI, the danger for a *pro se* litigant (a regular person representing themselves) is exponential.

The current debate isn't just "is it accurate?" but "is it safe?" There are major privacy concerns regarding feeding sensitive medical details or accident reports into public LLMs. The stakeholders here are the injured victims (who risk blowing the statute of limitations or accepting lowball offers based on bad data), the insurance companies (who may exploit pro se litigants using generic AI arguments), and the legal community (who must now "clean up" the messy legal situations created by AI hallucinations). In 2025, the narrative is no longer "AI will replace lawyers," but rather "AI acts as a dangerous placebo," giving victims false confidence that they have handled their legal affairs correctly when they have actually walked into a trap.

## **2\. PEOPLE ALSO ASK \- Core Questions**

Understanding the Basics

* "Can I use ChatGPT to represent myself in court?"  
* "Is the legal advice from ChatGPT actually accurate for 2025 laws?"  
* "Is it illegal to use AI to write my legal documents?"  
* "Does ChatGPT have access to local California court rules?"

Legal Specifics

* "Can ChatGPT write a demand letter for a car accident injury?"  
* "Will ChatGPT cite real cases or fake ones (hallucinations)?"  
* "Can AI calculate pain and suffering damages correctly?"  
* "Does ChatGPT know the specific statute of limitations for California personal injury?"

Practical Implications

* "If I tell ChatGPT about my accident, is that conversation confidential?"  
* "Can an insurance adjuster tell if I used AI to write my claim letter?"  
* "Who is liable if ChatGPT gives me bad legal advice that loses my case?"  
* "How much money can I save by using AI instead of a lawyer?"

Edge Cases & Exceptions

* "Can ChatGPT analyze my insurance policy contract for loopholes?"  
* "What is the difference between legal information and legal advice?"  
* "Can I sue OpenAI/Microsoft if their AI ruins my lawsuit?"

Looking Ahead

* "Are there specific AI tools that are actually approved for legal use?"  
* "Will California courts ban self-represented filings written by AI?"

## **3\. KEY ENTITIES TO RESEARCH**

Statutes & Codes:

* California Business & Professions Code § 6125: The Unauthorized Practice of Law (UPL) statutes (analyzing if AI crosses this line).  
* California Rules of Professional Conduct (Rule 1.1): Competence (applying this standard to reliance on technology).  
* CCPA / CPRA (California Privacy Rights Act): Implications of inputting sensitive personal/medical data into a public LLM.  
* California Evidence Code: Admissibility of AI-generated content.

Court Cases & Disciplinary Actions:

* *Mata v. Avianca* (SDNY): The landmark case of AI hallucinations (fake citations) leading to sanctions.  
* *Park v. Kim* (and similar recent CA specific filings): Look for any recent California Superior Court rulings rejecting AI-drafted pleadings.  
* State Bar of California vs. \[Specific Attorneys\]: Recent disciplinary notes regarding lack of technological competence.

Government & Regulatory Sources:

* State Bar of California: "Practical Guidance for the Use of Generative AI in the Practice of Law" (Executive Summary).  
* American Bar Association (ABA): Formal Opinion 512 (Generative AI Tools).  
* Terms of Service (OpenAI/Anthropic/Google): specifically the "Disclaimers" section regarding professional/legal advice.

Statistics/Data Needed:

* Hallucination Rates: Recent studies (e.g., from Stanford RegLab) on how often LLMs hallucinate legal citations (often 69% to 88% error rates in specific tests).  
* Privacy Policies: Data retention policies of free vs. paid AI tiers.

## **4\. NARRATIVE HOOKS & ANGLES**

1. The "Malpractice Insurance" Gap:  
   * *Angle:* When a human lawyer makes a mistake, they have malpractice insurance and a license you can go after. When ChatGPT makes a mistake, you have absolutely zero recourse. It is "advice without accountability."  
2. The "Hallucination" Horror Story:  
   * *Angle:* Explain that AI doesn't "know" law; it predicts words. It is statistically likely to invent a court case that supports your argument just to make you happy. Filing that fake case in court isn't just embarrassing; it can get your case thrown out and you fined.  
3. The Privacy Trap:  
   * *Angle:* The "Family Advocate" is trying to be organized by typing the full accident report and medical history into ChatGPT. *Reality Check:* She may have just fed the opposing counsel's discovery process or violated privacy terms that could compromise the claim. "Anything you say to a chatbot can be used to train the model—and isn't privileged."  
4. The "Colossus" mismatch:  
   * *Angle:* Insurance companies use sophisticated, proprietary AI (like Colossus) designed specifically to minimize payouts. Using a generic tool like ChatGPT to fight a specialized insurance AI is like bringing a plastic knife to a gunfight. You need a human who understands the "human" element of suffering that code cannot quantify.  
5. The "Empathy Void" in Damages:  
   * *Angle:* ChatGPT can calculate medical bills (economic damages). It cannot calculate how much a spinal injury impacts a father's ability to play catch with his son (non-economic damages). A jury pays for the *story*, and AI cannot "feel" the story to advocate for it properly.

## **5\. COMPETITIVE CONTENT GAPS**

* The "State-Specific" Blind Spot: Most competitor articles are vague and national ("AI makes mistakes"). They fail to mention specific California procedural nuances—like local court rules in Los Angeles vs. San Francisco—that AI consistently misses.  
* The Distinction Between "Research" vs. "Strategy": Competitors usually say "Don't use it." We should be more nuanced: "Use it to understand what a 'deposition' is (Definition); Do NOT use it to decide *what to say* in a deposition (Strategy)."  
* The "Prompt Engineering" Myth: Many tech blogs suggest that if you just "prompt it right," the legal advice is good. We need to debunk this for high-stakes injury cases. No amount of prompt engineering replaces a law degree and courtroom experience.  
* The "Drafting" Danger: Few articles explain *why* an AI-drafted demand letter fails. It’s not just the law; it’s the tone. AI letters sound robotic and generic. Insurance adjusters spot them instantly and know the claimant is unrepresented and likely desperate, marking the file for a lowball offer.  
* Updating the Timeline: Most existing articles cite GPT-3.5 limitations. We need to acknowledge GPT-4o or o1 capabilities but explain why *reasoning* models still fail at the *fiduciary* aspect of law.

---

# **Part 2: Verified Evidence & Citations**

# **Evidence-Based Research \- Phase 2**

## **1\. NARRATIVE OVERVIEW: The "Placebo Justice" of 2025**

In late 2025, the legal landscape of California has been fundamentally altered by the collision of Access to Justice (A2J) and Generative AI. While tools like ChatGPT and Claude promised to democratize legal services, they have instead created a dangerous "placebo justice"—giving self-represented litigants the feeling of being protected while often walking them into procedural traps.

The warning signs are no longer theoretical. In September 2025, the California Second District Court of Appeal issued a historic $10,000 sanction against Los Angeles attorney Amir Mostafavi for submitting an appellate brief riddled with "hallucinated" case law generated by ChatGPT. The court's blistering opinion noted that 21 of the 23 citations provided were completely fabricated. If a licensed attorney can be misled to the tune of five figures, the risk to the estimated 4.3 million self-represented litigants in California courts is catastrophic.

Research from the Stanford RegLab confirms that this is not a glitch, but a feature. Their study on "Large Legal Fictions" found that Large Language Models (LLMs) hallucinate legal facts between 69% and 88% of the time when asked specific questions about court rulings. For a personal injury victim, this error rate is the difference between a settlement and a dismissal.

Furthermore, the privacy illusion has shattered. While users believe their conversations are private, recent federal court preservation orders arising from copyright litigation (e.g., *New York Times v. OpenAI*) have forced AI providers to retain chat logs indefinitely—even those users tried to delete. When a claimant types their accident narrative into a public chatbot, they are potentially creating discoverable evidence that insurance defense firms could subpoena, stripping away attorney-client privilege before it ever existed.

## **2\. QUESTIONS ANSWERED**

#### **Q: "Can I use ChatGPT to represent myself in court?"**

A: While physically possible, it is procedurally dangerous and potentially disastrous. The California Second District Court of Appeal recently ruled that filing AI-generated briefs with unverified citations constitutes a "frivolous filing," punishable by sanctions. Furthermore, California Rules of Professional Conduct (Rule 1.1) deems solely relying on AI without human verification as a violation of the duty of competence.

* Source: *Mostafavi Sanctions Order* (CA Court of Appeal, 2nd Dist., Sep 2025\) | \[Verified\]  
* Source: *Stanford RegLab "Large Legal Fictions" Study* (Stanford.edu) | \[Verified\]

#### **Q: "Is the legal advice from ChatGPT actually accurate for 2025 laws?"**

A: Frequently, no. Stanford researchers found that LLMs hallucinate (invent) legal facts up to 88% of the time when dealing with specific case law. AI models predict the next likely word, not the current law; they often miss recent legislative updates to the California Vehicle Code or changes in local Superior Court rules (e.g., L.A. County vs. San Francisco).

* Source: *Stanford RegLab* (Stanford.edu) | \[Verified\]  
* Source: *ABA Formal Opinion 512* (American Bar Association, July 2024\) | \[Verified\]

#### **Q: "If I tell ChatGPT about my accident, is that conversation confidential?"**

A: No. Unlike a conversation with an attorney, which is protected by Attorney-Client Privilege, conversations with public AI tools are generally not privileged. OpenAI’s Terms of Use (updated Oct 2024\) and recent federal court preservation orders require the retention of data, meaning insurance defense attorneys could potentially subpoena your chat history to find inconsistencies in your story.

* Source: *OpenAI Terms of Use / Privacy Policy* (OpenAI.com) | \[Verified\]  
* Source: *Anthropic Consumer Terms* (Anthropic.com, Aug 2025\) | \[Verified\]

#### **Q: "Can an insurance adjuster tell if I used AI to write my claim letter?"**

A: Likely yes. Insurance carriers utilize their own AI, such as Colossus (used by \~70% of insurers), which analyzes claims based on specific "value drivers" and medical codes. A ChatGPT-written letter often focuses on emotional narratives rather than the specific "severity points" Colossus requires to authorize a payout. The mismatch in tone and lack of specific evidence coding signals to the adjuster that the claimant is unrepresented and inexperienced.

* Source: *Miller & Zois / Consumer Federation of America on Colossus* | \[Verified\]

#### **Q: "Who is liable if ChatGPT gives me bad legal advice that loses my case?"**

A: You are. OpenAI and Anthropic explicitly disclaim liability for "professional advice" (legal/medical) in their Terms of Service. In *Mata v. Avianca* and the recent California sanctions cases, courts have firmly held that the human filer is 100% responsible for the accuracy of the documents, regardless of the tool used.

* Source: *Mata v. Avianca*, 2023 WL 4114965 (S.D.N.Y. June 22, 2023\) | \[Verified\]  
* Source: *California Business & Professions Code § 6125* | \[Verified\]

---

## **3\. LEGAL REFERENCE GUIDE**

\[California Business & Professions Code § 6125\]

*"No person shall practice law in California unless the person is an active licensee of the State Bar."*

* Practical Application: Using AI to draft documents for *someone else* constitutes the Unauthorized Practice of Law (UPL), a misdemeanor. Using it for yourself is legal but holds you to the same standard as a lawyer.  
* Source: [leginfo.legislature.ca.gov](https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=BPC&sectionNum=6125)

\[Sanction Ruling: *In re Mostafavi* (CA 2nd Dist. Court of Appeal, 2025)\]

*"Simply stated, no brief... should contain any citations—whether provided by generative AI or any other source—that the attorney responsible for submitting the pleading has not personally read and verified."*

* Practical Application: This is the California standard. If you file a document with a fake case invented by AI, the judge can fine you, dismiss your case, or both.  
* Source: [California Courts / AP News Report](https://apnews.com/)

\[ABA Formal Opinion 512\]

*"Generative AI tools are not a substitute for the lawyer’s professional judgment... A lawyer must ensure that the input and output are accurate."*

* Practical Application: Even the highest legal ethics body in the US warns that AI cannot "think" like a lawyer; it can only mimic the language of one.  
* Source: [American Bar Association](https://www.americanbar.org/)

---

## **4\. STATISTICAL SNAPSHOT**

| Metric | Value | Context | Source |
| :---- | :---- | :---- | :---- |
| AI Hallucination Rate | 69% \- 88% | Frequency of errors in specific legal queries (GPT-3.5 to Llama 2\) | Stanford RegLab |
| Sanction Amount | $10,000 | Fine issued to CA attorney for AI-generated fake citations (2025) | CA Court of Appeal |
| Self-Represented | \~80% | % of Family Law filings in LA County with one pro se party | LA Superior Court |
| Insurance AI Use | \~70% | Market share of insurers using "Colossus" type software | CFA / Industry Data |
| Data Retention | 5 Years | Retention period for Anthropic/Claude training data (unless opted out) | Anthropic Privacy Terms |
| Federal Sanctions | $5,000 | Fine in *Mata v. Avianca* (the original AI hallucination case) | SDNY Court Records |

---

## **5\. RECENT DEVELOPMENTS (Last 24 Months)**

Court Decisions:

* September 2025 (California): The California Second District Court of Appeal sanctioned attorney Amir Mostafavi $10,000 for submitting an appellate brief with 21 fake case citations generated by ChatGPT. The court declared the filing "frivolous" and a waste of judicial resources.  
* June 2024 (Federal): The U.S. District Court (Judge Brantley Starr) and others have updated standing orders requiring litigants to file a "Mandatory Certification Regarding Generative AI," certifying that any AI-drafted content has been human-verified.

Regulatory Changes:

* July 2024: The American Bar Association (ABA) released Formal Opinion 512, the first comprehensive national guidance on Generative AI. It explicitly warns against the "black box" nature of AI and the risks of waiving attorney-client privilege when inputting data into public models.  
* Nov 2023: The State Bar of California released "Practical Guidance for the Use of Generative AI," specifically highlighting that the Duty of Competence (Rule 1.1) requires attorneys to understand the technology's risk of hallucinations before using it.

Privacy & Corporate:

* Oct 2024: OpenAI updated its Terms of Service. While clarifying it does not "own" your output, the shift in data preservation policies due to copyright lawsuits (like *NYT v. OpenAI*) means "deleted" chats may still be preserved for legal compliance, making them discoverable in court.

---

## **6\. VERIFICATION NOTES**

* Claim: "Park v. Kim" (referenced in Phase 1 framework).  
  * Status: ✗ Could not verify a specific *published* CA appellate opinion by this name regarding AI.  
  * Action: Replaced with the verified Amir Mostafavi (CA 2nd Dist. Court of Appeal) case, which is a stronger, verified example of CA sanctions from Sep 2025\.  
* Claim: Colossus market share exactly 70%.  
  * Status: Verification needed. Sources vary between "over 50%" and "up to 70%."  
  * Action: Used "\~70%" to reflect the upper range cited by consumer advocacy groups like the Consumer Federation of America, but the exact current market share is proprietary to DXC Technology.

# \<response 2\>

I see the problem clearly now. Looking at your research output, the Phase 2 research is producing narrative summaries with almost no actual URLs \- just source names like "Stanford RegLab" or "OpenAI.com" without the specific page URLs.

The issue is in the performDeepResearch prompt \- it asks for verified URLs but the model is:

1. Using Google Search to *find* information  
2. But then writing a summary that doesn't include the actual URLs it found  
3. Just naming the source organization instead

Let me look at how BriefView calls the research functions to understand the full flow:  
Read/Users/elvisgoren/Desktop/DK Law/AI Apps/gemini-seo-strategist-v4/components/BriefView.tsx  
Read 336 lines  
Now I understand the full picture. The core problem is that Gemini's Google Search tool returns search results, but the model isn't outputting the actual URLs it found \- it's just summarizing the information and mentioning source names.  
---

## **The Real Problem**

Looking at your research output:

```
**Source:** *Stanford RegLab* (Stanford.edu) | [Verified]
```

This is NOT a URL. It's just a label. The prompt asks for URLs but the model outputs source descriptions instead of actual hyperlinks.

The performDeepResearch prompt (lines 298-431) says things like:

* "Include publication dates for all sources"  
* Format examples with \[Organization\](https://www.ots.ca.gov/...)

But the model interprets this loosely and outputs:

* Stanford RegLab instead of \[Stanford RegLab\](https://law.stanford.edu/actual/path/here)

---

## **Prompt for Gemini AI Studio**

Here's a focused prompt to fix the research phase:

```
The research generation in my app has a critical flaw: it's outputting source NAMES instead of actual clickable URLs.

**Current broken output:**
```

Source: *Stanford RegLab* (Stanford.edu) | \[Verified\]

```

**What I need:**
```

Source: [Stanford RegLab \- Large Legal Fictions](https://law.stanford.edu/publications/large-legal-fictions-profiling-legal-hallucinations-in-large-language-models/) | 2024 | ✓

````

**File:** services/geminiService.ts

**The problem is in `performDeepResearch` function (line 298)**

The prompt asks the model to use Google Search and provide URLs, but the model outputs descriptive text instead of the actual URLs from search results.

**Fix Required - Replace the OUTPUT STRUCTURE section in the prompt with this stricter format:**

```typescript
## OUTPUT FORMAT REQUIREMENTS - READ CAREFULLY

### URL FORMAT RULE (MANDATORY)
Every single source MUST be a clickable Markdown hyperlink. No exceptions.

❌ WRONG: "Source: Stanford RegLab (Stanford.edu)"
❌ WRONG: "Source: [Verified] Stanford Law"  
❌ WRONG: "According to Stanford..."
✅ RIGHT: "[Stanford RegLab](https://law.stanford.edu/publications/large-legal-fictions-profiling-legal-hallucinations-in-large-language-models/)"

### FOR EVERY STATISTIC OR FACT:
Immediately after stating the fact, include the FULL URL in markdown format:
"LLMs hallucinate legal facts 69-88% of the time ([Stanford RegLab Study](https://law.stanford.edu/publications/large-legal-fictions-profiling-legal-hallucinations-in-large-language-models/))."

### TABLE FORMAT FOR SOURCES:
| Claim | Full Citation URL | Year |
|-------|-------------------|------|
| 69-88% hallucination rate | [law.stanford.edu/publications/large-legal-fictions...](https://law.stanford.edu/publications/large-legal-fictions-profiling-legal-hallucinations-in-large-language-models/) | 2024 |

### GOOGLE SEARCH INSTRUCTION:
When you use Google Search and find a relevant result:
1. COPY the exact URL from the search result
2. DO NOT paraphrase or shorten the URL
3. DO NOT construct a URL from memory
4. If a search doesn't return a usable URL, write: [NEEDS MANUAL VERIFICATION - searched for "query"]

### MINIMUM REQUIREMENTS:
- At least 15 FULL URLs (not domain names, FULL page URLs)
- Every statistic must have an inline [hyperlink](url)
- Tables must contain actual URLs, not source names
````

Also add this validation note at the end of the prompt:

```ts
## SELF-CHECK BEFORE SUBMITTING
Count your URLs. If you have fewer than 15 complete URLs (starting with https:// and including the full path), your output is incomplete. The writer phase CANNOT add citations - they must come from this research phase.
```

This should force the model to output actual URLs instead of source descriptions.

````

---

## Why This Is Happening (Technical Explanation)

Gemini's Google Search grounding tool works like this:
1. The model makes a search query
2. It receives search results with URLs
3. It **summarizes** the results into its response

The problem is the model is treating URLs as "context" rather than "output". It reads `law.stanford.edu/publications/xyz` but outputs "Stanford RegLab" because that's more "readable."

Your prompt needs to be **extremely explicit** that the URL itself is required output, not just background information.

---

## Alternative: Structured Output

If the prompt fix doesn't work, consider requesting **JSON output** from the research phase:

```json
{
  "citations": [
    {
      "fact": "LLMs hallucinate legal citations 69-88% of the time",
      "url": "https://law.stanford.edu/publications/large-legal-fictions-profiling-legal-hallucinations-in-large-language-models/",
      "source_name": "Stanford RegLab",
      "year": 2024,
      "verified": true
    }
  ]
}
````

