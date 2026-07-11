import React, { useEffect, useRef, useState } from 'react';
import { FormElement, FormField, ProjectIntegrations, SceneElement } from '../../types';
import type gsapType from 'gsap';
import type { ScrollTrigger as ScrollTriggerType } from 'gsap/ScrollTrigger';
import type { DomRendererCtx } from './registry';
import { PositionedElement } from './PositionedElement';

const DEFAULT_WIDTH = 40;
const DEFAULT_SUBMIT_LABEL = 'Send';
const DEFAULT_SUCCESS_MESSAGE = "Thanks — we'll be in touch.";
// Honeypot field name: a decoy input real users never see/fill (visually
// hidden off-screen, not display:none — bots that skip display:none checks
// still fill it). A non-empty value at submit means a bot filled the form.
const HONEYPOT_NAME = 'website';
// Single budget covering the whole reCAPTCHA step (script load + ready +
// execute). A recaptcha outage must never block the user's submission, so
// on timeout/failure we submit without a token rather than surface an error.
const RECAPTCHA_TIMEOUT_MS = 8000;
const RECAPTCHA_ACTION = 'submit';

// Module-level cache keyed by site key so a page with multiple forms (or a
// re-mounted form) only ever injects the reCAPTCHA script once.
let cachedRecaptchaScript: { key: string; promise: Promise<any> } | null = null;

function loadRecaptchaScript(siteKey: string): Promise<any> {
  const existingGrecaptcha = (window as any).grecaptcha;
  if (existingGrecaptcha) return Promise.resolve(existingGrecaptcha);

  if (cachedRecaptchaScript && cachedRecaptchaScript.key === siteKey) {
    return cachedRecaptchaScript.promise;
  }

  const promise = new Promise<any>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(siteKey)}`;
    script.async = true;
    script.onload = () => {
      const grecaptcha = (window as any).grecaptcha;
      if (grecaptcha) resolve(grecaptcha);
      else reject(new Error('reCAPTCHA script loaded but grecaptcha is unavailable'));
    };
    script.onerror = () => reject(new Error('Failed to load the reCAPTCHA script'));
    document.head.appendChild(script);
  });

  cachedRecaptchaScript = { key: siteKey, promise };
  return promise;
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('reCAPTCHA timed out')), ms);
    promise.then(
      value => {
        clearTimeout(timer);
        resolve(value);
      },
      error => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });
}

// Resolves to a token, or undefined if the script fails to load, execute, or
// respond within the timeout budget — callers submit without it either way.
async function getRecaptchaToken(siteKey: string): Promise<string | undefined> {
  try {
    return await withTimeout(
      (async () => {
        const grecaptcha = await loadRecaptchaScript(siteKey);
        return await new Promise<string>((resolve, reject) => {
          grecaptcha.ready(() => {
            grecaptcha.execute(siteKey, { action: RECAPTCHA_ACTION }).then(resolve).catch(reject);
          });
        });
      })(),
      RECAPTCHA_TIMEOUT_MS
    );
  } catch {
    return undefined;
  }
}

export function FormElementView({
  element,
  gsapInstance,
  scrollTrigger,
  container,
  sceneStartPx,
  sceneHeightPx,
  integrations,
}: {
  element: SceneElement;
  gsapInstance: typeof gsapType;
  scrollTrigger: typeof ScrollTriggerType;
  container: HTMLDivElement;
  sceneStartPx: number;
  sceneHeightPx: number;
  integrations?: ProjectIntegrations;
}) {
  if (element.type !== 'form') return null;

  const form = element as FormElement;
  const ctx: DomRendererCtx = { gsapInstance, scrollTrigger, container, sceneStartPx, sceneHeightPx };
  // No layout means a sensible default point size, mirroring the
  // carousel/gallery default-layout pattern (a form is a point element).
  const effectiveElement: SceneElement = form.layout
    ? form
    : { ...form, layout: { x: 50, y: 50, anchor: 'center', width: DEFAULT_WIDTH } };

  return (
    <PositionedElement element={effectiveElement} ctx={ctx} interactive>
      <FormCard form={form} endpoint={integrations?.formEndpoint} recaptchaSiteKey={integrations?.recaptchaSiteKey} />
    </PositionedElement>
  );
}

type SubmitStatus = 'idle' | 'submitting' | 'success' | 'error';

function FormCard({
  form,
  endpoint,
  recaptchaSiteKey,
}: {
  form: FormElement;
  endpoint?: string;
  recaptchaSiteKey?: string;
}) {
  const fields = form.fields ?? [];
  const submitLabel = form.submitLabel ?? DEFAULT_SUBMIT_LABEL;
  const successMessage = form.successMessage ?? DEFAULT_SUCCESS_MESSAGE;

  const [status, setStatus] = useState<SubmitStatus>('idle');
  const [values, setValues] = useState<Record<string, string>>({});
  const abortRef = useRef<AbortController | null>(null);

  // StrictMode-safe: abort any in-flight submission on unmount so a fetch
  // never resolves into a dead component.
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const handleFieldChange = (id: string, value: string) => {
    setValues(previous => ({ ...previous, [id]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    // Prevent default form submission; this element never navigates.
    event.preventDefault();

    const honeypotValue = (event.currentTarget.elements.namedItem(HONEYPOT_NAME) as HTMLInputElement | null)?.value;
    if (honeypotValue) {
      // A bot filled the decoy field — show success without ever posting.
      setStatus('success');
      return;
    }

    if (!endpoint) return;

    // Duplicate labels collide on a plain label key and silently drop a
    // value — keep the first occurrence's clean label and namespace any
    // later collisions with the field id so every value survives.
    const payload: Record<string, string> = {};
    const seenLabels = new Set<string>();
    fields.forEach(field => {
      const key = seenLabels.has(field.label) ? `${field.label} (${field.id})` : field.label;
      seenLabels.add(field.label);
      payload[key] = values[field.id] ?? '';
    });

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setStatus('submitting');

    if (recaptchaSiteKey) {
      const token = await getRecaptchaToken(recaptchaSiteKey);
      // The recaptcha step has no cancellation of its own — if the
      // component unmounted (or a newer submit superseded us) while we were
      // awaiting it, bail out before touching state or firing the request.
      if (controller.signal.aborted) return;
      if (token) payload['g-recaptcha-response'] = token;
    }

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      setStatus(response.ok ? 'success' : 'error');
    } catch (error) {
      if ((error as { name?: string }).name === 'AbortError') return;
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <div className="w-full rounded-xl border border-slate-800 bg-slate-900/70 p-6 text-center text-sm text-slate-100">
        {successMessage}
      </div>
    );
  }

  return (
    <div className="w-full rounded-xl border border-slate-800 bg-slate-900/70 p-6">
      {form.title && <h3 className="mb-4 text-lg font-semibold text-slate-100">{form.title}</h3>}

      {!endpoint && (
        <p className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
          Connect a form endpoint in the Integrations drawer (plug icon) to enable submissions.
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        {fields.map(field => (
          <FormFieldInput
            key={field.id}
            field={field}
            value={values[field.id] ?? ''}
            onChange={value => handleFieldChange(field.id, value)}
          />
        ))}

        <input
          type="text"
          name={HONEYPOT_NAME}
          autoComplete="off"
          tabIndex={-1}
          className="absolute -left-[9999px] h-px w-px overflow-hidden"
        />

        {status === 'error' && (
          <p className="text-xs text-rose-400">Something went wrong sending your message — please try again.</p>
        )}

        <button
          type="submit"
          disabled={status === 'submitting'}
          className="w-full rounded-lg bg-teal-500 px-4 py-2 text-sm font-semibold text-slate-950 transition-colors hover:bg-teal-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status === 'submitting' ? 'Sending…' : submitLabel}
        </button>
      </form>
    </div>
  );
}

function FormFieldInput({ field, value, onChange }: { field: FormField; value: string; onChange: (value: string) => void }) {
  const inputClasses =
    'w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-teal-500 focus:outline-none';

  return (
    <div>
      <label htmlFor={field.id} className="mb-1 block text-xs uppercase tracking-wider text-slate-400">
        {field.label}
        {field.required && <span className="text-rose-400"> *</span>}
      </label>
      {field.kind === 'textarea' ? (
        <textarea
          id={field.id}
          name={field.id}
          required={field.required}
          value={value}
          onChange={event => onChange(event.target.value)}
          rows={4}
          className={inputClasses}
        />
      ) : (
        <input
          id={field.id}
          name={field.id}
          type={field.kind === 'email' ? 'email' : 'text'}
          required={field.required}
          value={value}
          onChange={event => onChange(event.target.value)}
          className={inputClasses}
        />
      )}
    </div>
  );
}
