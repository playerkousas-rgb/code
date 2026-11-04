// Only normalized, bounded fields are accepted. Public data is explicitly
// projected, never copied wholesale from an untrusted client.
const ID = /^[A-Za-z0-9_-]{1,64}$/;
export function validId(value) { return typeof value === 'string' && ID.test(value) && !['__proto__','constructor','prototype'].includes(value); }
export function validateQuestionSet(input, { privateAnswers = false } = {}) {
  if (!input || !validId(input.id) || !Number.isSafeInteger(input.revision) || input.revision < 1 || input.revision > 1e9 || typeof input.title !== 'string' || !input.title.trim() || input.title.length > 100 || !Array.isArray(input.questions) || input.questions.length < 1 || input.questions.length > 30) return null;
  const ids = new Set();
  const questions = [];
  for (const q of input.questions) {
    if (!q || !validId(q.id) || ids.has(q.id) || typeof q.prompt !== 'string' || !q.prompt.trim() || q.prompt.length > 2000 || typeof q.label !== 'string' || q.label.length > 100 || typeof q.kind !== 'string' || !['text','semaphore','braille','pigpen'].includes(q.kind) || (privateAnswers && (typeof q.answer !== 'string' || q.answer.length > 2000 || !q.answer.trim()))) return null;
    // Symbolic prompts are represented by fixed, validated glyph tokens rather
    // than HTML, so other people's question sets cannot inject markup.
    if (q.kind === 'semaphore' && !/^(?:[0-7],[0-7]|\/)(?: (?:[0-7],[0-7]|\/))*$/.test(q.prompt)) return null;
    if (q.kind === 'pigpen' && !/^(?:[0-9]|1[0-9]|2[0-5]|\/)(?: (?:[0-9]|1[0-9]|2[0-5]|\/))*$/.test(q.prompt)) return null;
    if (q.kind === 'braille') return null;
    ids.add(q.id);
    questions.push({id:q.id, label:q.label, kind:q.kind, prompt:q.prompt, ...(privateAnswers ? {answer:q.answer} : {})});
  }
  return { id:input.id, revision:input.revision, title:input.title.trim(), questions };
}
export function publicQuestionSet(input) { return validateQuestionSet(input); }
