import { useState, useEffect, useCallback } from "react";
import type { CatalogStyle } from "@/types/style";
import {
  addStyleOptionRequest,
  createStyleRequest,
  deleteStyleRequest,
  fetchStylesCatalog,
  removeStyleOptionRequest,
  toggleStyleRequest,
  updateStyleRequest,
} from "@/lib/api";
import { formatStyleDuration, stylePrimaryImageUrl } from "@/lib/styleDisplay";
import { Plus, Edit2, Trash2, X } from "lucide-react";

export default function AdminServices() {
  const [styles, setStyles] = useState<CatalogStyle[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    basePrice: "",
    durationMin: "",
    durationMax: "",
  });

  const [optionFormByStyle, setOptionFormByStyle] = useState<
    Record<string, { optionType: string; name: string; priceModifier: string }>
  >({});

  const loadStyles = useCallback(async () => {
    try {
      setListError(null);
      setLoading(true);
      const rows = await fetchStylesCatalog({ auth: true });
      setStyles(rows);
    } catch (e) {
      setListError(e instanceof Error ? e.message : "Failed to load styles");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStyles();
  }, [loadStyles]);

  const getOptionForm = (styleId: string) =>
    optionFormByStyle[styleId] ?? { optionType: "size", name: "", priceModifier: "0" };

  const setOptionForm = (
    styleId: string,
    patch: Partial<{ optionType: string; name: string; priceModifier: string }>
  ) => {
    setOptionFormByStyle((prev) => ({
      ...prev,
      [styleId]: { ...getOptionForm(styleId), ...patch },
    }));
  };

  const toggleAvail = async (id: string) => {
    setActionError(null);
    try {
      const updated = await toggleStyleRequest(id);
      setStyles((prev) => prev.map((s) => (s.id === id ? updated : s)));
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Toggle failed");
    }
  };

  const openAdd = () => {
    setEditId(null);
    setForm({
      name: "",
      description: "",
      basePrice: "",
      durationMin: "",
      durationMax: "",
    });
    setShowModal(true);
  };

  const openEdit = (s: CatalogStyle) => {
    setEditId(s.id);
    setForm({
      name: s.name,
      description: s.description ?? "",
      basePrice: String(s.basePrice),
      durationMin: String(s.durationMin),
      durationMax: String(s.durationMax),
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    setActionError(null);
    const basePrice = Number(form.basePrice);
    const durationMin = parseInt(form.durationMin, 10);
    const durationMax = parseInt(form.durationMax, 10);
    if (!form.name.trim() || Number.isNaN(basePrice) || Number.isNaN(durationMin) || Number.isNaN(durationMax)) {
      setActionError("Please fill all required fields with valid numbers.");
      return;
    }
    try {
      if (editId) {
        const updated = await updateStyleRequest(editId, {
          name: form.name.trim(),
          description: form.description.trim() || null,
          basePrice,
          durationMin,
          durationMax,
        });
        setStyles((prev) => prev.map((s) => (s.id === editId ? updated : s)));
      } else {
        const created = await createStyleRequest({
          name: form.name.trim(),
          description: form.description.trim() || null,
          basePrice,
          durationMin,
          durationMax,
        });
        setStyles((prev) => [...prev, created]);
      }
      setShowModal(false);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Save failed");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this style? It will disappear from the customer catalog.")) return;
    setActionError(null);
    try {
      await deleteStyleRequest(id);
      setStyles((prev) => prev.filter((s) => s.id !== id));
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Delete failed");
    }
  };

  const handleAddOption = async (styleId: string) => {
    const f = getOptionForm(styleId);
    if (!f.name.trim()) {
      setActionError("Option name is required.");
      return;
    }
    const priceModifier = Number(f.priceModifier);
    if (Number.isNaN(priceModifier)) {
      setActionError("Invalid price modifier.");
      return;
    }
    setActionError(null);
    try {
      const { style } = await addStyleOptionRequest(styleId, {
        optionType: f.optionType.trim(),
        name: f.name.trim(),
        priceModifier,
      });
      setStyles((prev) => prev.map((s) => (s.id === styleId ? style : s)));
      setOptionForm(styleId, { name: "", priceModifier: "0" });
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Failed to add option");
    }
  };

  const handleRemoveOption = async (styleId: string, optionId: string) => {
    setActionError(null);
    try {
      const style = await removeStyleOptionRequest(styleId, optionId);
      setStyles((prev) => prev.map((s) => (s.id === styleId ? style : s)));
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Failed to remove option");
    }
  };

  if (loading) {
    return (
      <div>
        <h1 className="heading-display text-3xl font-bold mb-6">Services</h1>
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="heading-display text-3xl font-bold">Services</h1>
        <button type="button" onClick={openAdd} className="btn-gold text-sm !py-2 flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add New Style
        </button>
      </div>

      {listError && (
        <p className="text-destructive text-sm mb-4">{listError}</p>
      )}
      {actionError && (
        <p className="text-destructive text-sm mb-4">{actionError}</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {styles.map((style) => (
          <div
            key={style.id}
            className={`bg-card border border-border rounded-xl overflow-hidden transition-opacity ${
              !style.isAvailable ? "opacity-50" : ""
            }`}
          >
            <div className="aspect-video overflow-hidden">
              <img
                src={stylePrimaryImageUrl(style)}
                alt={style.name}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-display text-lg font-semibold">{style.name}</h3>
                <span className="text-accent font-bold">${style.basePrice}</span>
              </div>
              <p className="text-xs text-muted-foreground mb-3">{formatStyleDuration(style)}</p>

              <div className="border-t border-border pt-3 mt-2 space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Customization options
                </p>
                <ul className="text-xs space-y-1 max-h-28 overflow-y-auto">
                  {style.customizationOptions.map((o) => (
                    <li key={o.id} className="flex justify-between gap-2 items-center">
                      <span className="truncate">
                        <span className="text-muted-foreground">[{o.optionType}]</span> {o.name}{" "}
                        {o.priceModifier !== 0 && (
                          <span className="text-accent">(+${o.priceModifier})</span>
                        )}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveOption(style.id, o.id)}
                        className="shrink-0 text-destructive hover:underline"
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
                <div className="grid grid-cols-1 gap-2 pt-1">
                  <select
                    value={getOptionForm(style.id).optionType}
                    onChange={(e) => setOptionForm(style.id, { optionType: e.target.value })}
                    className="w-full bg-background border border-input rounded-lg px-2 py-1.5 text-xs"
                  >
                    <option value="size">size</option>
                    <option value="length">length</option>
                    <option value="color">color</option>
                  </select>
                  <input
                    placeholder="Option name"
                    value={getOptionForm(style.id).name}
                    onChange={(e) => setOptionForm(style.id, { name: e.target.value })}
                    className="w-full bg-background border border-input rounded-lg px-2 py-1.5 text-xs"
                  />
                  <input
                    type="number"
                    placeholder="Price modifier"
                    value={getOptionForm(style.id).priceModifier}
                    onChange={(e) => setOptionForm(style.id, { priceModifier: e.target.value })}
                    className="w-full bg-background border border-input rounded-lg px-2 py-1.5 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddOption(style.id)}
                    className="text-xs py-1.5 rounded-lg border border-border hover:bg-muted"
                  >
                    Add option
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                <label className="flex items-center gap-2 cursor-pointer">
                  <button
                    type="button"
                    onClick={() => toggleAvail(style.id)}
                    className={`w-10 h-6 rounded-full relative transition-colors ${
                      style.isAvailable ? "bg-accent" : "bg-input"
                    }`}
                  >
                    <span
                      className={`absolute top-1 w-4 h-4 rounded-full bg-card shadow transition-transform ${
                        style.isAvailable ? "left-5" : "left-1"
                      }`}
                    />
                  </button>
                  <span className="text-xs text-muted-foreground">
                    {style.isAvailable ? "Active" : "Hidden"}
                  </span>
                </label>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => openEdit(style)}
                    className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                  >
                    <Edit2 className="w-4 h-4 text-muted-foreground" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(style.id)}
                    className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-foreground/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background border border-border rounded-xl p-6 w-full max-w-md animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl font-semibold">
                {editId ? "Edit Style" : "Add New Style"}
              </h2>
              <button type="button" onClick={() => setShowModal(false)}>
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Name</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full bg-background border border-input rounded-lg px-3 py-2.5 text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={3}
                  className="w-full bg-background border border-input rounded-lg px-3 py-2.5 text-sm resize-none"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Base Price ($)</label>
                <input
                  type="number"
                  value={form.basePrice}
                  onChange={(e) => setForm((f) => ({ ...f, basePrice: e.target.value }))}
                  className="w-full bg-background border border-input rounded-lg px-3 py-2.5 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Duration min (hrs)</label>
                  <input
                    type="number"
                    value={form.durationMin}
                    onChange={(e) => setForm((f) => ({ ...f, durationMin: e.target.value }))}
                    className="w-full bg-background border border-input rounded-lg px-3 py-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Duration max (hrs)</label>
                  <input
                    type="number"
                    value={form.durationMax}
                    onChange={(e) => setForm((f) => ({ ...f, durationMax: e.target.value }))}
                    className="w-full bg-background border border-input rounded-lg px-3 py-2.5 text-sm"
                  />
                </div>
              </div>
              <button type="button" onClick={handleSave} className="btn-gold w-full text-center">
                {editId ? "Save Changes" : "Add Style"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
