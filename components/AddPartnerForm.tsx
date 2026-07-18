"use client";

import { useActionState } from "react";
import { createAffiliateAction, type CreatePartnerState } from "@/app/admin/actions";

const initial: CreatePartnerState = {};

// Collapsible "add a partner" form. Uses useActionState so validation and
// duplicate-code/email errors show inline without leaving the page.
export function AddPartnerForm() {
  const [state, action, pending] = useActionState(createAffiliateAction, initial);

  return (
    <details className="portal-card portal-add">
      <summary>+ Add a partner</summary>
      <form action={action} className="portal-add-form">
        <div className="portal-field-grid">
          <label className="portal-label">
            Name
            <input className="portal-input" name="name" required maxLength={120} placeholder="Sarah Jones" autoComplete="off" />
          </label>
          <label className="portal-label">
            Email
            <input className="portal-input" type="email" name="email" required placeholder="sarah@example.com" autoComplete="off" />
          </label>
          <label className="portal-label">
            Referral code
            <input className="portal-input" name="code" required pattern="[A-Za-z0-9_\-]{1,64}" placeholder="sarah" autoComplete="off" />
          </label>
          <label className="portal-label">
            Commission %
            <input className="portal-input" type="number" name="rate" required min={0} max={100} step={0.1} defaultValue={20} />
          </label>
          <label className="portal-label">
            Status
            <select className="portal-select" name="status" defaultValue="active">
              <option value="active">Active</option>
              <option value="paused">Paused</option>
            </select>
          </label>
        </div>
        <p className="portal-hint">Their referral link will be birthdayherobook.com/r/&lt;code&gt;. Use the same email they’ll sign in with.</p>
        <label className="portal-check">
          <input type="checkbox" name="welcome" defaultChecked />
          Email the partner a welcome with their referral link
        </label>
        {state.error && <p className="portal-error" role="alert">{state.error}</p>}
        {state.ok && <p className="portal-success-inline" role="status">{state.message}</p>}
        <button className="portal-btn portal-btn--primary" type="submit" disabled={pending}>
          {pending ? "Adding…" : "Add partner"}
        </button>
      </form>
    </details>
  );
}
