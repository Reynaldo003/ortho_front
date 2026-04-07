export default function NotFound(){
  return (
    <div className="container max-w-3xl py-16 safe-px">
      <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Página no encontrada</h1>
      <p className="mt-2 text-slate-600 dark:text-slate-300 max-w-prose">
        Parece que este enlace no existe. Vuelve al inicio o usa el menú de navegación.
      </p>
      <a href="/" className="btn btn-primary mt-6 inline-block">Regresar al inicio</a>
    </div>
  )
}
