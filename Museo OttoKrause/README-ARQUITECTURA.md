# Arquitectura de la Aplicación: Museo Tecnológico Eduardo Latzina

Bienvenido al repositorio oficial del **Museo Tecnológico Ing. Eduardo Latzina**. Este documento es la guía definitiva para el onboarding de cualquier desarrollador que se integre al equipo. Define la arquitectura del proyecto desde cero, asegurando el cumplimiento de **principios SOLID** y la separación estricta de responsabilidades (Frontend y Backend).

> [!IMPORTANT]
> **Aviso para Desarrolladores:** No modifiques esta arquitectura estructural sin consultar previamente al Arquitecto de Software. El patrón MVC estricto se utiliza tanto en el backend como en el frontend para asegurar escalabilidad a futuro.

## 1. Visión General del Sistema

El proyecto está dividido físicamente en dos grandes carpetas que funcionan de forma independiente pero se comunican mediante una API REST:
- **`museo_web/`**: Aplicación de Frontend creada con React y Vite.
- **`museo_api/`**: API de Backend construida en PHP (Vanilla OOP).

Esta separación (Decoupled Architecture) permite que los equipos de Frontend y Backend puedan trabajar en paralelo sin pisarse el código.

---

## 2. Frontend: `museo_web` (React + Vite)

El frontend está estructurado aplicando una **Arquitectura basada en Componentes y Capas Lógicas**, la cual es una interpretación moderna del Modelo-Vista-Controlador en React.

### Estructura de Directorios

```text
museo_web/src/
├── components/          (VISTAS PARCIALES)
│   ├── common/          -> Componentes reusables "tontos" (Navbar, Layout, Botones). No manejan estado global ni lógica pesada.
│   └── specific/        -> Componentes de dominio (Listas de Vitrinas, Tablas de Inventario). Reciben la data a través de props.
├── contexts/            (MODELOS / ESTADO GLOBAL)
│   └── AuthContext.jsx  -> Manejo de estado que cruza múltiples páginas (Usuario logueado, tokens).
├── hooks/               (CONTROLADORES REACTIVOS)
│   ├── useVisitas.js    -> Custom Hooks. Aquí reside la lógica de negocio (traer data, setear estado de carga, errores).
│   └── useVitrinas.js
├── models/              (TIPADOS / CONTRATOS)
│   └── types.js         -> Definiciones JSDoc o esquemas que garantizan que el Frontend espera la misma estructura que el DB Model (ej. VisitaProgramada).
├── pages/               (VISTAS PRINCIPALES)
│   ├── Home.jsx         -> Orquestadores que importan a los `components` y le inyectan los datos de los `hooks`.
│   ├── Inventario.jsx
│   └── ...
└── services/            (SERVICIOS / API CAPA EXTERNA)
    ├── api.service.js   -> Funciones puras (fetch/axios) para aislar las llamadas al Backend (Single Responsibility Principle).
    └── visitas.service.js
```

### Flujo de Trabajo (MVC en React)
1. **La Vista (Page/Component)** se renderiza y llama a un **Controlador (Hook)**. Por ejemplo: `Inventario.jsx` llama a `const { data } = useObjetos()`.
2. El **Controlador (Hook)** solicita la información al **Servicio (`services/objetos.service.js`)**.
3. El **Servicio** hace el fetch contra la URL en `museo_api`.
4. El dato retornado debe coincidir con el contrato estipulado en **`models/types.js`**.

---

## 3. Backend: `museo_api` (PHP Vanilla MVC)

El backend está diseñado como una API RESTful sin frameworks pesados, optimizado para alto rendimiento y aplicando Orientación a Objetos estricta.

### Estructura de Directorios

```text
museo_api/
├── config/              (CONFIGURACIONES BASE)
│   └── database.php     -> Clase genérica conectora usando PDO. Solo gestiona la conexión (SRP).
├── controllers/         (CONTROLADORES)
│   ├── ObjetosController.php
│   ├── VisitasController.php
│   └── ...              -> Reciben el request, instancian el modelo correspondiente, ejecutan lógica y devuelven un JSON.
├── models/              (MODELOS / ENTIDADES)
│   ├── Objeto.php       -> Representación en código de la tabla `OBJETOS`.
│   ├── Visita.php       -> Representación de `VISITAS_PROGRAMADAS`.
│   └── ...              -> Aquí van los queries de SQL puramente (Select, Insert, Update, Delete).
├── routes/              (RUTEO DE LA API)
│   └── api.php          -> Se encarga de mapear `/api/visitas` hacia el `VisitasController`.
├── index.php            (FRONT CONTROLLER)
└── .htaccess            (REDIRECCIONAMIENTOS)
```

### Correspondencia con el Modelo de Datos (DB)

De acuerdo al esquema relacional de la base de datos (con módulos como *Ubicación*, *Inventario*, *Visitas*, etc.), hemos generado los Modelos y Controladores base. 
**Regla de Oro:** Por cada tabla principal en la BD (ej. `VITRINAS`, `OBJETOS`, `USUARIOS`), existe **UN archivo en `models/` y UN archivo en `controllers/`**.

* Ejemplo de correspondencia:
  * Tabla BD: `VISITAS_PROGRAMADAS`
  * Modelo PHP: `museo_api/models/Visita.php`
  * Controlador PHP: `museo_api/controllers/VisitasController.php`
  * Endpoint REST: `GET /museo_api/visitas`

### Flujo de Trabajo (MVC PHP)
1. Una petición llega (gracias a `.htaccess`) a **`index.php`**.
2. **`index.php`** carga la conexión a BD y le delega el path a **`routes/api.php`**.
3. **`api.php`** identifica el endpoint (ej. `GET /objetos/5`) y llama a `ObjetosController->getById(5)`.
4. El **Controlador** usa la clase **`Objeto.php`** para hacer el Select a la BD.
5. Los datos se envían de vuelta al Frontend en formato JSON.

---

## 4. Estándares y SOLID

Para todos los miembros del equipo, por favor sigan estos principios en este código base:

- **S - Principio de Responsabilidad Única:** Un archivo de React en `components/` solo dibuja UI. No hace fetches a la DB. Usa `services/`.
- **O - Abierto para Extensión, Cerrado para Modificación:** Extiendan las funcionalidades creando nuevos controladores o componentes, eviten modificar los archivos base (como el core `database.php` o `api.service.js` genérico) al menos que sea absolutamente necesario.
- **D - Inversión de Dependencias:** En PHP, fíjense que los Modelos reciben la variable `$db` por inyección de dependencias en el constructor, en vez de crear la conexión ellos mismos.

¡Feliz código! La estructura está lista para empezar a llenar los endpoints y la UI.
