// Modelo de datos del plan de estudios de Ingeniería en Sistemas / Software (ORT)
// Cada materia otorga créditos (parciales o totales) que habilitan cursar otras.

export type TipoCredito = "parcial" | "total";

export interface Requisito {
  materiaId: string;
  tipo: TipoCredito; // qué tipo de crédito exige esa materia previa
}

export interface Materia {
  id: string;
  nombre: string;
  anio: 1 | 2 | 3 | 4 | 5;
  semestre: number; // 1 a 10
  requisitos: Requisito[]; // materias que deben acreditarse (parcial o total) para cursar esta
}

// NOTA: este es un dataset inicial de ejemplo (Primer y Segundo año) para validar
// el modelo y el grafo. Lo vamos a completar juntos con el plan completo después,
// idealmente revisando contra el PDF oficial del plan para no errar ningún requisito.

export const materias: Materia[] = [
  // ---- Primer año / Primer semestre (sin requisitos) ----
  { id: "tt1", nombre: "Taller de Tecnologías 1", anio: 1, semestre: 1, requisitos: [] },
  { id: "prog1", nombre: "Programación 1", anio: 1, semestre: 1, requisitos: [] },
  { id: "algebra", nombre: "Álgebra Lineal", anio: 1, semestre: 1, requisitos: [] },
  { id: "calculo1", nombre: "Cálculo en una Variable", anio: 1, semestre: 1, requisitos: [] },

  // ---- Primer año / Segundo semestre ----
  {
    id: "fcomp",
    nombre: "Fundamentos de Computación",
    anio: 1,
    semestre: 2,
    requisitos: [{ materiaId: "prog1", tipo: "total" }],
  },
  {
    id: "prog2",
    nombre: "Programación 2",
    anio: 1,
    semestre: 2,
    requisitos: [{ materiaId: "prog1", tipo: "total" }],
  },
  {
    id: "matdisc",
    nombre: "Matemática Discreta",
    anio: 1,
    semestre: 2,
    requisitos: [{ materiaId: "algebra", tipo: "parcial" }],
  },
  {
    id: "fsc",
    nombre: "Fundamentos de Sistemas Ciberfísicos",
    anio: 1,
    semestre: 2,
    requisitos: [{ materiaId: "calculo1", tipo: "parcial" }],
  },

  // ---- Segundo año / Tercer semestre ----
  {
    id: "logica",
    nombre: "Lógica para Computación",
    anio: 2,
    semestre: 3,
    requisitos: [{ materiaId: "matdisc", tipo: "total" }],
  },
  {
    id: "eda1",
    nombre: "Estructuras de Datos y Algoritmos 1",
    anio: 2,
    semestre: 3,
    requisitos: [
      { materiaId: "prog2", tipo: "total" },
      { materiaId: "matdisc", tipo: "parcial" },
    ],
  },
  {
    id: "arqsist",
    nombre: "Arquitectura de Sistemas",
    anio: 2,
    semestre: 3,
    requisitos: [{ materiaId: "fcomp", tipo: "total" }],
  },
  {
    id: "probest",
    nombre: "Probabilidad y Estadística",
    anio: 2,
    semestre: 3,
    requisitos: [{ materiaId: "calculo1", tipo: "total" }],
  },

  // ---- Segundo año / Cuarto semestre ----
  {
    id: "fis",
    nombre: "Fundamentos de Ingeniería de Software",
    anio: 2,
    semestre: 4,
    requisitos: [{ materiaId: "prog2", tipo: "total" }],
  },
  {
    id: "eda2",
    nombre: "Estructuras de Datos y Algoritmos 2",
    anio: 2,
    semestre: 4,
    requisitos: [{ materiaId: "eda1", tipo: "total" }],
  },
  {
    id: "bd1",
    nombre: "Bases de Datos 1",
    anio: 2,
    semestre: 4,
    requisitos: [{ materiaId: "prog2", tipo: "total" }],
  },
  {
    id: "so",
    nombre: "Sistemas Operativos",
    anio: 2,
    semestre: 4,
    requisitos: [{ materiaId: "arqsist", tipo: "total" }],
  },
];

export const materiasPorId = new Map(materias.map((m) => [m.id, m]));
