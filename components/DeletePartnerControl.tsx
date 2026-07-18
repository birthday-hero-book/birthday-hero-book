"use client";

import { useState } from "react";
import { deleteAffiliateAction } from "@/app/admin/actions";

// Two-step delete: click Remove to reveal the warning, tick the confirm box,
// then Delete permanently. Two deliberate actions guard an irreversible change.
export function DeletePartnerControl({ affiliateId, name }: { affiliateId: string; name: string }) {
  const [confirming, setConfirming] = useState(false);
  const [understood, setUnderstood] = useState(false);

  function cancel() {
    setConfirming(false);
    setUnderstood(false);
  }

  if (!confirming) {
    return (
      <button type="button" className="portal-btn portal-btn--danger" onClick={() => setConfirming(true)}>
        Remove partner
      </button>
    );
  }

  return (
    <div className="portal-danger-zone">
      <p className="portal-danger-note">
        This permanently deletes <b>{name}</b> and their click history. Any orders they referred stay recorded
        but are no longer linked to them. This can’t be undone.
      </p>
      <label className="portal-check">
        <input type="checkbox" checked={understood} onChange={(event) => setUnderstood(event.target.checked)} />
        Yes, permanently delete {name}
      </label>
      <div className="portal-actions">
        <button type="button" className="portal-btn portal-btn--ghost" onClick={cancel}>Cancel</button>
        <form action={deleteAffiliateAction}>
          <input type="hidden" name="affiliateId" value={affiliateId} />
          <button type="submit" className="portal-btn portal-btn--danger" disabled={!understood}>
            Delete permanently
          </button>
        </form>
      </div>
    </div>
  );
}
