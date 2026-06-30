import PlanGrafo from "./components/PlanGrafo";

function App() {
  return (
    <div className="min-h-screen bg-[#fdfbf7] text-[#2d2a26]">
      <header className="max-w-5xl mx-auto px-6 pt-14 pb-8">
        <p className="text-xs tracking-[0.25em] uppercase text-[#b5482a] font-semibold mb-3">
          Ingeniería en Sistemas · ORT
        </p>
        <h1 className="font-serif text-5xl leading-tight mb-4">
          El plan de estudios,<br />de un vistazo.
        </h1>
        <p className="max-w-xl text-[#5a544a]">
          Clickeá cualquier materia y vas a ver en dorado lo que necesitás para
          cursarla, y en terracota lo que desbloqueás al aprobarla. Nada de
          buscar en un PDF de 40 páginas.
        </p>
      </header>
      <main className="max-w-6xl mx-auto px-6 pb-20">
        <PlanGrafo />
      </main>
      <footer className="max-w-5xl mx-auto px-6 pb-10 text-xs text-[#a39c8d]">
        Hecho por Oriana Castro — datos sujetos a revisión contra el plan oficial.
      </footer>
    </div>
  );
}

export default App;
