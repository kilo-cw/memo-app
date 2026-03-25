import { useState, useEffect, useRef } from "react";

const STORAGE_KEY = "simple-memo-app-notes";
const TRASH_KEY = "simple-memo-app-trash";

// URLとメールアドレスを自動リンク化
function renderWithLinks(text) {
  const pattern = /(https?:\/\/[^\s]+|[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})/g;
  const parts = text.split(pattern);
  return parts.map((part, i) => {
    if (/^https?:\/\//.test(part)) {
      return <a key={i} href={part} target="_blank" rel="noopener noreferrer" style={{ color: "#C8A96E", textDecoration: "underline", wordBreak: "break-all" }}>{part}</a>;
    }
    if (/@/.test(part)) {
      return <a key={i} href={`mailto:${part}`} style={{ color: "#90A8C8", textDecoration: "underline", wordBreak: "break-all" }}>{part}</a>;
    }
    return part;
  });
}

export default function MemoApp() {
  const [notes, setNotes] = useState([]);
  const [trash, setTrash] = useState([]);
  const [input, setInput] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const [view, setView] = useState("notes");
  const textareaRef = useRef(null);

  useEffect(() => {
    try { setNotes(JSON.parse(localStorage.getItem(STORAGE_KEY)) || []); } catch {}
    try { setTrash(JSON.parse(localStorage.getItem(TRASH_KEY)) || []); } catch {}
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    localStorage.setItem(TRASH_KEY, JSON.stringify(trash));
  }, [notes, trash, loaded]);

  const addNote = () => {
    const text = input.trim();
    if (!text) return;
    setNotes([{ id: Date.now(), text, date: new Date().toLocaleDateString("ja-JP") }, ...notes]);
    setInput("");
    textareaRef.current?.focus();
  };

  const moveToTrash = (id) => {
    const note = notes.find(n => n.id === id);
    setNotes(notes.filter(n => n.id !== id));
    setTrash([{ ...note, deletedDate: new Date().toLocaleDateString("ja-JP") }, ...trash]);
  };

  const restoreNote = (id) => {
    const note = trash.find(n => n.id === id);
    const { deletedDate, ...restored } = note;
    setTrash(trash.filter(n => n.id !== id));
    setNotes([restored, ...notes]);
  };

  const deletePermanently = (id) => setTrash(trash.filter(n => n.id !== id));
  const emptyTrash = () => setTrash([]);

  const startEdit = (note) => { setEditingId(note.id); setEditText(note.text); };
  const saveEdit = (id) => {
    const text = editText.trim();
    if (!text) return;
    setNotes(notes.map(n => n.id === id ? { ...n, text, date: new Date().toLocaleDateString("ja-JP") } : n));
    setEditingId(null); setEditText("");
  };
  const cancelEdit = () => { setEditingId(null); setEditText(""); };
  const handleKey = (e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) addNote(); };

  const isTrash = view === "trash";
  const list = isTrash ? trash : notes;

  return (
    <div style={{ minHeight: "100vh", background: "#F5F0E8", fontFamily: "'Georgia', serif" }}>

      {/* Header */}
      <div style={{ background: "#1C1C1C", padding: "28px 32px 0", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 18 }}>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 400, color: "#F5F0E8", letterSpacing: "0.04em" }}>
              {isTrash ? "ゴミ箱" : "メモ帳"}
            </h1>
            <span style={{ fontSize: 13, color: "#888" }}>{list.length} 件</span>
          </div>

          {!isTrash && (
            <div style={{ position: "relative" }}>
              <textarea
                ref={textareaRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="メモを入力… (Ctrl+Enter で保存)"
                rows={3}
                style={{
                  width: "100%", boxSizing: "border-box", background: "#2A2A2A",
                  border: "1px solid #3A3A3A", borderRadius: 8, color: "#F5F0E8",
                  fontSize: 15, fontFamily: "'Georgia', serif", padding: "14px 16px",
                  resize: "none", outline: "none", lineHeight: 1.6, transition: "border-color 0.2s",
                }}
                onFocus={e => e.target.style.borderColor = "#C8A96E"}
                onBlur={e => e.target.style.borderColor = "#3A3A3A"}
              />
              <button onClick={addNote} disabled={!input.trim()} style={{
                position: "absolute", bottom: 10, right: 10,
                background: input.trim() ? "#C8A96E" : "#3A3A3A",
                color: input.trim() ? "#1C1C1C" : "#666",
                border: "none", borderRadius: 6, padding: "7px 18px",
                fontSize: 13, fontFamily: "'Georgia', serif",
                cursor: input.trim() ? "pointer" : "default",
                transition: "all 0.2s", letterSpacing: "0.04em",
              }}>保存</button>
            </div>
          )}

          {/* Tabs */}
          <div style={{ display: "flex", marginTop: 16 }}>
            {[["notes", "メモ一覧"], ["trash", `ゴミ箱${trash.length > 0 ? ` (${trash.length})` : ""}`]].map(([tab, label]) => (
              <button key={tab} onClick={() => setView(tab)} style={{
                background: "none", border: "none", cursor: "pointer",
                padding: "8px 18px 10px", fontSize: 13, fontFamily: "'Georgia', serif",
                color: view === tab ? "#C8A96E" : "#666",
                borderBottom: view === tab ? "2px solid #C8A96E" : "2px solid transparent",
                transition: "all 0.2s", letterSpacing: "0.04em",
              }}>{label}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 600, margin: "0 auto", padding: "24px 32px 40px" }}>
        {isTrash && trash.length > 0 && (
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
            <button onClick={emptyTrash} style={{
              background: "none", border: "1px solid #D0A0A0", borderRadius: 6,
              color: "#C07070", fontSize: 12, fontFamily: "'Georgia', serif",
              padding: "6px 14px", cursor: "pointer", letterSpacing: "0.04em",
            }}>ゴミ箱を空にする</button>
          </div>
        )}

        {list.length === 0 ? (
          <div style={{ textAlign: "center", color: "#A89A80", padding: "60px 0", fontSize: 15, letterSpacing: "0.04em" }}>
            {isTrash ? "ゴミ箱は空です" : "メモがまだありません"}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {list.map((note, i) => (
              <div key={note.id} style={{
                background: isTrash ? "#F8F4EE" : editingId === note.id ? "#FFFEF5" : "#FFFDF7",
                border: editingId === note.id ? "1px solid #C8A96E" : isTrash ? "1px solid #DDD5C5" : "1px solid #E8E0D0",
                borderRadius: 8, padding: "16px 18px",
                animation: i === 0 ? "fadeIn 0.3s ease" : "none",
                boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                opacity: isTrash ? 0.8 : 1,
                transition: "border-color 0.2s",
              }}>
                {!isTrash && editingId === note.id ? (
                  <>
                    <textarea value={editText} onChange={e => setEditText(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) saveEdit(note.id); if (e.key === "Escape") cancelEdit(); }}
                      autoFocus rows={4}
                      style={{ width: "100%", boxSizing: "border-box", background: "transparent", border: "none", outline: "none", fontSize: 15, fontFamily: "'Georgia', serif", color: "#2A2A2A", lineHeight: 1.7, resize: "none", marginBottom: 10 }}
                    />
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                      <button onClick={cancelEdit} style={{ background: "none", border: "1px solid #D0C0A0", borderRadius: 5, padding: "5px 14px", fontSize: 12, fontFamily: "'Georgia', serif", color: "#A89A80", cursor: "pointer" }}>キャンセル</button>
                      <button onClick={() => saveEdit(note.id)} style={{ background: "#C8A96E", border: "none", borderRadius: 5, padding: "5px 14px", fontSize: 12, fontFamily: "'Georgia', serif", color: "#1C1C1C", cursor: "pointer" }}>保存</button>
                    </div>
                  </>
                ) : (
                  <>
                    <p onClick={() => !isTrash && startEdit(note)} style={{
                      margin: "0 0 10px", fontSize: 15, color: "#2A2A2A",
                      lineHeight: 1.7, whiteSpace: "pre-wrap", wordBreak: "break-word",
                      cursor: isTrash ? "default" : "text",
                    }}>{renderWithLinks(note.text)}</p>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 12, color: "#B0A090", letterSpacing: "0.04em" }}>
                        {isTrash ? `削除日: ${note.deletedDate}` : note.date}
                      </span>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        {isTrash ? (
                          <>
                            <button onClick={() => restoreNote(note.id)} style={{ background: "none", border: "none", color: "#90A890", cursor: "pointer", fontSize: 12, fontFamily: "'Georgia', serif", padding: "0 4px" }}>元に戻す</button>
                            <button onClick={() => deletePermanently(note.id)} style={{ background: "none", border: "none", color: "#C07070", cursor: "pointer", fontSize: 12, fontFamily: "'Georgia', serif", padding: "0 4px" }}>完全削除</button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => startEdit(note)} style={{ background: "none", border: "none", color: "#B0A090", cursor: "pointer", fontSize: 12, fontFamily: "'Georgia', serif", padding: "0 4px", opacity: 0.7, transition: "opacity 0.2s" }} onMouseEnter={e => e.target.style.opacity = 1} onMouseLeave={e => e.target.style.opacity = 0.7}>編集</button>
                            <button onClick={() => moveToTrash(note.id)} style={{ background: "none", border: "none", color: "#C0A890", cursor: "pointer", fontSize: 18, padding: "0 2px", lineHeight: 1, opacity: 0.6, transition: "opacity 0.2s" }} onMouseEnter={e => e.target.style.opacity = 1} onMouseLeave={e => e.target.style.opacity = 0.6} title="ゴミ箱へ">×</button>
                          </>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
        textarea::placeholder { color: #555; }
        * { -webkit-font-smoothing: antialiased; }
      `}</style>
    </div>
  );
}
