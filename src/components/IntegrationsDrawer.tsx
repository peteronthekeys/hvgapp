/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { X, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { ProjectSchema, ProjectIntegrations } from '../types';

// Editor-only: user-managed public site keys (form endpoint, reCAPTCHA v3
// site key, Google Maps key). Never imported by elements/, site/, player/,
// or export code — the AI never sees these (server/gemini.ts strips them
// from output and reattaches the caller's existing values verbatim).

interface IntegrationsDrawerProps {
  schema: ProjectSchema;
  onChange: (schema: ProjectSchema) => void;
  onClose: () => void;
}

type TestStatus = 'idle' | 'testing' | 'pass' | 'fail';

interface TestResult {
  status: TestStatus;
  message?: string;
}

const IDLE_RESULT: TestResult = { status: 'idle' };
const RECAPTCHA_TIMEOUT_MS = 10000;

function StatusIcon({ status }: { status: TestStatus }) {
  if (status === 'testing') return <Loader2 size={14} className="animate-spin text-slate-400" />;
  if (status === 'pass') return <CheckCircle2 size={14} className="text-emerald-400" />;
  if (status === 'fail') return <XCircle size={14} className="text-rose-400" />;
  return null;
}

interface IntegrationCardProps {
  title: string;
  steps: string[];
  placeholder: string;
  value: string;
  onValueChange: (value: string) => void;
  onTest: () => void;
  result: TestResult;
  footnote?: string;
}

function IntegrationCard({ title, steps, placeholder, value, onValueChange, onTest, result, footnote }: IntegrationCardProps) {
  return (
    <div className="border border-slate-800 rounded-lg p-3 bg-slate-900/50 space-y-2">
      <h3 className="text-sm font-semibold text-slate-200">{title}</h3>
      <ol className="text-xs text-slate-400 list-decimal list-inside space-y-0.5">
        {steps.map((step, i) => (
          <li key={i}>{step}</li>
        ))}
      </ol>
      <input
        type="text"
        value={value}
        onChange={e => onValueChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-teal-500 font-mono"
      />
      {footnote && <p className="text-[10px] text-slate-500">{footnote}</p>}
      <div className="flex items-center gap-2">
        <button
          onClick={onTest}
          disabled={!value || result.status === 'testing'}
          className="text-xs px-2 py-1 rounded border border-slate-700 text-slate-300 hover:border-emerald-500 hover:text-emerald-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-slate-700 disabled:hover:text-slate-300"
        >
          Test
        </button>
        <StatusIcon status={result.status} />
        {result.message && (
          <span className={`text-[11px] ${result.status === 'fail' ? 'text-rose-400' : result.status === 'pass' ? 'text-emerald-400' : 'text-slate-400'}`}>
            {result.message}
          </span>
        )}
      </div>
    </div>
  );
}

export function IntegrationsDrawer({ schema, onChange, onClose }: IntegrationsDrawerProps) {
  const integrations = schema.integrations ?? {};
  const [formResult, setFormResult] = useState<TestResult>(IDLE_RESULT);
  const [recaptchaResult, setRecaptchaResult] = useState<TestResult>(IDLE_RESULT);
  const [mapsResult, setMapsResult] = useState<TestResult>(IDLE_RESULT);

  // Tracks the pending test's timeout id and mounted state so a stray
  // grecaptcha callback or timeout firing after unmount can't touch state
  // or leak a scheduled timer past the drawer's lifetime.
  const recaptchaTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  const cleanupRecaptcha = () => {
    document.querySelectorAll('script[data-integrations-drawer="recaptcha"]').forEach(el => el.remove());
    document.querySelectorAll('.grecaptcha-badge').forEach(el => el.remove());
  };

  // Best-effort teardown of the injected reCAPTCHA script/badge whenever the
  // drawer unmounts (user closes it), not just when a test completes.
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (recaptchaTimeoutRef.current !== null) {
        clearTimeout(recaptchaTimeoutRef.current);
        recaptchaTimeoutRef.current = null;
      }
      cleanupRecaptcha();
    };
  }, []);

  const updateIntegration = (key: keyof ProjectIntegrations, value: string) => {
    onChange({ ...schema, integrations: { ...schema.integrations, [key]: value || undefined } });
  };

  const testFormEndpoint = async () => {
    const endpoint = integrations.formEndpoint;
    if (!endpoint) return;
    setFormResult({ status: 'testing' });
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ _test: true, message: 'Animation Studio Pro test' }),
      });
      if (res.ok) {
        setFormResult({ status: 'pass', message: 'Endpoint accepted a test submission' });
      } else {
        setFormResult({ status: 'fail', message: `Endpoint responded with ${res.status}` });
      }
    } catch {
      setFormResult({
        status: 'fail',
        message: "Couldn't verify from the browser — the endpoint may still work on your published site",
      });
    }
  };

  const testRecaptcha = () => {
    const key = integrations.recaptchaSiteKey;
    if (!key) return;
    setRecaptchaResult({ status: 'testing' });
    cleanupRecaptcha();

    let settled = false;
    const finish = (result: TestResult) => {
      if (settled) return;
      settled = true;
      if (recaptchaTimeoutRef.current !== null) {
        clearTimeout(recaptchaTimeoutRef.current);
        recaptchaTimeoutRef.current = null;
      }
      if (!mountedRef.current) return;
      setRecaptchaResult(result);
    };

    recaptchaTimeoutRef.current = setTimeout(
      () => finish({ status: 'fail', message: 'Timed out waiting for reCAPTCHA' }),
      RECAPTCHA_TIMEOUT_MS
    );

    const script = document.createElement('script');
    script.dataset.integrationsDrawer = 'recaptcha';
    script.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(key)}`;
    script.onload = () => {
      const grecaptcha = (window as any).grecaptcha;
      if (!grecaptcha) {
        finish({ status: 'fail', message: 'reCAPTCHA script loaded but grecaptcha is unavailable' });
        return;
      }
      grecaptcha.ready(() => {
        grecaptcha
          .execute(key, { action: 'test' })
          .then(() => finish({ status: 'pass', message: 'Site key verified — token issued' }))
          .catch(() => finish({ status: 'fail', message: 'Key rejected by reCAPTCHA' }));
      });
    };
    script.onerror = () => finish({ status: 'fail', message: 'Failed to load the reCAPTCHA script' });
    document.head.appendChild(script);
  };

  const testMapsKey = () => {
    const key = integrations.googleMapsApiKey;
    if (!key) return;
    setMapsResult({ status: 'testing' });
    const img = new Image();
    img.onload = () => setMapsResult({ status: 'pass', message: 'Key accepted a Static Maps request' });
    img.onerror = () =>
      setMapsResult({
        status: 'fail',
        message: 'Key rejected — check that Static Maps API is enabled and the key allows this origin',
      });
    img.src = `https://maps.googleapis.com/maps/api/staticmap?center=0,0&zoom=1&size=100x100&key=${encodeURIComponent(key)}`;
  };

  return (
    <div className="fixed top-12 right-0 bottom-0 w-96 bg-slate-950 border-l border-slate-800 z-50 flex flex-col shadow-2xl">
      <div className="h-12 border-b border-slate-800 flex items-center justify-between px-4 shrink-0">
        <h2 className="text-sm font-semibold text-slate-200">Integrations</h2>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-200 transition-colors w-7 h-7 flex items-center justify-center rounded hover:bg-slate-800"
          title="Close"
        >
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <IntegrationCard
          title="Form endpoint"
          steps={[
            'Create a free form at formspree.io (or any endpoint that accepts JSON POST).',
            "Copy the form's endpoint URL.",
            'Paste it below.',
          ]}
          placeholder="https://formspree.io/f/xxxxxxx"
          value={integrations.formEndpoint ?? ''}
          onValueChange={v => updateIntegration('formEndpoint', v)}
          onTest={testFormEndpoint}
          result={formResult}
        />

        <IntegrationCard
          title="reCAPTCHA v3 site key"
          steps={[
            'Go to google.com/recaptcha/admin.',
            'Register your site (choose reCAPTCHA v3).',
            'Copy the SITE key — never the secret key.',
            'Paste it below.',
          ]}
          placeholder="6Lc..."
          value={integrations.recaptchaSiteKey ?? ''}
          onValueChange={v => updateIntegration('recaptchaSiteKey', v)}
          onTest={testRecaptcha}
          result={recaptchaResult}
        />

        <IntegrationCard
          title="Google Maps key"
          steps={[
            'In Google Cloud console, enable the "Maps Embed API" (and optionally Static Maps).',
            "Create an API key restricted to your site's domain.",
            'Paste it below.',
          ]}
          placeholder="AIza..."
          value={integrations.googleMapsApiKey ?? ''}
          onValueChange={v => updateIntegration('googleMapsApiKey', v)}
          onTest={testMapsKey}
          result={mapsResult}
          footnote="This test checks the Static Maps API — the map element on your page uses the Embed API."
        />

        <p className="text-[11px] text-slate-500 border-t border-slate-800 pt-3">
          These are public site keys — they're embedded in your exported site. Never paste secret keys here.
        </p>
      </div>
    </div>
  );
}
