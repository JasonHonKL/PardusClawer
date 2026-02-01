export type PromptMemory = string;
export type UserRequest = string;
export type AgentPrompt = string;

export interface PromptInput {
  memory: PromptMemory;
  userRequest: UserRequest;
}

export const buildPrompt = (input: PromptInput): AgentPrompt => {
  const { memory, userRequest } = input;

  return `
# Task
Search online for the requested data and export it to CSV or PDF format as appropriate.

# Context from Memory
${memory || 'No previous memory available.'}

# User Request
${userRequest}

# Instructions
1. Search online to find the requested data
2. Extract and organize the relevant information
3. Convert the data to CSV or PDF format as appropriate
   - Use CSV for tabular data that can be opened in spreadsheets
   - Use PDF for reports, documents, or formatted output
4. Save the file(s) in the current working directory with meaningful filenames
5. Use descriptive filenames (e.g., "sales_data_2026.csv", "report_february2026.pdf", "tech_stocks_feb2026.csv")
6. Do NOT use emojis in the file content or filename
7. Ensure proper file formatting:
   - CSV: proper headers, consistent data types, valid escaping
   - PDF: professional formatting, clear structure, readable fonts
8. IMPORTANT: After completing the task, you MUST update the memory file with a summary of what you accomplished
9. Memory Management: Check if the current memory exceeds 20,000 tokens (approximately 5,000 words)
   - If memory is over 20k tokens, compress it by:
     * Keeping only the most recent and relevant information
     * Summarizing older entries into concise bullet points
     * Preserving key findings, data sources, and important context
   - Use this rule: 1 word ≈ 4 tokens

# Autonomous Problem Solving (CRITICAL!)
- NEVER ask questions that the user cannot reasonably answer
- Make reasonable assumptions and proceed with the task
- Use common sense to interpret ambiguous requests
- Choose sensible defaults when multiple options exist
- Be proactive and solve problems independently
- Only ask for clarification if the task is genuinely impossible to complete without additional information
- Trust your judgment and make decisions rather than stalling
- If unsure about a detail, pick the most logical option and continue
- The goal is to complete the task autonomously, not to engage in back-and-forth

# Task Recurrence (Important!)
Check the User Request for recurrence patterns:
- If the request says "every day", "daily", or similar, this is a recurring task
- If the request says "every week", "weekly", or similar, this is a recurring task
- If the request says "every X hours/days/weeks", this is a recurring task
- If no recurrence pattern is mentioned, this is a one-time task

For recurring tasks, include in your memory summary:
- The recurrence pattern (e.g., "Run every day at 9 AM", "Run weekly on Mondays")
- The next suggested execution time (e.g., "Next run: Tomorrow 9 AM")
- Any data sources or patterns that should be tracked across runs

# Output Requirements
- CSV or PDF file(s) saved to current directory (choose format based on data type)
- Meaningful filename that describes the data
- No emojis in content or filename
- Proper file structure:
  - CSV: headers, consistent data types
  - PDF: professional formatting, clear structure
- Updated memory file with task summary and compressed if necessary
- For recurring tasks: Note the recurrence pattern and next run time in memory
`.trim();
};

export const createPromptInput = (memory: PromptMemory, userRequest: UserRequest): PromptInput => ({
  memory,
  userRequest,
});
