import React, { useCallback, useEffect, useMemo, useState } from "react";
import { materias, grupos, hitos } from "../data/materias";
import type { Materia, Requisito, HitoTitulo } from "../data/materias";

type EstadoMateria = "none" | "parcial" | "total";
type Modo = "marcar" | "consultar";
type HlColor = "green" | "orange" | "yellow";

const LS_KEY = "ort-plan-v1";
const LS_KEY_GRUPOS = "ort-plan-grupos-v1";

function loadProgreso(): Map<string, EstadoMateria> {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return new Map(JSON.parse(raw) as [string, EstadoMateria][]);
  } catch { /**/ }
  return new Map();
}

// Para cada grupo, qué materia es "la elegida" por defecto: la primera que
// aparece en el dataset para ese grupoId.
function defaultSelecciones(): Map<string, string> {
  const result = new Map<string, string>();
  for (const g of grupos) {
    const primera = materias.find((m) => m.grupo === g.id);
    if (primera) result.set(g.id, primera.id);
  }
  return result;
}

function loadSelecciones(): Map<string, string> {
  try {
    const raw = localStorage.getItem(LS_KEY_GRUPOS);
    if (raw) {
      const guardado = new Map(JSON.parse(raw) as [string, string][]);
      // Completar con default por si se agregó un grupo nuevo después.
      const base = defaultSelecciones();
      for (const [k, v] of guardado) base.set(k, v);
      return base;
    }
  } catch { /**/ }
  return defaultSelecciones();
}

// Resuelve una previa (que puede apuntar a una materia puntual o a un grupo)
// al id de materia efectivo, según la opción elegida para ese grupo.
function resolverRequisito(req: Requisito, selecciones: Map<string, string>): string | undefined {
  if (req.materiaId) return req.materiaId;
  if (req.grupoId) return selecciones.get(req.grupoId);
  return undefined;
}

function estaDisponible(
  m: Materia,
  progreso: Map<string, EstadoMateria>,
  selecciones: Map<string, string>
): boolean {
  return m.requisitos.every((req) => {
    const id = resolverRequisito(req, selecciones);
    if (!id) return false;
    const e = progreso.get(id) ?? "none";
    return req.tipo === "total" ? e === "total" : e !== "none";
  });
}

function aplicarCambio(
  id: string,
  estado: EstadoMateria,
  prev: Map<string, EstadoMateria>,
  selecciones: Map<string, string>
): Map<string, EstadoMateria> {
  const next = new Map(prev);
  next.set(id, estado);
  // Cascade: resetear las materias cuyos requisitos ya no se cumplen
  let dirty = true;
  while (dirty) {
    dirty = false;
    for (const m of materias) {
      const e = next.get(m.id) ?? "none";
      if (e === "none") continue;
      if (!estaDisponible(m, next, selecciones)) {
        next.set(m.id, "none");
        dirty = true;
      }
    }
  }
  return next;
}

function computarConsulta(
  id: string,
  progreso: Map<string, EstadoMateria>,
  selecciones: Map<string, string>
): Map<string, HlColor> {
  const result = new Map<string, HlColor>();
  const stack = [id];
  const visited = new Set<string>();
  while (stack.length) {
    const cur = stack.pop()!;
    if (visited.has(cur)) continue;
    visited.add(cur);
    const m = materias.find((x) => x.id === cur);
    if (!m) continue;
    for (const req of m.requisitos) {
      const reqId = resolverRequisito(req, selecciones);
      if (!reqId || result.has(reqId)) continue;
      const e = progreso.get(reqId) ?? "none";
      const ok = req.tipo === "total" ? e === "total" : e !== "none";
      result.set(reqId, ok ? "green" : req.tipo === "total" ? "orange" : "yellow");
      stack.push(reqId);
    }
  }
  return result;
}

type CS = { bg: string; border: string; color: string; opacity?: number };

const S: Record<string, CS> = {
  locked:    { bg: "#e8e4de", border: "1.5px solid #cec9c0", color: "#a39c8d" },
  available: { bg: "#faf7f2", border: "1.5px solid #2d2a26", color: "#2d2a26" },
  parcial:   { bg: "#fef3c7", border: "2px solid #d97706",   color: "#92400e" },
  total:     { bg: "#d1fae5", border: "2px solid #059669",   color: "#065f46" },
  selected:  { bg: "#2d2a26", border: "2px solid #2d2a26",   color: "#faf7f2" },
  dimmed:    { bg: "#f5f3ef", border: "1.5px solid #e0dbd2", color: "#c5bfb5", opacity: 0.5 },
  hlGreen:   { bg: "#d1fae5", border: "2px solid #059669",   color: "#065f46" },
  hlOrange:  { bg: "#fed7aa", border: "2px solid #ea580c",   color: "#9a3412" },
  hlYellow:  { bg: "#fef9c3", border: "2px solid #ca8a04",   color: "#713f12" },
};

function normalStyle(estado: EstadoMateria, disponible: boolean): CS {
  if (estado === "total") return S.total;
  if (estado === "parcial") return S.parcial;
  return disponible ? S.available : S.locked;
}

// Cada item del semestre es o bien una materia suelta, o bien un grupo de
// alternativas (que se renderiza como UNA caja).
type ItemSemestre =
  | { tipo: "materia"; materia: Materia }
  | { tipo: "grupo"; grupoId: string; opciones: Materia[] };

// Electivas sin definir: se excluyen del cálculo de hitos aproximados.
const ELECTIVAS_EXCLUIR = new Set(["electiva1", "electiva2", "electiva3"]);

// Colores violeta/índigo para cada capa de título — familia distinta al
// verde/ámbar de estado para que no compitan visualmente.
const LAYER_COLORS: Record<1 | 2 | 3, string> = {
  1: "#a78bfa", // violeta claro  → Ayudante de Ingeniero
  2: "#7c3aed", // violeta medio  → Licenciado
  3: "#4c1d95", // índigo oscuro  → Ingeniero en Sistemas
};

const HITO_ICONS = ["🎓", "📜", "🏆"] as const;

// Devuelve los IDs de materias requeridas para un hito.
// Lista verificada: combina materiasVerificadas + gruposVerificados (resueltos al elegido).
// Aproximación: filtra por semestre <= semestreCorte, sin electivas, un ID por grupo.
function getMateriasHito(hito: HitoTitulo, selecciones: Map<string, string>): string[] {
  if (hito.materiasVerificadas !== null) {
    const result = [...hito.materiasVerificadas];
    for (const grupoId of hito.gruposVerificados ?? []) {
      const elegida = selecciones.get(grupoId) ?? materias.find((m) => m.grupo === grupoId)?.id;
      if (elegida) result.push(elegida);
    }
    return result;
  }
  const result: string[] = [];
  const gruposContados = new Set<string>();
  for (const m of materias) {
    if (m.semestre > hito.semestreCorte!) continue;
    if (ELECTIVAS_EXCLUIR.has(m.id)) continue;
    if (m.grupo) {
      if (gruposContados.has(m.grupo)) continue;
      gruposContados.add(m.grupo);
      result.push(selecciones.get(m.grupo) ?? m.id);
    } else {
      result.push(m.id);
    }
  }
  return result;
}

function useWindowWidth() {
  const [width, setWidth] = useState(() => window.innerWidth);
  useEffect(() => {
    const handler = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return width;
}

export default function PlanGrafo() {
  const windowWidth = useWindowWidth();
  const isMobile = windowWidth < 640;

  const [progreso, setProgreso] = useState<Map<string, EstadoMateria>>(loadProgreso);
  const [selecciones, setSelecciones] = useState<Map<string, string>>(loadSelecciones);
  const [modo, setModo] = useState<Modo>("marcar");
  const [consultada, setConsultada] = useState<string | null>(null);
  const [grupoAbierto, setGrupoAbierto] = useState<string | null>(null);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify([...progreso.entries()]));
  }, [progreso]);

  useEffect(() => {
    localStorage.setItem(LS_KEY_GRUPOS, JSON.stringify([...selecciones.entries()]));
  }, [selecciones]);

  const itemsPorSemestre = useMemo(() => {
    const map = new Map<number, ItemSemestre[]>();
    const gruposYaPuestos = new Set<string>();
    for (const m of materias) {
      if (!map.has(m.semestre)) map.set(m.semestre, []);
      const lista = map.get(m.semestre)!;
      if (m.grupo) {
        if (gruposYaPuestos.has(m.grupo)) continue; // ya se agregó el ítem de grupo
        gruposYaPuestos.add(m.grupo);
        const opciones = materias.filter((x) => x.grupo === m.grupo);
        lista.push({ tipo: "grupo", grupoId: m.grupo, opciones });
      } else {
        lista.push({ tipo: "materia", materia: m });
      }
    }
    return [...map.entries()].sort(([a], [b]) => a - b);
  }, []);

  const highlights = useMemo(
    () =>
      modo === "consultar" && consultada
        ? computarConsulta(consultada, progreso, selecciones)
        : new Map<string, HlColor>(),
    [modo, consultada, progreso, selecciones]
  );

  // Mapa id → capa (1, 2 o 3). Se recalcula cuando cambia la elección de grupo.
  const capaMap = useMemo(() => {
    const map = new Map<string, 1 | 2 | 3>();
    const ids0 = getMateriasHito(hitos[0], selecciones);
    const ids1 = getMateriasHito(hitos[1], selecciones);
    const ids2 = getMateriasHito(hitos[2], selecciones);
    const set0 = new Set(ids0);
    const set1 = new Set(ids1);
    for (const id of ids0) map.set(id, 1);
    for (const id of ids1) if (!set0.has(id)) map.set(id, 2);
    for (const id of ids2) if (!set0.has(id) && !set1.has(id)) map.set(id, 3);
    return map;
  }, [selecciones]);

  const progresoPorSemestre = useMemo(() => {
    const result = new Map<number, { completadas: number; total: number }>();
    for (const [sem, items] of itemsPorSemestre) {
      let completadas = 0;
      for (const item of items) {
        const mId =
          item.tipo === "materia"
            ? item.materia.id
            : selecciones.get(item.grupoId) ?? item.opciones[0]?.id;
        if (mId && (progreso.get(mId) ?? "none") === "total") completadas++;
      }
      result.set(sem, { completadas, total: items.length });
    }
    return result;
  }, [itemsPorSemestre, progreso, selecciones]);

  const globalStats = useMemo(() => {
    let completadas = 0, total = 0;
    for (const s of progresoPorSemestre.values()) {
      completadas += s.completadas;
      total += s.total;
    }
    return { completadas, total, pct: total > 0 ? Math.round((completadas / total) * 100) : 0 };
  }, [progresoPorSemestre]);

  const nextHito = useMemo(() => {
    for (const h of hitos) {
      const ids = getMateriasHito(h, selecciones);
      const cumplidas = ids.filter((id) => (progreso.get(id) ?? "none") === "total").length;
      if (cumplidas < ids.length) return h;
    }
    return null;
  }, [progreso, selecciones]);

  const disponiblesCount = useMemo(() => {
    let count = 0;
    for (const [, items] of itemsPorSemestre) {
      for (const item of items) {
        const m =
          item.tipo === "materia"
            ? item.materia
            : item.opciones.find((o) => o.id === selecciones.get(item.grupoId)) ?? item.opciones[0];
        if (!m) continue;
        if ((progreso.get(m.id) ?? "none") === "none" && estaDisponible(m, progreso, selecciones)) count++;
      }
    }
    return count;
  }, [itemsPorSemestre, progreso, selecciones]);

  const handleClick = useCallback(
    (m: Materia) => {
      if (modo === "consultar") {
        setConsultada((p) => (p === m.id ? null : m.id));
        return;
      }
      const estado = progreso.get(m.id) ?? "none";
      const disponible = estaDisponible(m, progreso, selecciones);
      if (!disponible && estado === "none") return;
      const soloTotal = m.soloTotal ?? false;
      const next: EstadoMateria = soloTotal
        ? estado === "none" ? "total" : "none"
        : estado === "none" ? "parcial" : estado === "parcial" ? "total" : "none";
      setProgreso((prev) => aplicarCambio(m.id, next, prev, selecciones));
    },
    [modo, progreso, selecciones]
  );

  const elegirOpcionDeGrupo = useCallback((grupoId: string, materiaId: string) => {
    setSelecciones((prev) => {
      const next = new Map(prev);
      next.set(grupoId, materiaId);
      return next;
    });
    setGrupoAbierto(null);
  }, []);

  const switchModo = (m: Modo) => {
    setModo(m);
    setConsultada(null);
  };

  // ---- helpers de render ----

  function renderCard(
    item: ItemSemestre,
    extraStyle?: React.CSSProperties
  ) {
    const m =
      item.tipo === "materia"
        ? item.materia
        : item.opciones.find((o) => o.id === selecciones.get(item.grupoId))!;
    const estado = progreso.get(m.id) ?? "none";
    const disponible = estaDisponible(m, progreso, selecciones);
    const hl = highlights.get(m.id);
    const esConsultada = consultada === m.id;
    const esGrupo = item.tipo === "grupo";

    let cs: CS;
    if (modo === "consultar") {
      if (esConsultada) cs = S.selected;
      else if (hl === "green") cs = S.hlGreen;
      else if (hl === "orange") cs = S.hlOrange;
      else if (hl === "yellow") cs = S.hlYellow;
      else if (consultada) cs = S.dimmed;
      else cs = normalStyle(estado, disponible);
    } else {
      cs = normalStyle(estado, disponible);
    }

    const clickable = modo === "consultar" || disponible || estado !== "none";
    const capa = capaMap.get(m.id);
    const cardId = esGrupo ? item.grupoId : m.id;
    const isHovered = clickable && hoveredCard === cardId;

    return (
      <div
        key={cardId}
        role="button"
        tabIndex={clickable ? 0 : -1}
        onClick={() => handleClick(m)}
        onKeyDown={(e) => e.key === "Enter" && handleClick(m)}
        onMouseEnter={() => setHoveredCard(cardId)}
        onMouseLeave={() => setHoveredCard(null)}
        style={{
          position: "relative",
          background: capa
            ? `linear-gradient(to right, ${LAYER_COLORS[capa]} 5px, ${cs.bg} 5px)`
            : cs.bg,
          border: cs.border,
          color: cs.color,
          opacity: cs.opacity ?? 1,
          borderRadius: 10,
          padding: "10px 14px",
          minHeight: 52,
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          cursor: clickable ? "pointer" : "default",
          transition: "transform 0.12s, box-shadow 0.12s, border-color 0.12s",
          userSelect: "none",
          transform: isHovered ? "translateY(-2px)" : "none",
          boxShadow: isHovered ? "0 6px 16px rgba(0,0,0,0.10)" : "0 1px 4px rgba(0,0,0,0.06)",
          ...extraStyle,
        }}
      >
        {esGrupo && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setGrupoAbierto((g) => (g === item.grupoId ? null : item.grupoId));
            }}
            title="Elegir otra opción para este casillero"
            style={{
              position: "absolute", top: 4, right: 4,
              width: 20, height: 20, borderRadius: 6,
              border: "none", background: "rgba(0,0,0,0.08)",
              color: "inherit", fontSize: 11, lineHeight: "20px",
              cursor: "pointer",
            }}
          >
            ✏️
          </button>
        )}
        <span style={{ fontSize: 12, fontWeight: 600, lineHeight: 1.4 }}>
          {m.nombre}
        </span>
        {m.exoneracion && (
          <span style={{
            position: "absolute", bottom: 5, right: 5,
            width: 7, height: 7, borderRadius: "50%",
            background: m.exoneracion === 86 ? "#2d2a26" : "#7dd3fc",
            flexShrink: 0,
          }} />
        )}
        {modo === "consultar" ? (
          hl === "orange" ? (
            <span style={{ fontSize: 10, marginTop: 4, fontWeight: 400 }}>requiere total</span>
          ) : hl === "yellow" ? (
            <span style={{ fontSize: 10, marginTop: 4, fontWeight: 400 }}>requiere parcial</span>
          ) : null
        ) : (
          <>
            {estado === "parcial" && (
              <span style={{ fontSize: 10, marginTop: 4, fontWeight: 400, color: "#a16207" }}>crédito parcial</span>
            )}
            {estado === "total" && (
              <span style={{ fontSize: 10, marginTop: 4, fontWeight: 400, color: "#047857" }}>crédito total</span>
            )}
          </>
        )}
        {esGrupo && grupoAbierto === item.grupoId && (
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "absolute", top: "100%", left: 0, marginTop: 4,
              background: "#fff", border: "1.5px solid #2d2a26",
              borderRadius: 8, boxShadow: "0 4px 14px rgba(0,0,0,0.15)",
              zIndex: 10, width: 220, overflow: "hidden",
            }}
          >
            {item.opciones.map((op) => (
              <div
                key={op.id}
                onClick={() => elegirOpcionDeGrupo(item.grupoId, op.id)}
                style={{
                  padding: "8px 12px", fontSize: 12,
                  fontWeight: op.id === m.id ? 700 : 400,
                  background: op.id === m.id ? "#f3eee2" : "#fff",
                  color: "#2d2a26", cursor: "pointer", textAlign: "left",
                }}
              >
                {op.id === m.id ? "✓ " : ""}{op.nombre}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  const semHeader: React.CSSProperties = {
    fontSize: 12, fontWeight: 800, letterSpacing: "0.18em",
    textTransform: "uppercase", color: "#b5482a", margin: 0,
  };

  // Semestres 9 y 10 se renderizan juntos con Proyecto abarcando ambas filas.
  const items9 = itemsPorSemestre.find(([s]) => s === 9)?.[1] ?? [];
  const items10 = itemsPorSemestre.find(([s]) => s === 10)?.[1] ?? [];
  const proyectoItem = items10.find(
    (i) => (i.tipo === "materia" ? i.materia.id : "") === "proyecto"
  );
  const otros10 = items10.filter(
    (i) => (i.tipo === "materia" ? i.materia.id : "") !== "proyecto"
  );
  // Columnas normales = el máximo entre sem9 y sem10-sin-proyecto.
  // Proyecto recibe el doble de ancho que una materia normal.
  const colsNormales = Math.max(items9.length, otros10.length);

  return (
    <div style={{ fontFamily: "system-ui, sans-serif" }}>
      {/* Tira de estadísticas */}
      <div style={{
        display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)",
        background: "#fff", borderRadius: 14,
        border: "1.5px solid #e5e0d8",
        boxShadow: "0 2px 16px rgba(0,0,0,0.05)",
        overflow: "hidden", marginBottom: 28,
      }}>
        <StatStat value={globalStats.completadas} label="Completadas" />
        <StatStat value={`${globalStats.pct}%`} label="Del plan" accent={globalStats.pct === 100 ? "#059669" : "#b5482a"} />
        <StatStat value={disponiblesCount} label="Disponibles ahora" />
        <StatStat
          value={nextHito ? nextHito.nombre.split(" ")[0] : "¡Listo!"}
          label="Próximo título"
          isText
          accent={nextHito ? LAYER_COLORS[(hitos.indexOf(nextHito) + 1) as 1 | 2 | 3] : "#059669"}
        />
      </div>

      {/* Modo toggle — sticky bajo el nav */}
      <div style={{
        position: "sticky", top: 48, zIndex: 40,
        background: "rgba(253,251,247,0.92)", backdropFilter: "blur(8px)",
        padding: "10px 0", marginBottom: 14,
      }}>
        <div style={{ display: "inline-flex", background: "#eeebe5", borderRadius: 10, padding: 3, gap: 3 }}>
          {(["marcar", "consultar"] as Modo[]).map((m) => (
            <button
              key={m}
              onClick={() => switchModo(m)}
              style={{
                padding: "7px 18px", borderRadius: 7, border: "none",
                background: modo === m ? "#2d2a26" : "transparent",
                color: modo === m ? "#faf7f2" : "#7a7368",
                fontWeight: 600, cursor: "pointer", fontSize: 13,
                transition: "background 0.15s, color 0.15s",
              }}
            >
              {m === "marcar" ? "Marcar progreso" : "Consultar materia"}
            </button>
          ))}
        </div>
      </div>

      {modo === "consultar" && !consultada && (
        <p style={{ fontSize: 13, color: "#7a7368", marginBottom: 24 }}>
          Tocá una materia para ver qué necesitás para cursarla.
        </p>
      )}

      {/* Semestres 1–8: grid de N columnas iguales; los talleres abarcan todo el ancho */}
      {itemsPorSemestre.filter(([s]) => s <= 8).map(([sem, items]) => {
        const esTaller = (it: ItemSemestre) =>
          it.tipo === "grupo"
            ? it.grupoId === "innov-sem5"
            : it.materia.id === "comliderazgo";
        const normales = items.filter((i) => !esTaller(i));
        const talleres = items.filter((i) => esTaller(i));
        const cols = isMobile ? Math.min(normales.length || 1, 2) : normales.length || 1;
        const hitosSem = hitos.filter((h) => h.despuesDeSemestre === sem);
        const stats = progresoPorSemestre.get(sem);
        const semCompleto = stats && stats.total > 0 && stats.completadas === stats.total;
        return (
          <React.Fragment key={sem}>
            <div style={{ marginBottom: hitosSem.length > 0 ? 12 : 28 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <p style={semHeader}>Semestre {sem}</p>
                {stats && (
                  <span style={{
                    fontSize: 11, fontWeight: 600, letterSpacing: "0.02em",
                    color: semCompleto ? "#059669" : "#a39c8d",
                    display: "flex", alignItems: "center", gap: 4,
                  }}>
                    {semCompleto && <span style={{ fontSize: 10 }}>✓</span>}
                    {stats.completadas}/{stats.total}
                  </span>
                )}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 8 }}>
                {normales.map((item) => renderCard(item))}
                {talleres.map((item) => renderCard(item, { gridColumn: "1 / -1" }))}
              </div>
            </div>
            {hitosSem.map((h) => (
              <HitoCard key={h.id} hito={h} progreso={progreso} selecciones={selecciones}
                capaColor={LAYER_COLORS[(hitos.indexOf(h) + 1) as 1 | 2 | 3]}
                index={hitos.indexOf(h)} />
            ))}
          </React.Fragment>
        );
      })}

      {/* Semestres 9 y 10: Proyecto abarca las 2 filas en la columna de la derecha */}
      {(items9.length > 0 || items10.length > 0) && (
        <>
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <p style={semHeader}>Semestres 9 y 10</p>
              {(() => {
                const s9 = progresoPorSemestre.get(9);
                const s10 = progresoPorSemestre.get(10);
                const c = (s9?.completadas ?? 0) + (s10?.completadas ?? 0);
                const t = (s9?.total ?? 0) + (s10?.total ?? 0);
                if (!t) return null;
                const done = c === t;
                return (
                  <span style={{ fontSize: 11, fontWeight: 600, color: done ? "#059669" : "#a39c8d", display: "flex", alignItems: "center", gap: 4 }}>
                    {done && <span style={{ fontSize: 10 }}>✓</span>}
                    {c}/{t}
                  </span>
                );
              })()}
            </div>
            {isMobile ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
                {[...items9, ...items10].map((item) => renderCard(item))}
              </div>
            ) : (
              <div style={{
                display: "grid",
                gridTemplateColumns: proyectoItem
                  ? `repeat(${colsNormales}, 1fr) 2fr`
                  : `repeat(${colsNormales}, 1fr)`,
                gridTemplateRows: "auto auto",
                gap: 8,
              }}>
                {items9.map((item, i) =>
                  renderCard(item, { gridColumn: i + 1, gridRow: 1 })
                )}
                {otros10.map((item, i) =>
                  renderCard(item, { gridColumn: i + 1, gridRow: 2 })
                )}
                {proyectoItem && renderCard(proyectoItem, {
                  gridColumn: colsNormales + 1,
                  gridRow: "1 / 3",
                })}
              </div>
            )}
          </div>
          {hitos.filter((h) => h.despuesDeSemestre === 10).map((h) => (
            <HitoCard key={h.id} hito={h} progreso={progreso} selecciones={selecciones}
              capaColor={LAYER_COLORS[(hitos.indexOf(h) + 1) as 1 | 2 | 3]}
              index={hitos.indexOf(h)} />
          ))}
        </>
      )}

      {/* Leyenda */}
      <div style={{ marginTop: 32, paddingTop: 20, borderTop: "1px solid #e5e0d8", fontSize: 12, color: "#7a7368", display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.13em", textTransform: "uppercase", color: "#a39c8d", margin: "0 0 8px 0" }}>
            Estado de la materia
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 20px" }}>
            {modo === "marcar" ? (
              <>
                <Chip bg="#e8e4de" border="1.5px solid #cec9c0" label="Bloqueada" />
                <Chip bg="#faf7f2" border="1.5px solid #2d2a26" label="Disponible" />
                <Chip bg="#fef3c7" border="2px solid #d97706" label="Crédito parcial" />
                <Chip bg="#d1fae5" border="2px solid #059669" label="Crédito total" />
                <span>✏️ = elegir otra opción del casillero</span>
              </>
            ) : (
              <>
                <Chip bg="#d1fae5" border="2px solid #059669" label="Requisito cumplido" />
                <Chip bg="#fed7aa" border="2px solid #ea580c" label="Necesitás crédito total" />
                <Chip bg="#fef9c3" border="2px solid #ca8a04" label="Necesitás crédito parcial" />
              </>
            )}
          </div>
        </div>
        <div>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.13em", textTransform: "uppercase", color: "#a39c8d", margin: "0 0 8px 0" }}>
            Exoneración
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 20px", marginBottom: 14 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#7dd3fc", flexShrink: 0, display: "inline-block" }} />
              70
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#2d2a26", flexShrink: 0, display: "inline-block" }} />
              86
            </span>
          </div>
        </div>
        <div>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.13em", textTransform: "uppercase", color: "#a39c8d", margin: "0 0 8px 0" }}>
            A qué título cuenta
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 20px" }}>
            {hitos.map((h, i) => (
              <CapaChip key={h.id} color={LAYER_COLORS[(i + 1) as 1 | 2 | 3]} label={h.nombre} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function HitoCard({
  hito,
  progreso,
  selecciones,
  capaColor,
  index,
}: {
  hito: HitoTitulo;
  progreso: Map<string, EstadoMateria>;
  selecciones: Map<string, string>;
  capaColor: string;
  index: number;
}) {
  const ids = getMateriasHito(hito, selecciones);
  const cumplidas = ids.filter((id) => (progreso.get(id) ?? "none") === "total").length;
  const total = ids.length;
  const porcentaje = total > 0 ? Math.round((cumplidas / total) * 100) : 0;
  const completo = total > 0 && cumplidas === total;
  const accentColor = completo ? "#059669" : capaColor;

  return (
    <div style={{
      margin: "4px 0 28px",
      borderRadius: 14,
      background: completo ? "#f0fdf4" : "#fff",
      border: `1.5px solid ${completo ? "#bbf7d0" : "#e5e0d8"}`,
      overflow: "hidden",
      boxShadow: completo
        ? "0 6px 28px rgba(5,150,105,0.12)"
        : "0 4px 20px rgba(0,0,0,0.07)",
    }}>
      <div style={{ height: 3, background: accentColor }} />

      <div style={{ padding: "14px 16px", display: "flex", gap: 14, alignItems: "flex-start" }}>
        {/* Ícono de título */}
        <div style={{
          width: 46, height: 46, borderRadius: 12, flexShrink: 0,
          background: `${accentColor}18`,
          border: `1.5px solid ${accentColor}40`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 22,
        }}>
          {HITO_ICONS[index] ?? "🎓"}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 14 }}>
            <div>
              <div style={{
                fontSize: 9, fontWeight: 700, letterSpacing: "0.22em",
                textTransform: "uppercase", color: accentColor, marginBottom: 5,
              }}>
                {hito.tipo}
              </div>
              <div style={{
                fontSize: 15, fontWeight: 800, letterSpacing: "-0.01em",
                textTransform: "uppercase",
                color: completo ? "#065f46" : "#2d2a26", lineHeight: 1.2,
              }}>
                {hito.nombre}
              </div>
            </div>
            {completo ? (
              <div style={{
                width: 34, height: 34, borderRadius: "50%",
                background: "#059669", flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <span style={{ color: "#fff", fontSize: 16, fontWeight: 700 }}>✓</span>
              </div>
            ) : (
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <span style={{ fontSize: 26, fontWeight: 800, color: accentColor, lineHeight: 1, letterSpacing: "-0.02em" }}>
                  {porcentaje}
                </span>
                <span style={{ fontSize: 13, fontWeight: 700, color: accentColor }}>%</span>
              </div>
            )}
          </div>

          <div style={{ height: 6, borderRadius: 3, background: "#e8e4de", overflow: "hidden", marginBottom: 6 }}>
            <div style={{
              height: "100%", width: `${porcentaje}%`,
              background: accentColor, borderRadius: 3,
              transition: "width 0.35s ease",
            }} />
          </div>
          <span style={{ fontSize: 11, color: completo ? "#047857" : "#a39c8d", fontWeight: 500 }}>
            {cumplidas} de {total} materias con crédito total
          </span>
        </div>
      </div>
    </div>
  );
}

function CapaChip({ color, label }: { color: string; label: string }) {
  return (
    <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <span style={{
        display: "inline-block", width: 4, height: 14,
        background: color, borderRadius: 2, flexShrink: 0,
      }} />
      {label}
    </span>
  );
}

function Chip({ bg, border, label }: { bg: string; border: string; label: string }) {
  return (
    <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <span
        style={{
          display: "inline-block",
          width: 13,
          height: 13,
          background: bg,
          border,
          borderRadius: 3,
          flexShrink: 0,
        }}
      />
      {label}
    </span>
  );
}

function StatStat({
  value, label, isText = false, accent,
}: {
  value: string | number;
  label: string;
  isText?: boolean;
  accent?: string;
}) {
  return (
    <div style={{
      padding: "18px 20px",
      borderRight: "1px solid #e5e0d8",
      display: "flex", flexDirection: "column", gap: 4,
    }}>
      <span style={{
        fontSize: isText ? 18 : 30, fontWeight: 800, lineHeight: 1,
        letterSpacing: isText ? "-0.01em" : "-0.03em",
        color: accent ?? "#2d2a26",
      }}>
        {value}
      </span>
      <span style={{
        fontSize: 9, fontWeight: 700, letterSpacing: "0.18em",
        textTransform: "uppercase", color: "#a39c8d",
      }}>
        {label}
      </span>
    </div>
  );
}