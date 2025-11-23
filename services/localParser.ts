import { Question, QuestionType, Option } from "../types";

export const parseQuestionsLocally = (text: string): Question[] => {
  const lines = text.split(/\r?\n/).map(line => line.trim()).filter(line => line);
  const questions: Question[] = [];
  
  let currentQuestion: Partial<Question> | null = null;
  let currentId = 1;

  // Regex patterns
  const questionStartPattern = /^(\d+)[\.\)\-\s]+(.+)/; // Detects: 1. Text OR 1) Text
  const optionStartPattern = /^([A-Ea-e])[\.\)\-\s]+(.+)/;   // Detects start of line: A. Text

  // Helper to extract inline options from a text line
  // Example: "a. Apple b. Banana c. Cherry"
  const extractInlineOptions = (textLine: string, existingOptions: Option[]) => {
    // Regex matches " a. " or " A. " or "(a)" preceded by space or start of string
    // capturing the label and the content until the next option label or end of string
    const inlineRegex = /(?:^|\s)([A-Ea-e])[\.\)\-]\s+(.*?)(?=\s+[A-Ea-e][\.\)\-]\s+|$)/g;
    let match;
    let found = false;
    
    // Check if line looks like it holds options
    while ((match = inlineRegex.exec(textLine)) !== null) {
        found = true;
        existingOptions.push({
            label: match[1].toUpperCase(),
            text: match[2].trim()
        });
    }
    return found;
  };

  lines.forEach((line) => {
    const questionMatch = line.match(questionStartPattern);
    const optionMatch = line.match(optionStartPattern);

    if (questionMatch) {
      // SAVE PREVIOUS QUESTION
      if (currentQuestion) {
        if (!currentQuestion.options || currentQuestion.options.length === 0) {
            // Try to find inline options in the question text itself before giving up
            if (currentQuestion.text) {
                 const extracted: Option[] = [];
                 const hasInline = extractInlineOptions(currentQuestion.text, extracted);
                 if (hasInline) {
                     // If we found options inside the text, we need to clean the text
                     // This is complex regex, for now assume text contains options.
                     // A simple heuristic: Split text at the first option label
                     const firstOptLabel = extracted[0].label.toLowerCase();
                     const splitIdx = currentQuestion.text.toLowerCase().search(new RegExp(`(?:^|\\s)${firstOptLabel}[\\.\\)\\-]`));
                     if (splitIdx > -1) {
                         currentQuestion.text = currentQuestion.text.substring(0, splitIdx).trim();
                     }
                     currentQuestion.options = extracted;
                 }
            }
        }

        // Determine Type
        if (!currentQuestion.options || currentQuestion.options.length === 0) {
            currentQuestion.type = QuestionType.ESSAY;
        } else {
            currentQuestion.type = QuestionType.MULTIPLE_CHOICE;
        }
        questions.push(currentQuestion as Question);
      }

      // START NEW QUESTION
      currentQuestion = {
        id: currentId++,
        text: questionMatch[2].trim(),
        options: [],
        type: QuestionType.ESSAY, 
        difficulty: 'Sedang'
      };
      
      // Check if the question line itself has inline options immediately (e.g. "1. 2+2=? a.4 b.5")
      if (currentQuestion.options) {
        const hasInline = extractInlineOptions(currentQuestion.text!, currentQuestion.options);
        if (hasInline && currentQuestion.text && currentQuestion.options.length > 0) {
             const firstOptLabel = currentQuestion.options[0].label.toLowerCase();
             const splitIdx = currentQuestion.text.toLowerCase().search(new RegExp(`(?:^|\\s)${firstOptLabel}[\\.\\)\\-]`));
             if (splitIdx > -1) {
                 currentQuestion.text = currentQuestion.text.substring(0, splitIdx).trim();
             }
        }
      }
    } 
    else if (optionMatch && currentQuestion) {
      // LINE STARTS WITH OPTION
      const label = optionMatch[1].toUpperCase();
      const optText = optionMatch[2].trim();
      
      if (!currentQuestion.options) currentQuestion.options = [];
      
      currentQuestion.options.push({
        label: label,
        text: optText
      });
    } 
    else {
      // CONTINUATION LINE
      if (currentQuestion) {
        // Check if this continuation line actually contains inline options
        // e.g. previous line: "1. Color of sky?"
        // current line: "a. Blue b. Red"
        if (!currentQuestion.options) currentQuestion.options = [];
        
        const hasInline = extractInlineOptions(line, currentQuestion.options);
        
        if (!hasInline) {
            // Standard continuation text
            if (currentQuestion.options && currentQuestion.options.length > 0) {
              const lastOptionIdx = currentQuestion.options.length - 1;
              currentQuestion.options[lastOptionIdx].text += " " + line;
            } else {
              currentQuestion.text += " " + line;
            }
        }
      }
    }
  });

  // Push the last question
  if (currentQuestion) {
    if (!currentQuestion.options || currentQuestion.options.length === 0) {
        // Last check for inline in text
         if (currentQuestion.text) {
             const extracted: Option[] = [];
             const hasInline = extractInlineOptions(currentQuestion.text, extracted);
             if (hasInline) {
                 const firstOptLabel = extracted[0].label.toLowerCase();
                 const splitIdx = currentQuestion.text.toLowerCase().search(new RegExp(`(?:^|\\s)${firstOptLabel}[\\.\\)\\-]`));
                 if (splitIdx > -1) {
                     currentQuestion.text = currentQuestion.text.substring(0, splitIdx).trim();
                 }
                 currentQuestion.options = extracted;
             }
        }
    }

    if (!currentQuestion.options || currentQuestion.options.length === 0) {
        currentQuestion.type = QuestionType.ESSAY;
    } else {
        currentQuestion.type = QuestionType.MULTIPLE_CHOICE;
    }
    questions.push(currentQuestion as Question);
  }

  return questions;
};