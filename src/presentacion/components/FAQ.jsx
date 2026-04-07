// src/components/FAQ.jsx
import { HelpCircle, ChevronDown, MessageCircle, CreditCard, CalendarClock } from "lucide-react";


function Pill({ icon: Icon, children }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
      {Icon ? <Icon className="h-4 w-4 text-cyan-300" /> : null}
      {children}
    </span>
  );
}

function FAQItem({ icon: Icon, q, a, defaultOpen = false }) {
  return (
    <details
      className="group rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:bg-white/10"
      open={defaultOpen}
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 select-none">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/10 bg-black/20">
            {Icon ? <Icon className="h-5 w-5 text-cyan-300" /> : null}
          </span>

          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-white md:text-base">{q}</h3>
            <p className="mt-1 text-xs text-white/55">Toca para ver la respuesta</p>
          </div>
        </div>

        <ChevronDown className="h-5 w-5 shrink-0 text-white/60 transition-transform duration-200 group-open:rotate-180" />
      </summary>

      <div className="mt-4 border-t border-white/10 pt-4">
        <p className="text-sm leading-6 text-white/75">{a}</p>
      </div>
    </details>
  );
}

export default function FAQ() {
  const faqs = [
    {
      q: "¿Cómo aparto una cita?",
      a: "Ve a ‘Agendar’, elige al profesional y el servicio. Después selecciona fecha y hora disponible y confirma. Si necesitas ayuda, podemos agendar por WhatsApp.",
      icon: CalendarClock,
      defaultOpen: true,
    },
    {
      q: "¿Atienden urgencias?",
      a: "Sí. Escríbenos por WhatsApp para confirmar disponibilidad inmediata y el tipo de atención requerida.",
      icon: MessageCircle,
    },
    {
      q: "¿Qué métodos de pago aceptan?",
      a: "Efectivo, tarjeta y transferencia. Si necesitas factura, compártenos tus datos y te apoyamos.",
      icon: CreditCard,
    },
    {
      q: "¿Cuál es la política de cancelación?",
      a: "Sin cargo si cancelas con al menos 12 horas de anticipación. Si es el mismo día, te sugerimos reprogramar lo antes posible para liberar el espacio.",
      icon: HelpCircle,
    },
  ];

  return (
    <section id="faq" className="py-14 md:py-16">
      <div className="mx-auto max-w-6xl px-4">
        {/* Header premium */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
              <HelpCircle className="h-4 w-4 text-cyan-300" />
              Preguntas frecuentes
            </div>

            <h2 className="mt-4 text-3xl font-bold tracking-tight text-white md:text-4xl">
              Resolvemos tus dudas
            </h2>
            <p className="mt-2 max-w-2xl text-white/70">
              Información rápida sobre citas, urgencias, pagos y políticas de atención.
            </p>
          </div>

          {/* Pills */}
          <div className="flex flex-wrap gap-2">
            <Pill icon={CalendarClock}>Agendar fácil</Pill>
            <Pill icon={CreditCard}>Pagos flexibles</Pill>
            <Pill icon={MessageCircle}>Soporte WhatsApp</Pill>
          </div>
        </div>

        {/* Layout: accordion + CTA */}
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Accordion */}
          <div className="lg:col-span-8">
            <div className="space-y-4">
              {faqs.map((item, idx) => (
                <FAQItem
                  key={idx}
                  q={item.q}
                  a={item.a}
                  icon={item.icon}
                  defaultOpen={item.defaultOpen}
                />
              ))}
            </div>
          </div>

          {/* Side card (CTA) */}
          <aside className="lg:col-span-4">
            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6">
              <div className="absolute -top-24 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-cyan-500/10 blur-3xl" />

              <h3 className="text-lg font-semibold text-white">
                ¿Aún tienes dudas?
              </h3>
              <p className="mt-2 text-sm text-white/70">
                Escríbenos y te ayudamos a agendar o a resolver cualquier pregunta.
              </p>

              <div className="mt-5 space-y-3">
                <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-white/60">
                    Recomendación
                  </p>
                  <p className="mt-1 text-sm text-white/75">
                    Si es urgente, envía un mensaje con:{" "}
                    <span className="text-white">síntoma + tiempo de evolución</span>.
                  </p>
                </div>
                <a href="https://wa.me/522712105761" target="_blank" rel="noreferrer" className="inline-flex w-full items-center justify-center gap-2 rounded-full btn btn-primary h-10">
                  <MessageCircle className="h-4 w-4" />
                  Contactar por WhatsApp
                </a>

                <p className="text-sm text-white/55">
                  *La disponibilidad puede variar. Te respondemos lo antes posible.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
