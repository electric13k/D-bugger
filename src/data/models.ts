import { OpenRouterModelOption } from '../types';

export const OPENROUTER_MODELS: OpenRouterModelOption[] = [
  {
    id: 'openrouter/free',
    name: 'OpenRouter Free Models Router',
    contextLength: 'Provider-dependent',
    isFree: true,
    provider: 'OpenRouter',
    recommendedFor: 'Routes a real request to an available free model; inspect the returned model in the activity log',
    badge: 'Current Free Router',
  },
  {
    id: 'nvidia/nemotron-3.5-lightning:free',
    name: 'NVIDIA Nemotron 3.5 Lightning (Free)',
    contextLength: 'Provider-dependent',
    isFree: true,
    provider: 'NVIDIA',
    recommendedFor: 'Fast code analysis and concise repository findings',
    badge: 'Fast',
  },
  {
    id: 'cohere/north-mini-code:free',
    name: 'Cohere North Mini Code (Free)',
    contextLength: 'Provider-dependent',
    isFree: true,
    provider: 'Cohere',
    recommendedFor: 'Focused code review and patch proposals',
    badge: 'Code Focused',
  },
  {
    id: 'z-ai/glm-5.2:free',
    name: 'Z.ai GLM 5.2 (Free)',
    contextLength: 'Provider-dependent',
    isFree: true,
    provider: 'Z.ai',
    recommendedFor: 'General repository diagnosis and explanation',
    badge: 'General',
  },
  {
    id: 'nvidia/nemotron-3-super-120b-a12b:free',
    name: 'NVIDIA Nemotron 3 Super (Free)',
    contextLength: 'Provider-dependent',
    isFree: true,
    provider: 'NVIDIA',
    recommendedFor: 'Longer code context and cross-file analysis',
    badge: 'Long Context',
  },
];
