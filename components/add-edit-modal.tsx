"use client";

import { useEffect, useState } from "react";
import { Star, X } from "@phosphor-icons/react/dist/ssr";
import type { VaultItem } from "@/lib/vault/items";
import type { VaultItemType } from "@/lib/supabase/types";
import { addItem, editItem } from "@/lib/vault/item-actions";
import { TYPE_ICON, TYPE_LABEL, TYPE_ORDER } from "@/lib/ui/icons";
import { Modal, PillButton, IconButton } from "./ui-kit";
import { ItemForm, type FormData } from "./item-form";

export function AddEditModal({
  open,
  onClose,
  dek,
  editing,
}: {
  open: boolean;
  onClose: () => void;
  dek: CryptoKey;
  editing: VaultItem | null;
}) {
  const [type, setType] = useState<VaultItemType>("login");
  const [data, setData] = useState<FormData>({ tags: [] });
  const [favorite, setFavorite] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setError(null);
    if (editing) {
      setType(editing.type);
      setData(editing.data);
      setFavorite(editing.favorite);
    } else {
      setType("login");
      setData({ tags: [] });
      setFavorite(false);
    }
  }, [open, editing]);

  async function save() {
    setError(null);
    setSaving(true);
    try {
      if (editing) {
        await editItem(dek, editing.id, type, data, favorite);
      } else {
        await addItem(dek, type, data, favorite);
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose}>
      <div className="flex items-center justify-between border-b border-charcoal p-5">
        <h2 className="text-base font-medium">
          {editing ? "Edit item" : "New item"}
        </h2>
        <IconButton onClick={onClose} aria-label="Close">
          <X size={18} />
        </IconButton>
      </div>

      <div className="p-5">
        {!editing && (
          <div className="mb-5 flex flex-wrap gap-2">
            {TYPE_ORDER.map((t) => {
              const Icon = TYPE_ICON[t];
              const active = type === t;
              return (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition ${
                    active
                      ? "bg-azure text-[#08233f]"
                      : "border border-slate text-silver hover:border-graphite hover:text-snow"
                  }`}
                >
                  <Icon size={15} />
                  {TYPE_LABEL[t]}
                </button>
              );
            })}
          </div>
        )}

        <ItemForm type={type} value={data} onChange={setData} />

        {error && <p className="mt-3 text-sm text-danger">{error}</p>}

        <div className="mt-5 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setFavorite((f) => !f)}
            className={`flex items-center gap-1.5 text-sm transition ${
              favorite ? "text-azure" : "text-smoke hover:text-silver"
            }`}
          >
            <Star size={16} weight={favorite ? "fill" : "regular"} />
            Favorite
          </button>
          <div className="flex gap-2">
            <PillButton variant="ghost" onClick={onClose}>
              Cancel
            </PillButton>
            <PillButton onClick={save} disabled={saving}>
              {saving ? "Saving..." : "Save item"}
            </PillButton>
          </div>
        </div>
      </div>
    </Modal>
  );
}
