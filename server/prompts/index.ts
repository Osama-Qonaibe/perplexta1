import { fastChatPrompt } from './fastChat.js';
import { strategicChatPrompt } from './strategicChat.js';
import { professionalAdvisoryPrompt } from './professionalAdvisory.js';
import { codeEngineeringPrompt } from './codeEngineering.js';
import { searchResearchPrompt } from './searchResearch.js';
import { researchStudiesPrompt } from './researchStudies.js';
import { deepReasoningPrompt } from './deepReasoning.js';
import { adsCopilotPrompt } from './adsCopilot.js';
import { documentAnalysisPrompt } from './documentAnalysis.js';
import { imageVisionPrompt } from './imageVision.js';
import { videoMotionPrompt } from './videoMotion.js';
import { interactiveCanvasPrompt } from './interactiveCanvas.js';
import { sceneArchitectPrompt } from './sceneArchitect.js';

export interface ToolPromptDefinition {
  ar: string;
  en: string;
}

/**
 * Isolated Tool Prompts Registry
 * Each tool loads ONLY its dedicated prompt and operating rules, avoiding cross-tool bloat.
 */
export const TOOL_PROMPTS_REGISTRY: Record<string, ToolPromptDefinition> = {
  chat_fast: fastChatPrompt,
  chat: strategicChatPrompt,
  chat_pro: professionalAdvisoryPrompt,
  professional_advisory: professionalAdvisoryPrompt,
  chat_professional: professionalAdvisoryPrompt,
  professional: professionalAdvisoryPrompt,
  code: codeEngineeringPrompt,
  search: searchResearchPrompt,
  sovereign_search: researchStudiesPrompt,
  research_studies: researchStudiesPrompt,
  research: researchStudiesPrompt,
  studies: researchStudiesPrompt,
  chat_reasoning: deepReasoningPrompt,
  ads_copilot: adsCopilotPrompt,
  ads: adsCopilotPrompt,
  copilot: adsCopilotPrompt,
  perplexta_analysis: documentAnalysisPrompt,
  document_analysis: documentAnalysisPrompt,
  analysis: documentAnalysisPrompt,
  file_analysis: documentAnalysisPrompt,
  image: imageVisionPrompt,
  video: videoMotionPrompt,
  canvas: interactiveCanvasPrompt,
  scene_architect: sceneArchitectPrompt,
  scenearchitect: sceneArchitectPrompt,
  architect: sceneArchitectPrompt,
  scene_architect_v1: sceneArchitectPrompt,
};

/**
 * Resolve isolated prompt for a specific tool
 */
export const getIsolatedToolPrompt = (toolId: string = 'chat_fast', isArabic: boolean = true): string => {
  const normalizedId = toolId.toLowerCase();
  const toolObj = TOOL_PROMPTS_REGISTRY[normalizedId] || TOOL_PROMPTS_REGISTRY['chat_fast'];
  return isArabic ? toolObj.ar : toolObj.en;
};
