/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Standalone runtime for exported sites: renders a ProjectSchema fullscreen
// with no editor/chat chrome. Reads the schema from window.__ASP_PROJECT__,
// set by the exported HTML shell before this script loads.

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../index.css';
import { migrateSchema } from '../schema/migrate';
import { PreviewPanel } from '../components/PreviewPanel';

declare global {
  interface Window {
    __ASP_PROJECT__?: unknown;
  }
}

const schema = migrateSchema(window.__ASP_PROJECT__);

const rootEl =
  document.getElementById('asp-root') ??
  (() => {
    const div = document.createElement('div');
    div.id = 'asp-root';
    document.body.appendChild(div);
    return div;
  })();

createRoot(rootEl).render(
  <StrictMode>
    <div className="fixed inset-0 bg-slate-950">
      <PreviewPanel schema={schema} embedded />
    </div>
  </StrictMode>
);
