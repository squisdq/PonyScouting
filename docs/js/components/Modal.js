import { html, useEffect } from "../html.js";

export default function Modal({ title, onClose, children }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return html`
    <div className="overlay fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4"
         onMouseDown=${(e) => e.target === e.currentTarget && onClose()}>
      <div className="panel flex max-h-[92dvh] w-full max-w-lg flex-col rounded-t-3xl sm:rounded-3xl">
        <div className="panel-head flex items-center justify-between px-5 py-4">
          <h2 className="f-title text-2xl">${title}</h2>
          <button onClick=${onClose} aria-label="Close" className="icon-btn">×</button>
        </div>
        <div className="overflow-y-auto p-5">${children}</div>
      </div>
    </div>`;
}
