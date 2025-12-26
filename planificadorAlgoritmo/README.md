# Microservicio de Planificación Académica (OR-Tools)

Este microservicio implementa el **algoritmo de planificación académica** de la aplicación web, encargándose de distribuir tareas de forma óptima en el calendario del usuario utilizando **Google OR-Tools**.

Su objetivo principal es **equilibrar la carga diaria de trabajo**, priorizar la **cercanía temporal a las clases relacionadas con cada tarea** y respetar las **restricciones de disponibilidad del usuario**, fechas límite y eventos ya existentes.

---

## 📌 Responsabilidad del microservicio

Este servicio **no gestiona usuarios, vistas ni persistencia**.  
Únicamente:

- Recibe información estructurada sobre:
  - Horario académico
  - Tareas pendientes
  - Disponibilidad del usuario
  - Eventos existentes
- Ejecuta el algoritmo de planificación
- Devuelve una planificación óptima o factible

---

## ⚙️ Tecnologías utilizadas

- **Python 3.11**
- **Google OR-Tools**
- **FastAPI** (API REST)
- **Docker**

---

## 🧠 Modelo del problema de planificación

El algoritmo se formula como un **problema de optimización con restricciones**, donde:

### Variables principales

- Bloques de tiempo asignados a tareas
- Día y franja horaria en la que se ejecuta cada tarea

### Restricciones

- No solapamiento con:
  - Clases
  - Eventos existentes
- Respeto de:
  - Disponibilidad del usuario
  - Fecha límite de cada tarea
- Duración total asignada ≥ duración estimada de la tarea
- Las tareas pueden dividirse en varios bloques (si se permite)

### Función objetivo (a minimizar)

- Desviación de la carga diaria (evitar picos)
- Distancia temporal entre la tarea y la última clase de su asignatura
- Penalización por uso de días cercanos a la fecha límite
- Penalización por recalcular tareas ya fijadas (si aplica)

---

## 🔄 Modos de planificación soportados

El microservicio soporta dos modos de ejecución:

### 1️⃣ Replanificación completa

- Se ignora la planificación previa
- Se recalcula todo el calendario desde cero
- Recomendado cuando:
  - Cambia la disponibilidad
  - Hay errores grandes en la estimación
  - Se incumplen tareas

### 2️⃣ Planificación incremental

- Se mantiene la planificación existente
- Solo se insertan las nuevas tareas
- No se modifican tareas ya asignadas

---

## 📥 Entrada del microservicio

La API espera un JSON con la siguiente información (resumen):

### Datos principales

- **Calendario académico**
  - Clases (asignatura, día, hora inicio/fin)
- **Tareas**
  - Nombre
  - Asignatura
  - Duración estimada (en minutos)
  - Fecha límite
- **Disponibilidad del usuario**
  - Franjas horarias semanales
- **Eventos existentes**
  - Bloques ocupados no modificables
- **Configuración**
  - Modo de planificación

> [!Warning] 
> El microservicio asume que los datos ya vienen validados semánticamente desde el backend principal.

---

## 📤 Salida

El servicio devuelve:

- Lista de tareas planificadas
- Para cada tarea, una lista con periodos de estudio.
- En cada periodo de estudio:
  - Día
  - Hora de inicio
  - Hora de fin
  - Identificador de tarea

> [!Note] Periodo de estudio
> Un periodo de estudio se refiere al intervalo de tiempo en el que se supone que el usuario estudiará. Un ejemplo de esto sería: `15-1-2025; 18:00; 20:00; 1`, en el que `1` es el identificador de la tarea que se va a realizar en ese día y hora.
