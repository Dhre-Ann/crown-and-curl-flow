import { useState } from "react";
import { mockStyles, HairStyle } from "@/data/mockStyles";
import { Plus, Edit2, Trash2, X } from "lucide-react";

export default function AdminServices() {
  const [styles, setStyles] = useState<(HairStyle & { available: boolean })[]>(
    mockStyles.map(s => ({ ...s, available: true }))
  );
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", description: "", basePrice: "", duration: "" });

  const toggleAvail = (id: string) => {
    setStyles(prev => prev.map(s => s.id === id ? { ...s, available: !s.available } : s));
  };

  const openAdd = () => {
    setEditId(null);
    setForm({ name: "", description: "", basePrice: "", duration: "" });
    setShowModal(true);
  };

  const openEdit = (s: HairStyle) => {
    setEditId(s.id);
    setForm({ name: s.name, description: s.description, basePrice: s.basePrice.toString(), duration: s.duration });
    setShowModal(true);
  };

  const handleSave = () => {
    if (editId) {
      setStyles(prev => prev.map(s => s.id === editId ? { ...s, name: form.name, description: form.description, basePrice: parseInt(form.basePrice), duration: form.duration } : s));
    }
    setShowModal(false);
  };

  const handleDelete = (id: string) => {
    setStyles(prev => prev.filter(s => s.id !== id));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="heading-display text-3xl font-bold">Services</h1>
        <button onClick={openAdd} className="btn-gold text-sm !py-2 flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add New Style
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {styles.map(style => (
          <div key={style.id} className={`bg-card border border-border rounded-xl overflow-hidden transition-opacity ${!style.available ? "opacity-50" : ""}`}>
            <div className="aspect-video overflow-hidden">
              <img src={style.image} alt={style.name} className="w-full h-full object-cover" loading="lazy" />
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-display text-lg font-semibold">{style.name}</h3>
                <span className="text-accent font-bold">${style.basePrice}</span>
              </div>
              <p className="text-xs text-muted-foreground mb-3">{style.duration}</p>
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <div
                    onClick={() => toggleAvail(style.id)}
                    className={`w-10 h-6 rounded-full relative transition-colors ${style.available ? "bg-accent" : "bg-input"}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-card shadow transition-transform ${style.available ? "left-5" : "left-1"}`} />
                  </div>
                  <span className="text-xs text-muted-foreground">{style.available ? "Active" : "Hidden"}</span>
                </label>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(style)} className="p-1.5 rounded-lg hover:bg-muted transition-colors"><Edit2 className="w-4 h-4 text-muted-foreground" /></button>
                  <button onClick={() => handleDelete(style.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors"><Trash2 className="w-4 h-4 text-destructive" /></button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-foreground/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background border border-border rounded-xl p-6 w-full max-w-md animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl font-semibold">{editId ? "Edit Style" : "Add New Style"}</h2>
              <button onClick={() => setShowModal(false)}><X className="w-5 h-5 text-muted-foreground" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Name</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full bg-background border border-input rounded-lg px-3 py-2.5 text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} className="w-full bg-background border border-input rounded-lg px-3 py-2.5 text-sm resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Base Price ($)</label>
                  <input type="number" value={form.basePrice} onChange={e => setForm(f => ({ ...f, basePrice: e.target.value }))} className="w-full bg-background border border-input rounded-lg px-3 py-2.5 text-sm" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Duration</label>
                  <input value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))} className="w-full bg-background border border-input rounded-lg px-3 py-2.5 text-sm" placeholder="4–6 hrs" />
                </div>
              </div>
              <button onClick={handleSave} className="btn-gold w-full text-center">
                {editId ? "Save Changes" : "Add Style"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
