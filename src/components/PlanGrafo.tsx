import { useCallback, useMemo, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  type Edge,
  type Node,
  MarkerType,
  Position,
} from "reactflow";
import "reactflow/dist/style.css";
import { materias } from "../data/materias";
import { obtenerAncestros, obtenerDescendientes } from "../data/grafo";

const ANCHO_COL = 230;
const ALTO_FILA = 90;

function construirLayout(): Node[] {
  // Agrupa por semestre para ubicar cada materia en su columna,
  // y apila verticalmente las materias de un mismo semestre.
  const contadorPorSemestre: Record<number, number> = {};
  return materias.map((m) => {
    const fila = contadorPorSemestre[m.semestre] ?? 0;
    contadorPorSemestre[m.semestre] = fila + 1;
    return {
      id: m.id,
      data: { label: m.nombre },
      position: { x: m.semestre * ANCHO_COL, y: fila * ALTO_FILA },
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
      style: {
        borderRadius: 10,
        border: "1.5px solid #2d2a26",
        background: "#faf7f2",
        color: "#2d2a26",
        fontFamily: "system-ui, sans-serif",
        fontSize: 12,
        fontWeight: 600,
        width: 200,
        padding: "10px 12px",
        textAlign: "center" as const,
        cursor: "pointer",
      },
    };
  });
}

function construirEdges(): Edge[] {
  const edges: Edge[] = [];
  for (const m of materias) {
    for (const req of m.requisitos) {
      edges.push({
        id: `${req.materiaId}->${m.id}`,
        source: req.materiaId,
        target: m.id,
        style: {
          stroke: req.tipo === "total" ? "#b5482a" : "#c9a55a",
          strokeWidth: req.tipo === "total" ? 2 : 1.5,
          strokeDasharray: req.tipo === "parcial" ? "5 4" : undefined,
        },
        markerEnd: { type: MarkerType.ArrowClosed, color: req.tipo === "total" ? "#b5482a" : "#c9a55a" },
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

  const { ancestros, descendientes } = useMemo(() => {
    if (!seleccionada) return { ancestros: new Set<string>(), descendientes: new Set<string>() };
    return {
      ancestros: obtenerAncestros(seleccionada),
      descendientes: obtenerDescendientes(seleccionada),
    };
  }, [seleccionada]);

  const nodos = useMemo(
    () =>
      nodosBase.map((n) => {
        if (!seleccionada) return n;
        const esSeleccionada = n.id === seleccionada;
        const esRequisito = ancestros.has(n.id);
        const esHabilitada = descendientes.has(n.id);
        let background = "#faf7f2";
        let opacity = 0.35;
        let border = "1.5px solid #d8d2c6";
        if (esSeleccionada) {
          background = "#2d2a26";
          opacity = 1;
          border = "1.5px solid #2d2a26";
        } else if (esRequisito) {
          background = "#f0d9a8";
          opacity = 1;
          border = "1.5px solid #c9a55a";
        } else if (esHabilitada) {
          background = "#f3c9b8";
          opacity = 1;
          border = "1.5px solid #b5482a";
        }
        return {
          ...n,
          style: {
            ...n.style,
            background,
            opacity,
            border,
            color: esSeleccionada ? "#faf7f2" : "#2d2a26",
          },
        };
      }),
    [nodosBase, seleccionada, ancestros, descendientes]
  );

  return (
    <div style={{ width: "100%", height: "70vh", background: "#fdfbf7", borderRadius: 16 }}>
      <ReactFlow
        nodes={nodos}
        edges={edgesBase}
        onNodeClick={handleNodeClick}
        fitView
        nodesDraggable={false}
        nodesConnectable={false}
      >
        <Background color="#e5dfd2" gap={20} />
        <Controls />
      </ReactFlow>
      <div style={{ display: "flex", gap: 20, padding: "12px 4px", fontSize: 13, fontFamily: "system-ui, sans-serif" }}>
        <span><span style={{ display: "inline-block", width: 12, height: 12, background: "#2d2a26", borderRadius: 3, marginRight: 6 }} />Seleccionada</span>
        <span><span style={{ display: "inline-block", width: 12, height: 12, background: "#f0d9a8", border: "1px solid #c9a55a", borderRadius: 3, marginRight: 6 }} />Requisito (lo que necesitás)</span>
        <span><span style={{ display: "inline-block", width: 12, height: 12, background: "#f3c9b8", border: "1px solid #b5482a", borderRadius: 3, marginRight: 6 }} />Habilita (lo que desbloqueás)</span>
      </div>
    </div>
  );
}
