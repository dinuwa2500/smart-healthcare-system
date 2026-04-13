"use strict";

const RAW_MODEL    = process.env.HF_CHAT_MODEL || 'katanemo/Arch-Router-1.5B';
const MODEL        = RAW_MODEL.includes(':') ? RAW_MODEL : `${RAW_MODEL}:hf-inference`;
const TIMEOUT_MS   = 30_000;


async function callZephyr(prompt) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    if (!process.env.HF_API_TOKEN) {
      const configErr = new Error('HF_API_TOKEN is not configured');
      configErr.code = 'HF_CONFIG';
      throw configErr;
    }

    const response = await fetch('https://router.huggingface.co/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.HF_API_TOKEN}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'user', content: prompt },
        ],
        max_tokens: 400,
        temperature: 0.3,
      }),
      signal: controller.signal,
    });

    if (response.status === 429) {
      const rateErr = new Error('HuggingFace rate limit exceeded');
      rateErr.code = 'HF_RATE_LIMIT';
      rateErr.retryAfter = response.headers.get('retry-after') || '60';
      throw rateErr;
    }

    if (!response.ok) {
      const errorText = await response.text();
      const upstreamErr = new Error(errorText || `HuggingFace request failed with status ${response.status}`);
      upstreamErr.status = response.status;
      if (errorText.includes('model_not_supported')) {
        upstreamErr.code = 'HF_MODEL_UNSUPPORTED';
      }
      if (errorText.includes('provider')) {
        upstreamErr.code = upstreamErr.code || 'HF_PROVIDER_ERROR';
      }
      throw upstreamErr;
    }

    const json = await response.json();
    const content = json.choices?.[0]?.message?.content?.trim();
    if (!content) {
      const emptyErr = new Error('HuggingFace returned an empty completion');
      emptyErr.code = 'HF_EMPTY_RESPONSE';
      throw emptyErr;
    }
    return content;
  } catch (err) {
    // Surface meaningful error types for the controller
    if (err.name === 'AbortError' || err.message?.includes('aborted')) {
      const timeoutErr = new Error('HuggingFace request timed out after 30s');
      timeoutErr.code  = 'HF_TIMEOUT';
      throw timeoutErr;
    }
    if (err.status === 429 || err.message?.includes('429')) {
      const rateErr    = new Error('HuggingFace rate limit exceeded');
      rateErr.code     = 'HF_RATE_LIMIT';
      rateErr.retryAfter = err.headers?.['retry-after'] || '60';
      throw rateErr;
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

module.exports = { callZephyr };
