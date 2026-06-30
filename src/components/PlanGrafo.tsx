import { useCallback, useMemo, useState } from "react";
import ReactFlow, {
  type Edge,
  type Node,
  MarkerType,
  Position,
} from "reactflow";
import "reactflow/dist/style.css";
import { materias } from "../data/materias";

const ANCHO_COL = 220;
const ALTO_FILA = 130;

function construirLayout(): Node[] {
  // Vertical: cada semestre es una FILA (de arriba hacia abajo).
  // Dentro de un semestre, las materias se reparten en columnas.
  const contadorPorSemestre: Record<number, number> = {};
  return materias.map((m) => {
    const col = contadorPorSemestre[m.semestre] ?? 0;
    contadorPorSemestre[m.semestre] = col + 1;
    return {
      id: m.id,
      data: { label: m.nombre },
      position: { x: col * ANCHO_COL, y: m.semestre * ALTO_FILA },
      sourcePosition: Position.Bottom,
      targetPosition: Position.Top,
      style: {
        borderRadius: 10,
        border: "1.5px solid #2d2a26",
        background: "#faf7f2",
        color: "#2d2a26",
        fontFamily: "system-ui, sans-serif",
        fontSize: 12,
        fontWeight: 600,
        width: 190,
        padding: "10px 12px",
        textAlign: "center" as const,
        cursor: "pointer",
      },
    };
  });
}

// Colores fijos para que parcial/total siempre se lean igual en toda la app.
const COLOR_TOTAL = "#b5482a";
const COLOR_PARCIAL = "#3d7a5c";

function construirEdges(): Edge[] {
  const edges: Edge[] = [];
  for (const m of materias) {
    for (const req of m.requisitos) {
      const color = req.tipo === "total" ? COLOR_TOTAL : COLOR_PARCIAL;
      edges.push({
        id: `${req.materiaId}->${m.id}`,
        source: req.materiaId,
        target: m.id,
        label: req.tipo === "total" ? "Total" : "Parcial",
        labelStyle: { fill: color, fontWeight: 700, fontSize: 11 },
        labelBgStyle: { fill: "#fdfbf7" },
        labelBgPadding: [4, 2],
        style: { stroke: color, strokeWidth: 2.5 },
        markerEnd: { type: MarkerType.ArrowClosed, color },
      });
    }
  }
  return edges;
}

export default function PlanGrafo() {
  const nodosBase = useMemo(() => construirLayout(), []);
  const edgesBase = useMemo(() => construirEdges(), []);
  const [seleccionada, setSeleccionada] = useState<string | null>(null);

  const handleNodeClick = useCallback((_: unknown, node: Node) => {
    setSeleccionada((actual) => (actual === node.id ? null : node.id));
  }, []);

  const handlePaneClick = useCallback(() => setSeleccionada(null), []);

  // Solo mostramos las conexiones DIRECTAS de la materia seleccionada:
  // sus previas (entrantes) y las materias que ella habilita (salientes).
  // Nada de grafo completo a la vista: eso es justamente el ruido que sobraba.
  const edgesVisibles = useMemo(() => {
    if (!seleccionada) return [];
    return edgesBase.filter(
      (e) => e.source === seleccionada || e.target === seleccionada
    );
  }, [edgesBase, seleccionada]);

  const { previas, habilitadas } = useMemo(() => {
    const previasMap = new Map<string, "parcial" | "total">();
    const habilitadasMap = new Map<string, "parcial" | "total">();
    if (seleccionada) {
      for (const e of edgesVisibles) {
        const tipo = e.label === "Total" ? "total" : "parcial";
        if (e.target === seleccionada) previasMap.set(e.source as string, tipo);
        if (e.source === seleccionada) habilitadasMap.set(e.target as string, tipo);
      }
    }
    return { previas: previasMap, habilitadas: habilitadasMap };
  }, [edgesVisibles, seleccionada]);

  const nodos = useMemo(
    () =>
      nodosBase.map((n) => {
        if (!seleccionada) return n;
        const esSeleccionada = n.id === seleccionada;
        const tipoPrevia = previas.get(n.id);
        const tipoHabilitada = habilitadas.get(n.id);

        let background = "#faf7f2";
        let opacity = 0.3;
        let border = "1.5px solid #d8d2c6";
        let color = "#2d2a26";

        if (esSeleccionada) {
          background = "#2d2a26";
          opacity = 1;
          border = "1.5px solid #2d2a26";
          color = "#faf7f2";
        } else if (tipoPrevia) {
          // Previa de la seleccionada: distinguimos parcial vs total con el borde.
          opacity = 1;
          background = tipoPrevia === "total" ? "#f3d3c4" : "#d9ead9";
          border = `2px solid ${tipoPrevia === "total" ? COLOR_TOTAL : COLOR_PARCIAL}`;
        } else if (tipoHabilitada) {
          opacity = 1;
          background = "#faf7f2";
          border = `2px dashed ${tipoHabilitada === "total" ? COLOR_TOTAL : COLOR_PARCIAL}`;
        }

        return { ...n, style: { ...n.style, background, opacity, border, color } };
      }),
    [nodosBase, seleccionada, previas, habilitadas]
  );

  return (
    <div style={{ width: "100%", background: "#fdfbf7", borderRadius: 16 }}>
      <div style={{ width: "100%", height: "78vh" }}>
        <ReactFlow
          nodes={nodos}
          edges={edgesVisibles}
          onNodeClick={handleNodeClick}
          onPaneClick={handlePaneClick}
          fitView
          fitViewOptions={{ padding: 0.1 }}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          panOnDrag={false}
          panOnScroll={false}
          zoomOnScroll={false}
          zoomOnPinch={false}
          zoomOnDoubleClick={false}
          preventScrolling={false}
          proOptions={{ hideAttribution: true }}
        />
      </div>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 20,
          padding: "14px 4px",
          fontSize: 13,
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <span>
          <span style={{ display: "inline-block", width: 12, height: 12, background: "#2d2a26", borderRadius: 3, marginRight: 6 }} />
          Materia seleccionada
        </span>
        <span>
          <span style={{ display: "inline-block", width: 12, height: 12, background: "#f3d3c4", border: `2px solid ${COLOR_TOTAL}`, borderRadius: 3, marginRight: 6 }} />
          Previa con crédito total requerido
        </span>
        <span>
          <span style={{ display: "inline-block", width: 12, height: 12, background: "#d9ead9", border: `2px solid ${COLOR_PARCIAL}`, borderRadius: 3, marginRight: 6 }} />
          Previa con crédito parcial requerido
        </span>
        <span>
          <span style={{ display: "inline-block", width: 12, height: 12, background: "#faf7f2", border: `2px dashed ${COLOR_TOTAL}`, borderRadius: 3, marginRight: 6 }} />
          Materia que desbloqueás
        </span>
      </div>
    </div>
  );
}