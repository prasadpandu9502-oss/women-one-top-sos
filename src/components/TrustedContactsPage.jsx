import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function TrustedContactsPage() {
    const navigate = useNavigate();
    const email = localStorage.getItem("userEmail") || "";

    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showForm, setShowForm] = useState(false);

    // Form fields
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [relation, setRelation] = useState("Family");

    // Fetch contacts
    useEffect(() => {
        if (!email) { setLoading(false); return; }
        fetch(`/api/trusted-contacts?email=${encodeURIComponent(email)}`)
            .then(r => r.json())
            .then(d => setContacts(d.contacts || []))
            .catch(() => { })
            .finally(() => setLoading(false));
    }, [email]);

    const addContact = async () => {
        if (!name.trim() || !phone.trim()) return alert("Name and phone are required");
        setSaving(true);
        try {
            const res = await fetch("/api/trusted-contacts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email,
                    contactName: name.trim(),
                    contactPhone: phone.trim(),
                    contactRelation: relation,
                }),
            });
            const data = await res.json();
            if (data.success) {
                setContacts(prev => [
                    { id: data.id, name: name.trim(), phone: phone.trim(), relation },
                    ...prev,
                ]);
                setName(""); setPhone(""); setRelation("Family"); setShowForm(false);
            } else {
                alert("Error: " + (data.error || "Failed to save"));
            }
        } catch (e) {
            alert("Error: " + e.message);
        } finally {
            setSaving(false);
        }
    };

    const deleteContact = async (contactId) => {
        if (!window.confirm("Remove this contact?")) return;
        try {
            await fetch("/api/trusted-contacts", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, contactId }),
            });
            setContacts(prev => prev.filter(c => c.id !== contactId));
        } catch (e) {
            alert("Error: " + e.message);
        }
    };

    const relationEmojis = {
        Family: "👨‍👩‍👧", Friend: "🤝", Partner: "❤️", Colleague: "💼", Other: "👤",
    };

    return (
        <div style={{
            minHeight: "100vh",
            background: "linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)",
            display: "flex", flexDirection: "column", alignItems: "center",
            padding: "30px 20px", fontFamily: "'Segoe UI', system-ui, sans-serif",
        }}>
            <style>{`
        @keyframes fadeIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
      `}</style>

            {/* Header */}
            <div style={{
                width: "100%", maxWidth: 480, display: "flex", alignItems: "center",
                justifyContent: "space-between", marginBottom: 24,
            }}>
                <button onClick={() => navigate(-1)} style={{
                    background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)",
                    color: "#fff", padding: "8px 16px", borderRadius: 50,
                    cursor: "pointer", fontSize: 13, fontWeight: 600,
                    backdropFilter: "blur(10px)",
                }}>← Back</button>
                <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 36, animation: "float 3s ease-in-out infinite" }}>👥</div>
                    <h2 style={{
                        color: "#fff", fontSize: 20, fontWeight: 700, margin: "6px 0 0",
                        letterSpacing: 0.5,
                    }}>Trusted Contacts</h2>
                </div>
                <div style={{ width: 70 }} />
            </div>

            {/* Add Contact Button */}
            {!showForm && (
                <button onClick={() => setShowForm(true)} style={{
                    width: "100%", maxWidth: 480, padding: "14px",
                    borderRadius: 14, border: "2px dashed rgba(233,69,96,0.5)",
                    background: "rgba(233,69,96,0.08)", color: "#e94560",
                    fontSize: 15, fontWeight: 700, cursor: "pointer",
                    marginBottom: 20, transition: "all 0.3s",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                }}>
                    <span style={{ fontSize: 22 }}>+</span> Add Trusted Contact
                </button>
            )}

            {/* Add Contact Form */}
            {showForm && (
                <div style={{
                    width: "100%", maxWidth: 480, padding: "24px 20px",
                    background: "rgba(255,255,255,0.07)", backdropFilter: "blur(20px)",
                    borderRadius: 18, border: "1px solid rgba(255,255,255,0.1)",
                    boxShadow: "0 8px 32px rgba(0,0,0,0.3)", marginBottom: 20,
                    animation: "fadeIn 0.3s ease",
                }}>
                    <h3 style={{ color: "#fff", fontSize: 16, fontWeight: 700, marginBottom: 16 }}>
                        Add New Contact
                    </h3>

                    <label style={labelStyle}>👤 Full Name</label>
                    <input value={name} onChange={e => setName(e.target.value)}
                        placeholder="Enter contact name" style={inputStyle} />

                    <label style={labelStyle}>📱 Phone Number</label>
                    <input value={phone} onChange={e => setPhone(e.target.value)}
                        placeholder="+91 98765 43210" style={inputStyle} />

                    <label style={labelStyle}>🏷️ Relation</label>
                    <div style={{ display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap" }}>
                        {["Family", "Friend", "Partner", "Colleague", "Other"].map(r => (
                            <button key={r} onClick={() => setRelation(r)} style={{
                                padding: "8px 14px", borderRadius: 12,
                                border: relation === r
                                    ? "2px solid #e94560" : "2px solid rgba(255,255,255,0.1)",
                                background: relation === r
                                    ? "rgba(233,69,96,0.2)" : "rgba(255,255,255,0.04)",
                                color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer",
                                transition: "all 0.2s",
                            }}>
                                {relationEmojis[r]} {r}
                            </button>
                        ))}
                    </div>

                    <div style={{ display: "flex", gap: 10 }}>
                        <button onClick={addContact} disabled={saving} style={{
                            flex: 1, padding: "12px", borderRadius: 12, border: "none",
                            background: saving
                                ? "rgba(233,69,96,0.4)"
                                : "linear-gradient(135deg, #e94560, #c23152)",
                            color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer",
                        }}>
                            {saving ? "Saving..." : "✅ Save Contact"}
                        </button>
                        <button onClick={() => { setShowForm(false); setName(""); setPhone(""); }}
                            style={{
                                padding: "12px 20px", borderRadius: 12,
                                border: "1.5px solid rgba(255,255,255,0.15)",
                                background: "rgba(255,255,255,0.05)", color: "#fff",
                                fontSize: 14, fontWeight: 600, cursor: "pointer",
                            }}>Cancel</button>
                    </div>
                </div>
            )}

            {/* Contacts List */}
            <div style={{ width: "100%", maxWidth: 480 }}>
                {loading ? (
                    <div style={{ textAlign: "center", color: "rgba(255,255,255,0.5)", padding: 30 }}>
                        Loading contacts...
                    </div>
                ) : contacts.length === 0 ? (
                    <div style={{
                        textAlign: "center", padding: "40px 20px",
                        background: "rgba(255,255,255,0.04)", borderRadius: 16,
                    }}>
                        <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
                        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14 }}>
                            No trusted contacts yet. Add someone you trust!
                        </p>
                    </div>
                ) : (
                    contacts.map((c, i) => (
                        <div key={c.id || i} style={{
                            display: "flex", alignItems: "center", gap: 14,
                            padding: "16px 18px", marginBottom: 10,
                            background: "rgba(255,255,255,0.06)", backdropFilter: "blur(10px)",
                            borderRadius: 14, border: "1px solid rgba(255,255,255,0.08)",
                            animation: `fadeIn ${0.2 + i * 0.08}s ease`,
                        }}>
                            <div style={{
                                width: 46, height: 46, borderRadius: "50%",
                                background: "linear-gradient(135deg, #e94560, #c23152)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: 22, flexShrink: 0,
                            }}>
                                {relationEmojis[c.relation] || "👤"}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ color: "#fff", fontSize: 15, fontWeight: 700 }}>{c.name}</div>
                                <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, marginTop: 2 }}>
                                    📱 {c.phone}  ·  {c.relation || "Other"}
                                </div>
                            </div>
                            <button onClick={() => deleteContact(c.id)} style={{
                                width: 34, height: 34, borderRadius: "50%",
                                background: "rgba(239,68,68,0.15)", border: "none",
                                color: "#ef4444", fontSize: 16, cursor: "pointer",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                transition: "all 0.2s",
                            }}
                                title="Remove contact">🗑️</button>
                        </div>
                    ))
                )}
            </div>

            {/* Trust count */}
            {contacts.length > 0 && (
                <div style={{
                    marginTop: 16, color: "rgba(255,255,255,0.3)",
                    fontSize: 12, textAlign: "center",
                }}>
                    {contacts.length} trusted contact{contacts.length > 1 ? "s" : ""} saved
                </div>
            )}
        </div>
    );
}

const labelStyle = {
    display: "block", fontSize: 11, fontWeight: 700,
    color: "rgba(255,255,255,0.6)", marginBottom: 6,
    letterSpacing: 0.5, textTransform: "uppercase",
};

const inputStyle = {
    width: "100%", padding: "12px 14px", marginBottom: 16,
    borderRadius: 12, border: "1.5px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.06)", color: "#fff",
    fontSize: 14, fontWeight: 500, outline: "none",
};
