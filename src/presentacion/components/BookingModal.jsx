// src/presentacion/components/BookingModal.jsx
import { Fragment, useMemo, useState } from "react";
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import {
  CalendarClock,
  PlayCircle,
  ShieldCheck,
  MessageCircle,
  Clock,
  BadgeCheck,
  MapPin,
  X,
} from "lucide-react";
import SchedulePicker from "./SchedulePicker";

const WHATSAPP_URL =
  import.meta.env.VITE_PUBLIC_WHATSAPP_URL || "https://wa.me/522712105761";

export default function BookingModal({ open, setOpen, person }) {
  const [picked, setPicked] = useState({
    date: "",
    time: "",
    service: "",
    duration: "",
    agenda: "",
    doctor: "",
  });

  const resumenList = useMemo(() => {
    const items = [];

    if (picked.service) items.push(["Servicio", picked.service]);
    if (picked.date) items.push(["Fecha", picked.date]);
    if (picked.time) items.push(["Hora", picked.time]);
    if (picked.duration) items.push(["Duración", picked.duration]);
    if (picked.agenda) items.push(["Agenda", picked.agenda]);
    if (picked.doctor) items.push(["Profesional", picked.doctor]);
    if (person?.location) items.push(["Sede", person.location]);

    return items;
  }, [picked, person?.location]);

  return (
    <Transition
      show={open}
      as={Fragment}
      afterLeave={() =>
        setPicked({
          date: "",
          time: "",
          service: "",
          duration: "",
          agenda: "",
          doctor: "",
        })
      }
    >
      <Dialog as="div" className="relative z-[60]" onClose={() => setOpen(false)}>
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        </TransitionChild>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="mx-auto flex min-h-full max-w-6xl items-start justify-center p-4">
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 translate-y-2"
              enterTo="opacity-100 translate-y-0"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0"
              leaveTo="opacity-0 translate-y-2"
            >
              <DialogPanel className="w-full overflow-hidden rounded-2xl bg-[#0B1220] text-slate-100 ring-1 ring-white/10 shadow-2xl">
                <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                  <div>
                    <DialogTitle className="text-base font-semibold">
                      Agenda con {person?.name}
                    </DialogTitle>
                    <p className="mt-0.5 text-xs text-slate-400">
                      Selecciona servicio y horario disponible.
                    </p>
                  </div>

                  <button
                    onClick={() => setOpen(false)}
                    className="inline-flex size-9 items-center justify-center rounded-xl bg-white/5 text-slate-300 ring-1 ring-white/10 hover:bg-white/10"
                    aria-label="Cerrar"
                  >
                    <X className="size-5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-6 p-5 md:grid-cols-12">
                  <div className="md:col-span-5 xl:col-span-4">
                    <div className="aspect-video overflow-hidden rounded-2xl bg-white/5 ring-1 ring-white/10">
                      {person?.videoUrl ? (
                        <iframe
                          className="h-full w-full"
                          src={person.videoUrl}
                          title={person.name}
                          loading="lazy"
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          allowFullScreen
                        />
                      ) : (
                        <div className="grid h-full place-items-center text-slate-400">
                          <PlayCircle className="mb-2 size-8" />
                          <span className="text-sm">Video no disponible</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <StatCard
                        icon={<Clock className="size-4" />}
                        title="Duración"
                        value={picked.duration || "Variable"}
                      />
                      <StatCard
                        icon={<BadgeCheck className="size-4" />}
                        title="Especialidad"
                        value={person?.badges?.[0] ?? person?.role ?? "Clínica"}
                      />
                      <StatCard
                        icon={<MapPin className="size-4" />}
                        title="Ubicación"
                        value={person?.location ?? "Córdoba, Ver."}
                      />
                      <StatCard
                        icon={<CalendarClock className="size-4" />}
                        title="Agenda"
                        value="2 semanas"
                      />
                    </div>

                    {(person?.services?.length ?? 0) > 0 && (
                      <ul className="mt-4 space-y-1.5 rounded-2xl bg-white/5 p-4 text-sm ring-1 ring-white/10">
                        {person.services.slice(0, 6).map((service, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="mt-1 size-1.5 rounded-full bg-emerald-400" />
                            <span>{service}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="md:col-span-7 xl:col-span-8">
                    <SchedulePicker
                      person={person}
                      picked={picked}
                      onPickedChange={setPicked}
                    />

                    <div className="mt-4 grid gap-4 md:grid-cols-5">
                      <div className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10 md:col-span-3">
                        <h4 className="text-sm font-semibold">Resumen</h4>

                        <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-slate-300">
                          {resumenList.length === 0 ? (
                            <div className="col-span-2 text-slate-400">
                              Todavía no has seleccionado una cita.
                            </div>
                          ) : (
                            resumenList.map(([label, value]) => (
                              <Fragment key={label}>
                                <dt className="text-slate-400">{label}</dt>
                                <dd className="font-medium">{value}</dd>
                              </Fragment>
                            ))
                          )}
                        </dl>

                        <div className="mt-3 flex flex-wrap gap-2">
                          {(person?.badges ?? []).slice(0, 3).map((badge, index) => (
                            <span
                              key={index}
                              className="rounded-full bg-cyan-500/10 px-2.5 py-0.5 text-[11px] font-medium text-cyan-200 ring-1 ring-cyan-400/20"
                            >
                              {badge}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10 md:col-span-2">
                        <h4 className="text-sm font-semibold">Política</h4>
                        <p className="mt-1 text-xs leading-5 text-slate-400">
                          <ShieldCheck className="mr-1 inline size-4 align-text-bottom text-emerald-400" />
                          Las citas pueden reprogramarse hasta 12 h antes. En caso
                          de urgencia, contáctanos por WhatsApp.
                        </p>

                        <a
                          href={WHATSAPP_URL}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-ghost mt-3 w-full hover:bg-blue-500"
                          title="Abrir WhatsApp"
                        >
                          <MessageCircle className="mr-2 size-4" />
                          WhatsApp
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 border-t border-white/10 px-5 py-4">
                  <button onClick={() => setOpen(false)} className="btn btn-ghost">
                    Cerrar
                  </button>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

function StatCard({ icon, title, value }) {
  return (
    <div className="rounded-xl bg-white/5 p-3 ring-1 ring-white/10">
      <div className="flex items-center gap-2 text-xs text-slate-400">
        {icon}
        <span>{title}</span>
      </div>
      <div className="mt-1 text-sm font-semibold">{value}</div>
    </div>
  );
}