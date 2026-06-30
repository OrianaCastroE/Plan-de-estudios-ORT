import { materias, materiasPorId } from "./materias";

// Dado un id de materia, devuelve el set de materias que son prerequisito
// (directo o indirecto) — "lo que necesito para llegar acá".
export function obtenerAncestros(id: string): Set<string> {
  const resultado = new Set<string>();
  const pila = [id];
  while (pila.length) {
    const actual = pila.pop()!;
    const materia = materiasPorId.get(actual);
    if (!materia) continue;
    for (const req of materia.requisitos) {
      if (!resultado.has(req.materiaId)) {
        resultado.add(req.materiaId);
        pila.push(req.materiaId);
      }
    }
  }
  return resultado;
}

// Dado un id de materia, devuelve el set de materias que esta habilita
// (directa o indirectamente) — "lo que desbloqueo cursando esto".
export function obtenerDescendientes(id: string): Set<string> {
  const resultado = new Set<string>();
  const pila = [id];
  while (pila.length) {
    const actual = pila.pop()!;
    for (const m of materias) {
      if (m.requisitos.some((r) => r.materiaId === actual) && !resultado.has(m.id)) {
        resultado.add(m.id);
        pila.push(m.id);
      }
    }
  }
  return resultado;
}
