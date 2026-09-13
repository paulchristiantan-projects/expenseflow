import { useState, useEffect } from "react";
import { CATEGORIES } from "../helpers";

export default function AddModal({ open, month, onClose, onSave }) {
  const [date, setDate] = useState(month + "-01");
  const [amount, setAmount] = useState("");
  const [desc, setDesc] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);

  useEffect(() => {
    if (open) {
      setDate(month + "-01");
      setAmount("");
      setDesc("");
      setCategory(CATEGORIES[0]);
    }
  }, [open, month]);

  async function save() {
    if (!date || !amount || !desc.trim()) {
      alert("Please complete the fields.");
      return;
    }
    await onSave({ date, amount: Number(amount), desc: desc.trim(), category });
    onClose();
  }

  return (
    <div className={"modal" + (open ? " open" : "")}>
      <div className="modalbox">
        <h2>Add expense</h2>
        <div className="formgrid">
          <div className="field">
            <label>Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="field">
            <label>Amount (PHP)</label>
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div className="field full">
            <label>Description</label>
            <input
              placeholder="e.g. Lunch"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
            />
          </div>
          <div className="field">
            <label>Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORIES.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="modalactions">
          <button className="btn secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn primary" onClick={save}>
            Save expense
          </button>
        </div>
      </div>
    </div>
  );
}
