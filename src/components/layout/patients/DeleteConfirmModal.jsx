import { useState } from "react";
import { createPortal } from "react-dom";
import { getFullName } from "./PatientUtils";

function ModalContent({ patient, onClose, onConfirm }) {
    const [text, setText] = useState("");
    const ok = text.trim().toLowerCase() === "eliminar";

    return (
        <div className="fixed inset-0 z-[1300] flex items-center justify-center bg-slate-950/55 p-3 sm:p-4">
            <div className="absolute inset-0" onClick={onClose} />

            <div className="relative z-10 w-full max-w-md overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-2xl">
                <div className="border-b border-slate-200 bg-white p-4 sm:p-5">
                    <h3 className="text-lg font-black text-slate-900">Eliminar paciente</h3>
                    <p className="mt-1 text-sm text-slate-500">
                        Esta acción no se puede deshacer. Para confirmar, escribe <b>eliminar</b>.
                    </p>
                </div>

                <div className="p-4 sm:p-5">
                    <p className="break-words text-sm text-slate-700">
                        Paciente: <b>{getFullName(patient)}</b>
                    </p>

                    <input
                        type="text"
                        className="mt-4 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
                        placeholder="Escribe: eliminar"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                    />

                    <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                        <button
                            onClick={onClose}
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 sm:w-auto"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={() => ok && onConfirm()}
                            disabled={!ok}
                            className="w-full rounded-2xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                        >
                            Eliminar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function DeleteConfirmModal(props) {
    return createPortal(<ModalContent {...props} />, document.body);
}