# 📚 Planificador Académico Inteligente

Planificador Académico Inteligente es una **aplicación web** desarrollada como **Trabajo de Fin de Grado (TFG)** cuyo objetivo es ayudar a estudiantes universitarios a **organizar y distribuir su carga de trabajo de forma equilibrada**, evitando picos de estrés en épocas de exámenes, entregas y evaluaciones.

La aplicación genera automáticamente una planificación óptima de tareas teniendo en cuenta el **horario académico del estudiante**, la **cercanía temporal a las clases** y la **disponibilidad horaria personal** del usuario.

---

## 🚀 Características principales

- 📅 **Vista tipo Google Calendar**  
  Calendario central con el horario del usuario y las tareas planificadas automáticamente.

- 🧠 **Planificación inteligente de tareas**  
  Distribución homogénea de la carga de trabajo diaria, priorizando fechas cercanas a las últimas clases relacionadas con cada asignatura.

- 🏫 **Importación automática del horario universitario (UO)**  
  Configuración inicial para importar el horario desde el sistema de la universidad y detectar automáticamente las asignaturas cursadas.

- 📄 **Importación de horarios desde CSV**  
  Posibilidad de cargar horarios previamente creados mediante archivos CSV.

- ➕ **Creación y gestión de tareas y eventos**
  - Tareas puntuales o periódicas  
  - Edición y eliminación de eventos  
  - Asociación de cada tarea a una asignatura concreta

- 📝 **Información detallada de cada tarea**
  - Nombre de la tarea  
  - Asignatura asociada  
  - Duración estimada  
  - Fecha límite de entrega  

- 🔁 **Replanificación flexible**
  - Recalcular todo el plan si el usuario no está satisfecho  
  - Mantener la planificación existente al añadir nuevas tareas (opcional)

- ⏰ **Configuración de disponibilidad horaria**
  El usuario puede definir las franjas horarias en las que está dispuesto a trabajar.

- 📊 **Ajuste dinámico del plan**
  - Corrección de errores en la estimación de duración  
  - Replanificación automática si una tarea no se cumple  

---

## 🧩 ¿Cómo funciona?

1. El usuario importa su **horario académico** (desde la UO o un CSV).
2. La aplicación identifica las **asignaturas** cursadas.
3. El usuario define su **disponibilidad horaria**.
4. Se crean tareas indicando:
   - Asignatura
   - Duración estimada
   - Fecha límite
5. El sistema genera una **planificación equilibrada**, priorizando la cercanía a las clases relacionadas.
6. Si cambian las condiciones (errores de estimación, tareas no completadas), el plan se **recalcula automáticamente**.

---

## 🌐 Uso de la aplicación

La aplicación está disponible **exclusivamente como aplicación web**, desplegada en un servidor.
> [!Note]
> La versión móvil o instalación local no entra en el alcance del TFG, pero es posible como idea a futuro.

---

## 🛠️ Estado del proyecto

🚧 En desarrollo / en fase de prototipo académico  
Algunas funcionalidades pueden estar sujetas a cambios o mejoras futuras.

---

## ✨ Autor

Desarrollado por **David Pedregal Ribas**  
Trabajo de Fin de Grado – Universidad de Oviedo - Escuela de Ingeniería Informática