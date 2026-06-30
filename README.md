# Plan de Estudios — Ingeniería en Sistemas (ORT)

Visualización interactiva del plan de estudios como grafo de prerequisitos.
Clickeá una materia para ver qué necesitás (créditos parcial/total) y qué te
habilita cursar.

## Stack

- React + TypeScript + Vite
- Tailwind CSS v4
- React Flow (visualización del grafo)
- Deploy automático a GitHub Pages vía GitHub Actions

## Desarrollo local

```bash
npm install
npm run dev
```

## Estructura

```
src/
  data/
    materias.ts   # dataset: materias, semestre, requisitos
    grafo.ts       # lógica para calcular ancestros/descendientes
  components/
    PlanGrafo.tsx   # componente del grafo (React Flow)
  App.tsx
```

## Pendiente importante

El dataset en `src/data/materias.ts` actualmente solo cubre Primer y
Segundo año como prueba de concepto, y los requisitos (parcial/total)
fueron completados a modo de ejemplo: hay que revisarlos contra el plan
oficial (PDF de la facultad) antes de confiar en ellos. Pasos siguientes:

1. Completar el dataset con 3o, 4o y 5o anio.
2. Verificar cada requisito de credito parcial/total contra el plan oficial.
3. (Opcional) Sumar un selector de "materias cursadas" que resalte
   automaticamente que queda habilitado.

## Deploy

Cada push a `main` dispara el workflow en `.github/workflows/deploy.yml`
que buildea y publica en GitHub Pages. Hay que habilitar Pages en
Settings -> Pages -> Source: GitHub Actions, una sola vez.

Si el repo se llama distinto a `plan-de-estudios-ort`, actualizar el `base`
en `vite.config.ts` para que coincida con el nombre del repo.
