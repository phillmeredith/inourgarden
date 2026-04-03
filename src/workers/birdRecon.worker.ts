// Web Worker for BirdRecon — runs Transformers.js inference off the main thread
// This prevents Firefox (and any browser) from freezing during the heavy WASM computation

import {
  AutoModelForImageClassification,
  AutoProcessor,
  RawImage,
  env,
} from '@huggingface/transformers'

env.allowLocalModels = true
env.localModelPath = '/models/'

const MODEL_ID = 'bird-classifier'
const MODEL_OPTS = { local_files_only: true } as const

let modelPromise: Promise<{ model: any; processor: any }> | null = null

function getClassifier() {
  if (!modelPromise) {
    modelPromise = Promise.all([
      AutoModelForImageClassification.from_pretrained(MODEL_ID, MODEL_OPTS),
      AutoProcessor.from_pretrained(MODEL_ID, MODEL_OPTS),
    ]).then(([model, processor]) => {
      self.postMessage({ type: 'model-ready' })
      return { model, processor }
    }).catch(err => {
      modelPromise = null
      throw err
    })
  }
  return modelPromise
}

// Pre-load model as soon as worker starts
getClassifier().catch(() => {})

// Handle messages from main thread
self.onmessage = async (e: MessageEvent) => {
  const { type, payload } = e.data

  if (type === 'analyse') {
    try {
      self.postMessage({ type: 'status', status: 'loading-model' })
      const { model, processor } = await getClassifier()

      self.postMessage({ type: 'status', status: 'processing' })
      const image = await RawImage.fromURL(payload.imageDataUrl)
      const inputs = await processor(image)

      self.postMessage({ type: 'status', status: 'inferring' })
      const output = await model(inputs)

      // Softmax on logits
      const logits = output.logits.data as Float32Array
      const scores = Array.from(logits)
      const maxLogit = Math.max(...scores)
      const expScores = scores.map(s => Math.exp(s - maxLogit)) // numerically stable softmax
      const sum = expScores.reduce((a, b) => a + b, 0)
      const probs = expScores.map(s => s / sum)

      const predictions = probs
        .map((score, i) => ({
          label: model.config.id2label[i] || `class_${i}`,
          score,
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 10)

      self.postMessage({ type: 'result', predictions })
    } catch (err: any) {
      self.postMessage({
        type: 'error',
        message: err?.message || 'Analysis failed in worker',
      })
    }
  }
}
