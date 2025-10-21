/*
import OpenAI from "openai";
import { PlatformError } from "../../types.js";

interface AIVerifyResult {
  is_match: boolean;
  reason: string;
  mismatched_fields?: string[];
}

export class AIVerifyService {
  private client: OpenAI;

  constructor(apiKey: string, apiEndpoint: string) {
    if (!apiKey || !apiEndpoint) {
      throw new Error("AI Verifier requires an API Key and Endpoint.");
    }
    this.client = new OpenAI({
      apiKey: apiKey,
      baseURL: apiEndpoint,
    });
  }

  public async verifyJSON(
    actualData: Record<string, any>,
    expectedData: Record<string, any>
  ): Promise<AIVerifyResult> {
    const prompt = this.constructJsonPrompt(actualData, expectedData);

    console.log("--- AI JSON Prompt ---");
    console.log(prompt);
    console.log("----------------------");

    try {
      const completion = await this.client.chat.completions.create({
        model: "hunyuan-turbos-latest",
        messages: [{ role: "user", content: prompt }],
        // @ts-ignore - 适配混元特定的参数
        enable_enhancement: true,
      });

      const choice = completion.choices[0];
      if (!choice || !choice.message || !choice.message.content) {
        throw new Error("Invalid AI response structure or empty content.");
      }
      const content = choice.message.content;
      
      console.log("--- AI Raw Response ---");
      console.log(content);
      console.log("-----------------------");

      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/);
      const jsonString = jsonMatch ? jsonMatch[1] : content;

      if (!jsonString) {
        throw new Error("Could not extract JSON from AI response.");
      }
      
      const parsedContent = JSON.parse(jsonString);

      return {
        is_match: parsedContent.is_match,
        reason: parsedContent.reason,
        mismatched_fields: parsedContent.mismatched_fields || [],
      };
    } catch (error: any) {
      throw new PlatformError(`AI Verify JSON request failed: ${error.message}`);
    }
  }

  private constructJsonPrompt(
    actualData: Record<string, any>,
    expectedData: Record<string, any>
  ): string {
    const actualJson = JSON.stringify(actualData, null, 2);
    const expectedJson = JSON.stringify(expectedData, null, 2);

    return `
You are a precise data validation engine. Your sole task is to compare two JSON objects: 'actualData' (extracted from the webpage) and 'expectedData' (the ground truth).

**CRITICAL INSTRUCTIONS:**
1.  **FUZZY MATCHING**:
    *   **Strings**: Perform a case-insensitive and whitespace-insensitive comparison.
    *   **Arrays (like tags)**: The order of elements does not matter. 'actualData' can contain extra elements. As long as all elements from 'expectedData' are present in 'actualData', it's a match.
2.  **RESPONSE FORMAT**: Your entire response MUST be a single, raw JSON object. No markdown, no explanations outside the JSON.
    *   The JSON MUST have a boolean 'is_match'.
    *   The JSON MUST have a string 'reason' explaining the validation result.
    *   If 'is_match' is false, it MUST include a 'mismatched_fields' array listing the keys that failed validation.

**Actual Data (from webpage):**
\`\`\`json
${actualJson}
\`\`\`

**Expected Data (ground truth):**
\`\`\`json
${expectedJson}
\`\`\`

Now, compare the two JSON objects and provide the result in the specified raw JSON format.
`;
  }
}
*/
