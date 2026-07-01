import PlanGrafo from "./components/PlanGrafo";

function App() {
  return (
    <div className="min-h-screen bg-[#fdfbf7] text-[#2d2a26]">
      {/* Sticky nav */}
      <nav className="no-print sticky top-0 z-50 bg-[#fdfbf7]/90 backdrop-blur-sm border-b border-[#e5e0d8]">
        <div className="max-w-6xl mx-auto px-6 h-12 flex items-center justify-between">
          <span className="text-[11px] font-bold tracking-[0.22em] uppercase text-[#2d2a26]">
            ORT · Ing. en Sistemas
          </span>
          <div className="flex items-center gap-4">
            <button
              onClick={() => window.print()}
              className="no-print text-[11px] font-medium text-[#7a7368] hover:text-[#b5482a] transition-colors duration-200 flex items-center gap-1"
            >
              Exportar PDF
            </button>
            <a
              href="https://orianacastroe.github.io/Portfolio/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] font-medium text-[#7a7368] hover:text-[#b5482a] transition-colors duration-200 flex items-center gap-1 group"
            >
              Oriana Castro
              <span className="inline-block opacity-40 group-hover:opacity-100 group-hover:translate-x-px group-hover:-translate-y-px transition-all duration-200">
                ↗
              </span>
            </a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <header className="no-print max-w-5xl mx-auto px-6 pt-14 pb-10">
        <div className="w-8 h-[3px] bg-[#b5482a] rounded-full mb-6" />
        <div className="inline-flex items-center gap-2 px-3 py-[6px] rounded-full border border-[#e5e0d8] bg-white text-[10px] font-bold tracking-[0.18em] uppercase text-[#2d2a26] mb-6 shadow-sm select-none">
          <span className="w-[6px] h-[6px] rounded-full bg-[#b5482a] flex-shrink-0" />
          Plan 2019 · ORT Uruguay
        </div>
        <h1 className="font-serif text-[36px] sm:text-[48px] md:text-[58px] leading-[1.07] tracking-tight mb-5">
          El plan de estudios,
          <br />
          <em className="not-italic text-[#b5482a]">de un vistazo.</em>
        </h1>
        <p className="max-w-lg text-[#5a544a] text-[15px] leading-relaxed">
          Marcá tus materias con crédito parcial o total — el plan se actualiza
          en cascada automáticamente. Usá{" "}
          <strong className="font-semibold text-[#2d2a26]">
            Consultar materia
          </strong>{" "}
          para ver exactamente qué necesitás para cursar cualquier cosa.
        </p>
      </header>

      <main className="max-w-6xl mx-auto px-6 pb-24">
        <PlanGrafo />
      </main>

      <footer className="no-print border-t border-[#e5e0d8]">
        <div className="max-w-5xl mx-auto px-6 py-6 text-[11px] text-[#a39c8d]">
          Datos sujetos a revisión contra el plan oficial.
        </div>
      </footer>
      <div className="print-only" style={{ textAlign: "center", fontSize: 10, color: "#a39c8d", marginTop: 12 }}>
        orianacastroe.github.io/Plan-de-estudios-ORT
      </div>
    </div>
  );
}

export default App;
