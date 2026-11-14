/* eslint-disable @typescript-eslint/no-require-imports */
import { SentimentResult } from '../types/models';

const { createSentimentClassifier } = require('../ml/sentiment');
const model = require('../ml/model-edom.json');

const classify = createSentimentClassifier(model);

export function analyzeReason(text: string): SentimentResult {
  try {
    const r = classify(text);
    return {
      label: r.label ?? null,
      status: r.status,
      experimental: Boolean(r.experimental),
    };
  } catch {
    return {
      label: null,
      status: 'error',
      experimental: true,
    };
  }
}
