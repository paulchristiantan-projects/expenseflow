import { useState, useMemo } from "react";
import { IconTrash, IconPlus } from "./Icons";
import HouseDashboard from "./HouseDashboard";
import { HouseBulkImport, HouseMonthlySummary } from "./HouseExpenses";
import { monthLabel } from "../helpers";
import { IconYear, IconImport, IconHome } from "./Icons";
import ConfirmDialog from "./ConfirmDialog";
import { useToast } from "./Toast";
import MonthPicker from "./MonthPicker";

// ── Member chip ───────────────────────────────────────────────────────────────
function MemberChip({ email, isOwner, isPending, canRemove, onRemove }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 8,
      padding: "7px 12px", borderRadius: 20,
      background: isPending ? "var(--bg)" : "var(--accent-bg)",
      border: `1px solid ${isPending ? "var(--line)" : "var(--accent-soft)"}`,
      fontSize: 13,
    }}>
      <span style={{
        width: 24, height: 24, borderRadius: "50%",
        background: isOwner ? "var(--accent)" : isPending ? "var(--line)" : "var(--accent-soft)",
        color: isOwner ? "#fff" : "var(--accent)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 10, fontWeight: 800, flexShrink: 0,
      }}>
        {email[0].toUpperCase()}
      </span>
      <span style={{ color: "var(--text)" }}>{email}</span>
      {isOwner  && <span style={{ fontSize: 11, color: "var(--accent)", fontWeight: 700, marginLeft: 2 }}>owner</span>}
      {isPending && <span style={{ fontSize: 11, color: "var(--muted)", fontWeight: 600, marginLeft: 2 }}>pending</span>}
      {canRemove && (
        <button
          onClick={() => onRemove(email)}
          style={{
            background: "none", border: "1px solid var(--line)", borderRadius: 6,
            cursor: "pointer", color: "var(--danger)", padding: "2px 7px",
            fontSize: 11, fontWeight: 600, marginLeft: 4, lineHeight: 1.4,
          }}
          title={`Remove ${email}`}
        >
          Remove
        </button>
      )}
    </div>
  );
}

// ── House selector / create panel ─────────────────────────────────────────────
function HouseSelector({ sharedHouses, selectedHouseId, onSelect, onCreate, userEmail }) {
  const [creating, setCreating] = useState(false);
  const [newName,  setNewName]  = useState("");
  const [busy,     setBusy]     = useState(false);

  async function handleCreate(e) {
    e.preventDefault();
    if (!newName.trim()) return;
    setBusy(true);
    try { await onCreate(newName.trim()); setNewName(""); setCreating(false); }
    catch (err) { alert("Failed: " + err.message); }
    finally { setBusy(false); }
  }

  return (
    <div style={{ maxWidth: 560 }}>
      <h2 style={{ margin: "0 0 6px", fontSize: 20, fontWeight: 800 }}>Shared House</h2>
      <p style={{ margin: "0 0 20px", color: "var(--muted)", fontSize: 14 }}>
        Share house expenses with household members. They get read-only access; only the owner can add or edit entries.
      </p>

      {sharedHouses.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
          {sharedHouses.map((h) => (
            <button
              key={h.id}
              className={`card ${selectedHouseId === h.id ? "kpi-accent" : ""}`}
              style={{
                textAlign: "left", cursor: "pointer", display: "flex",
                alignItems: "center", justifyContent: "space-between",
                padding: "14px 16px", border: `2px solid ${selectedHouseId === h.id ? "var(--accent)" : "var(--line)"}`,
                background: selectedHouseId === h.id ? "var(--accent-bg)" : "var(--card)",
                borderRadius: 12, gap: 12,
              }}
              onClick={() => onSelect(h.id)}
            >
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text)" }}>{h.name}</div>
                <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
                  {h.ownerEmail === userEmail ? "You own this" : `Shared by ${h.ownerEmail}`}
                  {" · "}
                  {(h.memberEmails?.length || 0) + (h.pendingEmails?.length || 0)} member{((h.memberEmails?.length || 0) + (h.pendingEmails?.length || 0)) !== 1 ? "s" : ""}
                </div>
              </div>
              <span style={{ color: "var(--accent)", fontSize: 13, fontWeight: 600 }}>
                {selectedHouseId === h.id ? "Viewing ↓" : "Open →"}
              </span>
            </button>
          ))}
        </div>
      )}

      {!creating ? (
        <button className="btn primary" onClick={() => setCreating(true)}>
          <IconPlus size={14} /> New shared house
        </button>
      ) : (
        <form onSubmit={handleCreate} className="card" style={{ display: "flex", flexDirection: "column", gap: 12, padding: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 13 }}>New shared house</div>
          <input
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="e.g. Home, Family House…"
            style={{ width: "100%" }}
          />
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn primary" type="submit" disabled={busy || !newName.trim()}>
              {busy ? "Creating…" : "Create"}
            </button>
            <button className="btn secondary" type="button" onClick={() => setCreating(false)}>Cancel</button>
          </div>
        </form>
      )}
    </div>
  );
}

// ── Member management panel ────────────────────────────────────────────────────
function MembersPanel({ house, isOwner, userEmail, onInvite, onRemove, onRename, onDelete, onMigrate, onClear, personalHouseCount, personalGroceryCount }) {
  const [email,      setEmail]      = useState("");
  const [busy,       setBusy]       = useState(false);
  const [migrating,  setMigrating]  = useState(false);
  const [clearing,   setClearing]   = useState(false);
  const [msg,         setMsg]         = useState(null);
  const [confirmDel,  setConfirmDel]  = useState(false);
  const [deleting,    setDeleting]    = useState(false);
  const [confirmClear,setConfirmClear]= useState(false);
  const [renaming,    setRenaming]    = useState(false);
  const [newName,     setNewName]     = useState(house.name);
  const [savingName,  setSavingName]  = useState(false);
  const toast = useToast();

  async function handleInvite(e) {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) return;
    setBusy(true); setMsg(null);
    try {
      await onInvite(house.id, trimmed);
      setMsg({ type: "ok", text: `Invite sent to ${trimmed}.` });
      setEmail("");
    } catch (err) {
      setMsg({ type: "error", text: err.message });
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove(memberEmail) {
    if (!window.confirm(`Remove ${memberEmail} from this house?`)) return;
    try { await onRemove(house.id, memberEmail); }
    catch (err) { alert("Failed: " + err.message); }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await onDelete(house.id);
      toast.success(`"${house.name}" deleted.`);
      // Parent unmounts this panel and returns to the house list after onDelete
    } catch (err) {
      toast.error("Delete failed: " + err.message);
      setDeleting(false);
      setConfirmDel(false);
    }
  }

  async function handleRename(e) {
    e.preventDefault();
    if (!newName.trim() || newName.trim() === house.name) { setRenaming(false); return; }
    setSavingName(true);
    try { await onRename(house.id, newName.trim()); setRenaming(false); setMsg({ type: "ok", text: "House renamed." }); }
    catch (err) { setMsg({ type: "error", text: err.message }); }
    finally { setSavingName(false); }
  }

  async function handleMigrate() {
    if (!window.confirm(
      `Copy all your personal house data (${personalHouseCount} bills, ${personalGroceryCount} grocery items) into "${house.name}"?\n\nYour personal data will NOT be deleted — this only copies it.`
    )) return;
    setMigrating(true); setMsg(null);
    try {
      const result = await onMigrate();
      setMsg({ type: "ok", text: `Migrated ${result.bills} bills and ${result.grocery} grocery items.` });
    } catch (err) {
      setMsg({ type: "error", text: "Migration failed: " + err.message });
    } finally {
      setMigrating(false);
    }
  }

  async function handleClear() {
    setConfirmClear(false);
    setClearing(true); setMsg(null);
    try {
      const count = await onClear();
      setMsg({ type: "ok", text: `Cleared ${count} entries. You can now re-migrate cleanly.` });
      toast.success(`Cleared ${count} entries.`);
    } catch (err) {
      setMsg({ type: "error", text: "Clear failed: " + err.message });
      toast.error("Clear failed: " + err.message);
    } finally {
      setClearing(false);
    }
  }

  const allMembers = [
    { email: house.ownerEmail, isOwner: true, isPending: false },
    ...(house.memberEmails  || []).map((e) => ({ email: e, isOwner: false, isPending: false })),
    ...(house.pendingEmails || []).map((e) => ({ email: e, isOwner: false, isPending: true  })),
  ];

  return (
    <div className="card" style={{ marginTop: 0 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        {renaming && isOwner ? (
          <form onSubmit={handleRename} style={{ display: "flex", gap: 8, flex: 1, marginRight: 8 }}>
            <input autoFocus value={newName} onChange={(e) => setNewName(e.target.value)} style={{ flex: 1 }} />
            <button className="btn primary" type="submit" disabled={savingName || !newName.trim()}>
              {savingName ? "Saving…" : "Save"}
            </button>
            <button className="btn secondary" type="button" onClick={() => { setRenaming(false); setNewName(house.name); }}>Cancel</button>
          </form>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontWeight: 700, fontSize: 15 }}>{house.name}</span>
            {isOwner && (
              <button
                onClick={() => { setRenaming(true); setNewName(house.name); }}
                style={{ background: "none", border: "1px solid var(--line)", borderRadius: 6, cursor: "pointer", color: "var(--muted)", fontSize: 12, padding: "3px 8px" }}
              >
                Rename
              </button>
            )}
          </div>
        )}
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
        {allMembers.map((m) => (
          <MemberChip
            key={m.email}
            email={m.email}
            isOwner={m.isOwner}
            isPending={m.isPending}
            canRemove={isOwner && !m.isOwner}
            onRemove={handleRemove}
          />
        ))}
      </div>

      {isOwner && (
        <>
          {msg && (
            <div className={msg.type === "ok" ? "notice" : "banner"} style={{ marginBottom: 10, marginTop: 0 }}>
              {msg.text}
            </div>
          )}
          <form onSubmit={handleInvite} style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email to invite…"
              style={{ flex: 1 }}
            />
            <button className="btn primary" type="submit" disabled={busy || !email.trim()}>
              {busy ? "Inviting…" : "Invite"}
            </button>
          </form>

          {/* Migrate personal data */}
          {(personalHouseCount > 0 || personalGroceryCount > 0) && (
            <div style={{ borderTop: "1px solid var(--line)", paddingTop: 14, marginBottom: 14 }}>
              <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 8 }}>
                You have <strong>{personalHouseCount}</strong> personal bills and <strong>{personalGroceryCount}</strong> grocery items.
                Copy them into this shared house so members can see them.
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn secondary" onClick={handleMigrate} disabled={migrating}>
                  {migrating ? "Copying…" : "Copy personal data here"}
                </button>
                <button
                  className="btn secondary"
                  style={{ color: "var(--danger)", borderColor: "var(--danger)" }}
                  onClick={() => setConfirmClear(true)}
                  disabled={clearing}
                  title="Wipe all shared house data (use before re-migrating)"
                >
                  {clearing ? "Clearing…" : "Clear shared data"}
                </button>
              </div>
            </div>
          )}

          <div style={{ borderTop: "1px solid var(--line)", paddingTop: 14, marginTop: 4 }}>
            <button
              className="btn secondary"
              style={{ color: "var(--danger)", borderColor: "var(--danger)" }}
              onClick={() => setConfirmDel(true)}
              disabled={deleting}
            >
              <IconTrash size={13} /> {deleting ? "Deleting…" : "Delete shared house"}
            </button>
          </div>
        </>
      )}

      <ConfirmDialog
        open={confirmClear}
        danger
        title={`Clear all data in "${house.name}"?`}
        message="This permanently removes every bill and grocery item in this shared house. Members will be kept. This cannot be undone."
        confirmLabel="Clear data"
        onConfirm={handleClear}
        onCancel={() => setConfirmClear(false)}
      />

      <ConfirmDialog
        open={confirmDel}
        danger
        title={`Delete "${house.name}"?`}
        message="This permanently deletes the shared house along with all its bills and grocery items for every member. This cannot be undone."
        confirmLabel="Delete house"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDel(false)}
      />
    </div>
  );
}

// ── Main SharedHouse component ────────────────────────────────────────────────
export default function SharedHouse({
  sharedHouseStore, month, onMonthChange, months, userEmail, today,
  personalHouse, personalGrocery,
}) {
  const {
    sharedHouses, selectedHouseId, setSelectedHouseId,
    selectedHouse, isOwner,
    house, grocery, loading,
    createSharedHouse, inviteMember, removeMember, renameSharedHouse, deleteSharedHouse,
    addBill, updateBill, deleteBill, importBills,
    addGrocery, deleteGrocery, importGrocery,
    migrateToShared, clearSharedData,
  } = sharedHouseStore;

  const [subView, setSubView] = useState("dashboard");

  // Build months from actual shared house data so members see all active months
  const sharedMonths = useMemo(() => {
    const all = [
      ...house,
      ...grocery,
      ...(sharedHouseStore.tuition   || []),
      ...(sharedHouseStore.otherExpense || []),
    ];
    const set = new Set(all.map((x) => x.month).filter(Boolean));
    // Also include months from personal data if owner, and always current month
    months.forEach((m) => set.add(m));
    return [...set].sort().reverse();
  }, [house, grocery, sharedHouseStore.tuition, sharedHouseStore.otherExpense, months]);

  const monthHouse   = house.filter((x)   => x.month === month);
  const monthGrocery = grocery.filter((x) => x.month === month);

  // Show the house list when nothing is selected, or when the selected house
  // is gone (e.g. just deleted) but the id hasn't cleared yet.
  if (!selectedHouseId || !selectedHouse) {
    return (
      <HouseSelector
        sharedHouses={sharedHouses}
        selectedHouseId={selectedHouseId}
        onSelect={(id) => { setSubView("dashboard"); setSelectedHouseId(id); }}
        onCreate={createSharedHouse}
        userEmail={userEmail}
      />
    );
  }

  if (loading) return <div className="loading">Loading shared house…</div>;

  return (
    <div>
      {/* Header */}
      <div className="top" style={{ marginBottom: 0 }}>
        <div className="greeting">
          <div className="greeting-sub">{today}</div>
          <h1>
            <button
              onClick={() => setSelectedHouseId(null)}
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", fontSize: 14, padding: 0, marginRight: 8 }}
            >
              ← All houses
            </button>
            {selectedHouse?.name}
            {!isOwner && <span style={{ fontSize: 13, color: "var(--muted)", fontWeight: 400, marginLeft: 8 }}>read-only</span>}
          </h1>
        </div>
        <div className="top-actions">
          <MonthPicker value={month} onChange={onMonthChange} months={sharedMonths} />
        </div>
      </div>

      {/* Sub-nav tabs */}
      <div className="tab-bar">
        {[
          { key: "dashboard", label: "Dashboard",       icon: <IconHome size={14}/> },
          { key: "summary",   label: "Monthly Summary", icon: <IconYear size={14}/> },
          ...(isOwner ? [{ key: "import", label: "Bulk Import", icon: <IconImport size={14}/> }] : []),
          { key: "members",   label: "Members",         icon: <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="5" r="2.5"/><path d="M1 14c0-3 2-4.5 5-4.5s5 1.5 5 4.5"/><circle cx="12" cy="5" r="2"/><path d="M15 13c0-2-1.3-3.5-3-3.5"/></svg> },
        ].map(({ key, label, icon }) => (
          <button
            key={key}
            className={`tab-btn${subView === key ? " active" : ""}`}
            onClick={() => setSubView(key)}
          >
            {icon}
            <span>{label}</span>
          </button>
        ))}
      </div>

      {subView === "members" && (
        <MembersPanel
          house={selectedHouse}
          isOwner={isOwner}
          userEmail={userEmail}
          onInvite={inviteMember}
          onRemove={removeMember}
          onRename={renameSharedHouse}
          onDelete={deleteSharedHouse}
          onMigrate={() => migrateToShared(personalHouse, personalGrocery)}
          onClear={clearSharedData}
          personalHouseCount={personalHouse?.length || 0}
          personalGroceryCount={personalGrocery?.length || 0}
        />
      )}

      {subView === "dashboard" && (
        <HouseDashboard
          house={monthHouse}
          grocery={monthGrocery}
          tuition={sharedHouseStore.tuition?.filter((x) => x.month === month) || []}
          otherExpense={sharedHouseStore.otherExpense?.filter((x) => x.month === month) || []}
          month={month}
          readOnly={!isOwner}
          onView={(v) => setSubView(v === "house-summary" ? "summary" : v)}
          onAdd={isOwner ? addBill : async () => alert("Only the house owner can add entries.")}
          onUpdate={isOwner ? updateBill : async () => {}}
          onDelete={isOwner ? deleteBill : async () => alert("Only the house owner can delete entries.")}
          onAddGrocery={isOwner ? addGrocery : async () => {}}
          onDelGrocery={isOwner ? deleteGrocery : async () => {}}
          onAddTuition={isOwner ? sharedHouseStore.addTuition : async () => {}}
          onDelTuition={isOwner ? sharedHouseStore.deleteTuition : async () => {}}
          onAddOther={isOwner ? sharedHouseStore.addOtherExpense : async () => {}}
          onDelOther={isOwner ? sharedHouseStore.deleteOtherExpense : async () => {}}
          customCats={selectedHouse?.customCategories || []}
          onAddCategory={isOwner ? (name) => sharedHouseStore.addCategory(selectedHouse.id, name) : undefined}
        />
      )}

      {subView === "summary" && (
        <HouseMonthlySummary allHouse={house} allGrocery={grocery} allTuition={sharedHouseStore.tuition || []} allOtherExpense={sharedHouseStore.otherExpense || []} />
      )}

      {subView === "import" && isOwner && (
        <div className="card" style={{ marginTop: 0 }}>
          <HouseBulkImport
            onImport={importBills}
            onImportGrocery={importGrocery}
          />
        </div>
      )}
    </div>
  );
}
