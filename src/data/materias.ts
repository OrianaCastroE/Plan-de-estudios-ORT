// Modelo de datos del plan de estudios de Ingeniería en Sistemas / Software (ORT)
// Cada materia otorga créditos (parciales o totales) que habilitan cursar otras.
// Datos cargados a partir del sistema oficial de previas de la facultad
// (no inventados), revisados materia por materia.

export type TipoCredito = "parcial" | "total";

export interface Requisito {
  // Una previa apunta A UNA materia puntual (materiaId) O A UN GRUPO de
  // alternativas (grupoId) — nunca ambas. Si apunta a un grupo, se resuelve
  // contra la opción que la persona haya elegido para ese casillero (ver
  // PlanGrafo.tsx / selección de grupo).
  materiaId?: string;
  grupoId?: string;
  tipo: TipoCredito; // qué tipo de crédito exige esa previa
}

export interface Materia {
  id: string;
  nombre: string;
  anio: 1 | 2 | 3 | 4 | 5;
  semestre: number; // 1 a 10
  requisitos: Requisito[]; // materias que deben acreditarse (parcial o total) para cursar esta
  soloTotal?: boolean; // true si la materia no tiene estado "parcial" (solo se puede aprobar o no)
  // Si la materia es una de varias ALTERNATIVAS dentro del mismo casillero del
  // plan (ej. "Álgebra 2" vs "Cálculo 2"), todas comparten este id de grupo.
  // El semestre las muestra como UNA sola caja con un lápiz para elegir cuál.
  grupo?: string;
  exoneracion?: 70 | 86; // nota mínima para exonerar el examen final
}

// Metadata de cada grupo de alternativas: nombre del "casillero" tal como
// figura en el plan oficial, y en qué semestre/año se ubica.
export interface GrupoInfo {
  id: string;
  nombreCasillero: string;
  anio: 1 | 2 | 3 | 4 | 5;
  semestre: number;
}

// Hito de titulación de la carrera.
// Cuando materiasVerificadas no es null, la lista está confirmada contra el plan oficial.
// gruposVerificados lista los casilleros con alternativas que también se requieren
// (se resuelve al ID de la opción actualmente elegida).
// Si materiasVerificadas es null se usa semestreCorte como aproximación.
export interface HitoTitulo {
  id: string;
  nombre: string;
  tipo: string;
  despuesDeSemestre: number;
  materiasVerificadas: string[] | null;
  gruposVerificados: string[] | null;
  semestreCorte: number | null;
}

export const grupos: GrupoInfo[] = [
  { id: "mat-sem4", nombreCasillero: "Materia de Matemática", anio: 2, semestre: 4 },
  { id: "ml-sem6", nombreCasillero: "Materia de Sistemas Inteligentes (Machine Learning)", anio: 3, semestre: 6 },
  { id: "innov-sem5", nombreCasillero: "Materia de Innovación y Emprendedurismo", anio: 3, semestre: 5 },
  { id: "bigdata-sem7", nombreCasillero: "Materia de Gestión de la Información (Big Data)", anio: 4, semestre: 7 },
  { id: "lenguajes-sem8", nombreCasillero: "Materia de Lenguajes de Programación", anio: 4, semestre: 8 },
  { id: "nuevastec-sem8", nombreCasillero: "Materia de Nuevas Tecnologías", anio: 4, semestre: 8 },
  { id: "comneg-sem9", nombreCasillero: "Materia de Comunicación y Negociación", anio: 5, semestre: 9 },
];

// NOTA: la única simplificación que queda pendiente es la regla genérica
// "crédito total de N materias del título" (sin importar cuáles) — esa no
// está cargada, solo las previas específicas por materia. Los 3 casilleros
// con alternativas (Matemática, Machine Learning, Comunicación y Negociación)
// SÍ están modelados correctamente con `grupo` / `grupoId` (ver arriba).
//
// OJO al completar el catálogo completo de las electivas que hoy están
// simplificadas a una sola opción (Seguridad Informática, Big Data,
// Lenguajes y Compiladores, Nuevas Tecnologías, Ingeniería de Productos de
// Software): CADA opción del catálogo tiene SUS PROPIAS previas, distintas
// entre sí. No se puede asumir que comparten las mismas — hay que cargar
// las previas reales de cada una por separado cuando se sumen.

export const materias: Materia[] = [
  // ============ PRIMER AÑO ============
  // ---- Semestre 1 (sin previas) ----
  { id: "tt1", nombre: "Taller de Tecnologías 1", anio: 1, semestre: 1, requisitos: [] },
  { id: "prog1", nombre: "Programación 1", anio: 1, semestre: 1, requisitos: [] },
  { id: "algebra", nombre: "Álgebra Lineal", anio: 1, semestre: 1, requisitos: [] },
  { id: "calculo1", nombre: "Cálculo en una Variable", anio: 1, semestre: 1, requisitos: [] },

  // ---- Semestre 2 ----
  { id: "fcomp", nombre: "Fundamentos de Computación", anio: 1, semestre: 2, requisitos: [] },
  {
    id: "prog2",
    nombre: "Programación 2",
    anio: 1,
    semestre: 2,
    requisitos: [{ materiaId: "prog1", tipo: "parcial" }],
  },
  { id: "matdisc", nombre: "Matemática Discreta", anio: 1, semestre: 2, requisitos: [] },
  {
    id: "fsc",
    nombre: "Fundamentos de Sistemas Ciberfísicos",
    anio: 1,
    semestre: 2,
    requisitos: [{ materiaId: "calculo1", tipo: "parcial" }],
  },

  // ============ SEGUNDO AÑO ============
  // ---- Semestre 3 ----
  {
    id: "logica",
    nombre: "Lógica para Computación",
    anio: 2,
    semestre: 3,
    requisitos: [{ materiaId: "fcomp", tipo: "parcial" }],
  },
  {
    id: "eda1",
    nombre: "Estructuras de Datos y Algoritmos 1",
    anio: 2,
    semestre: 3,
    requisitos: [
      { materiaId: "prog2", tipo: "parcial" },
      { materiaId: "fcomp", tipo: "parcial" },
    ],
  },
  { id: "arqsist", nombre: "Arquitectura de Sistemas", anio: 2, semestre: 3, requisitos: [] },
  {
    id: "probest",
    nombre: "Probabilidad y Estadística",
    anio: 2,
    semestre: 3,
    requisitos: [
      { materiaId: "algebra", tipo: "total" },
      { materiaId: "calculo1", tipo: "total" },
    ],
  },

  // ---- Semestre 4 ----
  {
    id: "fis",
    nombre: "Fundamentos de Ingeniería de Software",
    anio: 2,
    semestre: 4,
    requisitos: [{ materiaId: "prog2", tipo: "parcial" }],
  },
  {
    id: "eda2",
    nombre: "Estructuras de Datos y Algoritmos 2",
    anio: 2,
    semestre: 4,
    requisitos: [
      { materiaId: "eda1", tipo: "parcial" },
      { materiaId: "matdisc", tipo: "parcial" },
    ],
  },
  {
    id: "bd1",
    nombre: "Bases de Datos 1",
    anio: 2,
    semestre: 4,
    requisitos: [{ materiaId: "prog2", tipo: "parcial" }],
  },
  {
    id: "so",
    nombre: "Sistemas Operativos",
    anio: 2,
    semestre: 4,
    requisitos: [{ materiaId: "arqsist", tipo: "parcial" }],
  },
  // Materia de Matemática: casillero con 2 alternativas (grupo "mat-sem4").
  {
    id: "algebra2",
    nombre: "Optimización con Álgebra Lineal",
    anio: 2,
    semestre: 4,
    requisitos: [
      { materiaId: "algebra", tipo: "total" },
      { materiaId: "calculo1", tipo: "total" },
    ],
    grupo: "mat-sem4",
  },
  {
    id: "calculo2",
    nombre: "Cálculo en Varias Variables",
    anio: 2,
    semestre: 4,
    requisitos: [{ materiaId: "calculo1", tipo: "parcial" }],
    grupo: "mat-sem4",
  },

  // ============ TERCER AÑO ============
  // ---- Semestre 5 ----
  { id: "admgral", nombre: "Administración General", anio: 3, semestre: 5, requisitos: [] },
  {
    id: "redes",
    nombre: "Redes",
    anio: 3,
    semestre: 5,
    requisitos: [{ materiaId: "so", tipo: "parcial" }],
  },
  {
    id: "bd2",
    nombre: "Bases de Datos 2",
    anio: 3,
    semestre: 5,
    requisitos: [
      { materiaId: "bd1", tipo: "parcial" },
      { materiaId: "logica", tipo: "parcial" },
    ],
  },
  {
    id: "da1",
    nombre: "Diseño de Aplicaciones 1",
    anio: 3,
    semestre: 5,
    requisitos: [
      { materiaId: "eda1", tipo: "parcial" },
      { materiaId: "bd1", tipo: "parcial" },
      { materiaId: "fis", tipo: "parcial" },
    ],
  },
  {
    id: "teoriacomp",
    nombre: "Teoría de la Computación",
    anio: 3,
    semestre: 5,
    requisitos: [
      { materiaId: "eda1", tipo: "parcial" },
      { materiaId: "logica", tipo: "parcial" },
    ],
  },
  // Materia de Innovación y Emprendedurismo: casillero con 2 alternativas
  // con dictado activo (grupo "innov-sem5").
  {
    id: "tallerinnov",
    nombre: "Taller de Innovación y Emprendedurismo",
    anio: 3,
    semestre: 5,
    requisitos: [],
    grupo: "innov-sem5",
  },
  {
    id: "emprendimientos",
    nombre: "Emprendimientos Dinámicos",
    anio: 3,
    semestre: 5,
    // "Al menos 1 de": Administración General, Finanzas, Economía. Solo
    // Administración General está cargada en el dataset (es la única con
    // dictado activo), así que queda como la previa específica.
    requisitos: [{ materiaId: "admgral", tipo: "total" }],
    grupo: "innov-sem5",
  },

  // ---- Semestre 6 ----
  // Materia de Sistemas Inteligentes: casillero con 3 alternativas (grupo
  // "ml-sem6"). Las previas que más adelante aceptan "cualquiera de estas"
  // (Interacción Humano-Computadora, Arquitectura de Software en la Práctica,
  // Proyecto) apuntan al grupo entero, no a una materia fija.
  {
    id: "mlsistemas",
    nombre: "Machine Learning para Sistemas Inteligentes",
    anio: 3,
    semestre: 6,
    requisitos: [
      { materiaId: "eda1", tipo: "total" },
      { materiaId: "probest", tipo: "total" },
    ],
    grupo: "ml-sem6",
  },
  {
    id: "mldatos",
    nombre: "Machine Learning para Análisis de Datos",
    anio: 3,
    semestre: 6,
    requisitos: [
      { materiaId: "eda1", tipo: "total" },
      { materiaId: "probest", tipo: "total" },
    ],
    grupo: "ml-sem6",
  },
  {
    id: "mlsecuencias",
    nombre: "Machine Learning para Análisis de Secuencias",
    anio: 3,
    semestre: 6,
    requisitos: [
      { materiaId: "eda1", tipo: "total" },
      { materiaId: "probest", tipo: "total" },
    ],
    grupo: "ml-sem6",
  },
  {
    id: "progredes",
    nombre: "Programación de Redes",
    anio: 3,
    semestre: 6,
    requisitos: [
      { materiaId: "da1", tipo: "parcial" },
      { materiaId: "so", tipo: "parcial" },
    ],
  },
  {
    id: "tallertec2",
    nombre: "Taller de Tecnologías 2",
    anio: 3,
    semestre: 6,
    requisitos: [
      { materiaId: "eda2", tipo: "total" },
      { materiaId: "bd1", tipo: "total" },
      { materiaId: "redes", tipo: "parcial" },
      { materiaId: "da1", tipo: "parcial" },
      { materiaId: "fsc", tipo: "parcial" },
      { materiaId: "tt1", tipo: "total" },
    ],
  },
  {
    id: "da2",
    nombre: "Diseño de Aplicaciones 2",
    anio: 3,
    semestre: 6,
    requisitos: [
      { materiaId: "da1", tipo: "parcial" },
      { materiaId: "fis", tipo: "parcial" },
    ],
  },
  {
    id: "isagil1",
    nombre: "Ingeniería de Software Ágil 1",
    anio: 3,
    semestre: 6,
    requisitos: [
      { materiaId: "admgral", tipo: "parcial" },
      { materiaId: "da1", tipo: "parcial" },
      { materiaId: "fis", tipo: "parcial" },
    ],
  },

  // ---- Semestre 7 ----
  {
    id: "ia",
    nombre: "Inteligencia Artificial",
    anio: 4,
    semestre: 7,
    requisitos: [
      { materiaId: "eda2", tipo: "parcial" },
      { materiaId: "probest", tipo: "parcial" },
      { materiaId: "logica", tipo: "parcial" },
    ],
  },
  {
    id: "seginfo",
    nombre: "Aspectos de Seguridad de Sistemas Informáticos",
    anio: 4,
    semestre: 7,
    requisitos: [],
  },
  // Materia de Gestión de la Información (Big Data): casillero con 4
  // alternativas con dictado activo (grupo "bigdata-sem7").
  {
    id: "bigdata",
    nombre: "Herramientas de Software para Big Data",
    anio: 4,
    semestre: 7,
    requisitos: [
      { materiaId: "bd2", tipo: "parcial" },
      { materiaId: "da1", tipo: "total" },
      { materiaId: "so", tipo: "total" },
    ],
    grupo: "bigdata-sem7",
  },
  {
    id: "webmining",
    nombre: "Web Mining",
    anio: 4,
    semestre: 7,
    requisitos: [{ materiaId: "bd1", tipo: "total" }],
    grupo: "bigdata-sem7",
  },
  {
    id: "bdnorelacional",
    nombre: "Bases de Datos No Relacionales",
    anio: 4,
    semestre: 7,
    requisitos: [{ materiaId: "bd2", tipo: "total" }],
    grupo: "bigdata-sem7",
  },
  {
    id: "datamining",
    nombre: "Data Mining",
    anio: 4,
    semestre: 7,
    requisitos: [{ materiaId: "bd1", tipo: "total" }],
    grupo: "bigdata-sem7",
  },
  {
    id: "arqsoft",
    nombre: "Arquitectura de Software",
    anio: 4,
    semestre: 7,
    requisitos: [
      { materiaId: "eda2", tipo: "total" },
      { materiaId: "bd2", tipo: "total" },
      { materiaId: "da2", tipo: "parcial" },
      { materiaId: "progredes", tipo: "parcial" },
    ],
  },
  {
    id: "isagil2",
    nombre: "Ingeniería de Software Ágil 2",
    anio: 4,
    semestre: 7,
    requisitos: [
      { materiaId: "da1", tipo: "total" },
      { materiaId: "da2", tipo: "parcial" },
      { materiaId: "progredes", tipo: "parcial" },
      { materiaId: "isagil1", tipo: "parcial" },
    ],
  },
  { id: "comliderazgo", nombre: "Comunicación y Liderazgo", anio: 4, semestre: 7, requisitos: [] },

  // ---- Semestre 8 ----
  // Materia de Lenguajes de Programación: casillero con 3 alternativas con
  // dictado activo (grupo "lenguajes-sem8").
  {
    id: "lenguajes",
    nombre: "Lenguajes y Compiladores",
    anio: 4,
    semestre: 8,
    requisitos: [
      { materiaId: "eda1", tipo: "parcial" },
      { materiaId: "logica", tipo: "parcial" },
    ],
    grupo: "lenguajes-sem8",
  },
  {
    id: "paralelosdist",
    nombre: "Programación y Análisis de Sistemas Paralelos y Distribuidos",
    anio: 4,
    semestre: 8,
    requisitos: [{ materiaId: "eda1", tipo: "total" }],
    grupo: "lenguajes-sem8",
  },
  {
    id: "funcionalavanzada",
    nombre: "Programación Funcional Avanzada",
    anio: 4,
    semestre: 8,
    requisitos: [
      { materiaId: "eda1", tipo: "parcial" },
      { materiaId: "logica", tipo: "parcial" },
    ],
    grupo: "lenguajes-sem8",
  },
  {
    id: "trabajointegrador",
    nombre: "Trabajo Integrador",
    anio: 4,
    semestre: 8,
    requisitos: [
      { materiaId: "bd2", tipo: "total" },
      { materiaId: "da2", tipo: "parcial" },
      { materiaId: "teoriacomp", tipo: "parcial" },
      { materiaId: "progredes", tipo: "parcial" },
      { materiaId: "isagil1", tipo: "parcial" },
    ],
  },
  // Materia de Nuevas Tecnologías: casillero con 2 alternativas con dictado
  // activo (grupo "nuevastec-sem8").
  {
    id: "ihc",
    nombre: "Interacción Humano-Computadora",
    anio: 4,
    semestre: 8,
    requisitos: [
      { grupoId: "ml-sem6", tipo: "parcial" },
      { materiaId: "da2", tipo: "parcial" },
    ],
    grupo: "nuevastec-sem8",
  },
  {
    id: "disenousuario",
    nombre: "Diseño Centrado en el Usuario",
    anio: 4,
    semestre: 8,
    requisitos: [
      { grupoId: "ml-sem6", tipo: "parcial" },
      { materiaId: "da2", tipo: "parcial" },
    ],
    grupo: "nuevastec-sem8",
  },
  {
    id: "arqsoftpractica",
    nombre: "Arquitectura de Software en la Práctica",
    anio: 4,
    semestre: 8,
    requisitos: [
      { materiaId: "arqsoft", tipo: "parcial" },
      { materiaId: "progredes", tipo: "parcial" },
      { materiaId: "isagil2", tipo: "parcial" },
      { grupoId: "ml-sem6", tipo: "total" },
    ],
  },
  {
    id: "devprodbasetec",
    nombre: "Desarrollo de Productos de Base Tecnológica",
    anio: 4,
    semestre: 8,
    requisitos: [
      { materiaId: "da2", tipo: "parcial" },
      { materiaId: "progredes", tipo: "parcial" },
      { materiaId: "isagil1", tipo: "parcial" },
    ],
  },

  // ============ QUINTO AÑO ============
  // ---- Semestre 9 ----
  // Materia de Comunicación y Negociación (la segunda): casillero con 2
  // alternativas (grupo "comneg-sem9").
  {
    id: "habgerencial",
    nombre: "Habilidades Gerenciales en Grupos de Proyectos",
    anio: 5,
    semestre: 9,
    requisitos: [
      { materiaId: "comliderazgo", tipo: "total" },
      { materiaId: "isagil1", tipo: "parcial" },
    ],
    grupo: "comneg-sem9",
  },
  { id: "recursoshumanos", nombre: "Recursos Humanos", anio: 5, semestre: 9, requisitos: [], grupo: "comneg-sem9" },
  { id: "electiva1", nombre: "Electiva 1 (a definir)", anio: 5, semestre: 9, requisitos: [] },

  // ---- Semestre 10 ----
  { id: "electiva2", nombre: "Electiva 2 (a definir)", anio: 5, semestre: 10, requisitos: [] },
  { id: "electiva3", nombre: "Electiva 3 (a definir)", anio: 5, semestre: 10, requisitos: [] },
  {
    id: "proyecto",
    nombre: "Proyecto",
    anio: 5,
    semestre: 10,
    requisitos: [
      { materiaId: "arqsoft", tipo: "parcial" },
      { materiaId: "ia", tipo: "parcial" },
      { materiaId: "isagil2", tipo: "parcial" },
      { materiaId: "tallertec2", tipo: "total" },
      { grupoId: "bigdata-sem7", tipo: "parcial" },
      { materiaId: "seginfo", tipo: "parcial" },
      { grupoId: "innov-sem5", tipo: "total" },
      { materiaId: "trabajointegrador", tipo: "total" },
      { grupoId: "ml-sem6", tipo: "parcial" },
    ],
  },
];

export const materiasPorId = new Map(materias.map((m) => [m.id, m]));

export const hitos: HitoTitulo[] = [
  {
    id: "ayudante-ingeniero",
    nombre: "Ayudante de Ingeniero en Sistemas",
    tipo: "Título Intermedio",
    despuesDeSemestre: 5,
    // Lista verificada contra el certificado de escolaridad oficial.
    // bd2, da1 y redes son semestre 5 en el dataset, de ahí que el hito
    // se muestre después del semestre 5.
    materiasVerificadas: [
      "prog1", "tt1", "fcomp", "matdisc", "prog2", "arqsist",
      "eda1", "logica", "bd1", "eda2", "fis", "so", "bd2", "da1", "redes",
    ],
    gruposVerificados: null,
    semestreCorte: null,
  },
  {
    id: "licenciado",
    nombre: "Licenciado en Ingeniería de Software",
    tipo: "Título",
    despuesDeSemestre: 8,
    // Lista construida a partir del plan oficial (imagen del plan de estudios).
    // admgral = "Materia de Ciencias Sociales" del plan oficial (confirmar si cambia).
    // comliderazgo = "Materia de Comunicación y Negociación" que aparece entre
    // sem V y VI en el plan (en el dataset está modelada en sem 7).
    materiasVerificadas: [
      // Sem 1
      "tt1", "prog1", "algebra", "calculo1",
      // Sem 2
      "fcomp", "prog2", "matdisc", "fsc",
      // Sem 3
      "logica", "eda1", "arqsist", "probest",
      // Sem 4
      "fis", "eda2", "bd1", "so",
      // Sem 5
      "teoriacomp", "da1", "bd2", "redes", "admgral",
      // Sem 6
      "isagil1", "da2", "tallertec2", "progredes",
      // Sem 7
      "isagil2", "arqsoft", "seginfo", "ia", "comliderazgo",
      // Sem 8
      "devprodbasetec", "arqsoftpractica", "trabajointegrador",
    ],
    // Casilleros con alternativas requeridos (se resuelve al elegido actualmente)
    gruposVerificados: [
      "mat-sem4",      // Materia de Matemática
      "innov-sem5",    // Materia de Innovación y Emprendedurismo
      "ml-sem6",       // Materia de Sistemas Inteligentes (Machine Learning)
      "bigdata-sem7",  // Materia de Gestión de la Información (Big Data)
      "nuevastec-sem8", // Materia de Nuevas Tecnologías
      "lenguajes-sem8", // Materia de Lenguajes de Programación
    ],
    semestreCorte: null,
  },
  {
    id: "ingeniero",
    nombre: "Ingeniero en Sistemas",
    tipo: "Título Final",
    despuesDeSemestre: 10,
    // Todo lo del Licenciado + Proyecto + casillero Comunicación y Negociación (sem 9).
    // Electivas excluidas porque aún no están definidas.
    materiasVerificadas: [
      // Sem 1
      "tt1", "prog1", "algebra", "calculo1",
      // Sem 2
      "fcomp", "prog2", "matdisc", "fsc",
      // Sem 3
      "logica", "eda1", "arqsist", "probest",
      // Sem 4
      "fis", "eda2", "bd1", "so",
      // Sem 5
      "teoriacomp", "da1", "bd2", "redes", "admgral",
      // Sem 6
      "isagil1", "da2", "tallertec2", "progredes",
      // Sem 7
      "isagil2", "arqsoft", "seginfo", "ia", "comliderazgo",
      // Sem 8
      "devprodbasetec", "arqsoftpractica", "trabajointegrador",
      // Sem 9
      "electiva1",
      // Sem 10
      "electiva2", "electiva3", "proyecto",
    ],
    gruposVerificados: [
      "mat-sem4",
      "innov-sem5",
      "ml-sem6",
      "bigdata-sem7",
      "nuevastec-sem8",
      "lenguajes-sem8",
      "comneg-sem9",   // Materia de Comunicación y Negociación (sem 9)
    ],
    semestreCorte: null,
  },
];