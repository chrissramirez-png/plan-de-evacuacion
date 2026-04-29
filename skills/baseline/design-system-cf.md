# Design System ComunidadFeliz — Innovation Hub

Regla obligatoria. Claude Code debe seguir estas especificaciones para toda interfaz visual.

---

## Principios

- Cercana, alegre y resolutiva
- Claridad, exactitud, proximidad
- Lenguaje inclusivo siempre
- CTAs: máximo 3 palabras, descriptivos, no imperativos
- Máximo 1 botón primario por vista
- Nunca colores fuera de esta paleta
- Nunca fuentes distintas a Montserrat
- Nunca border-radius mayor a 8px en cards
- Nunca texto claro sobre fondo claro (siempre verificar contraste)

---

## Tipografía

Familia única: Montserrat (Google Fonts)

```
https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;800&display=swap
```

| Estilo            | Size | Weight     | Line-height | Letter-spacing | Uso                                        |
| ----------------- | ---- | ---------- | ----------- | -------------- | ------------------------------------------ |
| headline5         | 24px | 500        | 32px        | 0px            | Título principal de módulo                 |
| headline6         | 20px | 600        | 24px        | 0.15px         | Subtítulo de bloque o card                 |
| bajadaDestacada   | 16px | 700        | 24px        | 0.15px         | Información clave destacada                |
| bajada            | 16px | 500        | 24px        | 0.15px         | Texto bajada normal                        |
| parrafoDestacado  | 14px | 700        | 22px        | 0.25px         | Labels de formulario, encabezados de campo |
| parrafo           | 14px | 500        | 22px        | 0.25px         | Texto general, valores de formulario       |
| botones           | 14px | 600        | 22px        | 0.5px          | Texto en botones                           |
| aclaraciones      | 14px | 500 italic | 22px        | 0.25px         | Textos aclaratorios                        |
| tablas.encabezado | 14px | 700        | 22px        | 0.25px         | Encabezados de tabla (th)                  |
| tablas.contenido  | 14px | 500        | 22px        | 0.25px         | Contenido de tabla (td)                    |
| caption           | 12px | 500        | 16px        | 0.4px          | Helper text, alertas en formularios, notas |

---

## Colores

### Corporativo (verde)

| Token                             | Hex     | Uso                                                                                                  |
| --------------------------------- | ------- | ---------------------------------------------------------------------------------------------------- |
| corporativo.principal             | #4CBF8C | Botón primario bg, íconos principales. NO usar para texto sobre fondo blanco (no pasa accesibilidad) |
| corporativo.secundario            | #00A27F | Títulos de sección, textos verdes, texto accesible sobre blanco                                      |
| corporativo.terciario             | #C6F7E1 | Fondos claros verdes, ítem activo sidebar modo claro                                                 |
| corporativo.hoverBotonesPrimarios | #50D6A5 | Hover sobre botón primario                                                                           |

### Texto

| Token               | Hex     | Uso                                           |
| ------------------- | ------- | --------------------------------------------- |
| texto.primario      | #232942 | Todo texto principal sobre fondo blanco       |
| texto.secundario    | #4C516D | Texto secundario, placeholders, descripciones |
| texto.terciario     | #A9ACB9 | Texto terciario, texto disabled               |
| texto.blancoBotones | #FFFFFF | Texto en botones con relleno de color         |

### Neutrales / Bordes

| Token                  | Hex     | Uso                                                 |
| ---------------------- | ------- | --------------------------------------------------- |
| neutro.fondoPagina     | #F8F9FA | Fondo general de página                             |
| neutro.fondoGris       | #F2F3F4 | Filas alternas, hover en tablas, sidebar modo claro |
| neutro.hoverAlt        | #EDEEF0 | Hover alternativo, borde sutil entre secciones      |
| neutro.bordeFormulario | #828599 | Bordes de inputs en estado default                  |
| neutro.bordeDropdown   | #C4C6CF | Bordes de cards, dropdowns, dividers                |
| neutro.fondoBlanco     | #FFFFFF | Fondo de cards y modales                            |

### Notificación / Azul

| Token                              | Hex     | Uso                                                                   |
| ---------------------------------- | ------- | --------------------------------------------------------------------- |
| notificacion.principal             | #005FC5 | Tabs activas, paginador activo, botón terciario texto, focus en input |
| notificacion.clicBoton             | #003794 | Clic en botón azul                                                    |
| notificacion.filetes               | #A7C2FB | Filetes, estado deshabilitado elementos azules                        |
| notificacion.tablaFilaSeleccionada | #D1DFFD | Fila seleccionada en tabla, bg botón terciario                        |
| notificacion.hoverDropdown         | #EEF3FE | Hover en lista de dropdown, input bloqueado                           |

### Alertas (amarillo)

| Token              | Hex     | Uso                                   |
| ------------------ | ------- | ------------------------------------- |
| alertas.principal  | #FFC000 | Alerta primaria. NUNCA usar en textos |
| alertas.secundario | #FFD450 | Border-left notificación alerta       |
| alertas.terciario  | #FFFAB9 | Fondo snackbar alerta/exitosa         |

### Errores (rojo)

| Token              | Hex     | Uso                                                        |
| ------------------ | ------- | ---------------------------------------------------------- |
| errores.principal  | #DC4B5C | Botón destructivo, border inputs error, notificación error |
| errores.hoverBoton | #FF6B75 | Hover botón destructivo                                    |
| errores.clicBoton  | #BE0022 | Click botón destructivo                                    |
| errores.terciario  | #FFE9EA | Fondo hover botón outline rojo, fondo badge error          |

### Sidebar / Menú

| Token             | Hex                   | Uso                                   |
| ----------------- | --------------------- | ------------------------------------- |
| menu.fondoSidebar | #2D3748               | Fondo del sidebar                     |
| menu.itemActivo   | #4CBF8C               | Item activo en sidebar (texto blanco) |
| menu.itemHover    | rgba(255,255,255,0.1) | Hover sobre items del sidebar         |
| menu.texto        | #FFFFFF               | Texto e iconos del sidebar            |

### Tooltip

| Token         | Hex     | Uso               |
| ------------- | ------- | ----------------- |
| fondo.tooltip | #232942 | Fondo de tooltips |

### Modo oscuro (Innovation Hub)

| Token                | Hex     | Uso                                   |
| -------------------- | ------- | ------------------------------------- |
| dark.fondoPrincipal  | #1A1A2E | Fondo principal modo oscuro           |
| dark.fondoCards      | #232942 | Fondo cards y superficies modo oscuro |
| dark.textoPrincipal  | #F2F3F4 | Texto principal modo oscuro           |
| dark.textoSecundario | #A9ACB9 | Texto secundario modo oscuro          |
| dark.bordes          | #4C516D | Bordes modo oscuro                    |

En modo oscuro: el color primario (#4CBF8C) se mantiene igual. Los fondos de notificaciones, alertas y errores se oscurecen proporcionalmente.

---

## Espaciado

- Sistema basado en múltiplos de 4px
- Grilla web: 12 columnas, 20px gutter
- Grilla tablet: 6 columnas, 20px gutter
- Grilla móvil: 4 columnas, 16px margen, 20px gutter
- Padding contenido principal: 24px
- Gap entre campos de formulario: 16-32px
- Gap entre label e input: 4-8px

---

## Botones

Tamaño normal: height 36px, padding 8px 32px, border-radius 25px (pill), font 600 14px/22px Montserrat, letter-spacing 0.5px
Tamaño small: height 28px, padding 4px 16px, border-radius 25px (pill), font 600 12px/16px Montserrat

### Primario (acción principal, máximo 1 por vista)

- Normal: bg #4CBF8C, text #FFFFFF, sin borde
- Hover: bg #50D6A5, text #FFFFFF
- Active: bg #00A27F, text #FFFFFF
- Disabled: bg #C4C6CF, text #FFFFFF

### Secundario (cancelar, volver, acciones de bajo impacto)

- Normal: bg #FFFFFF, text #232942, border 1px solid #C4C6CF
- Hover: bg #F2F3F4, text #232942
- Disabled: bg #FFFFFF, text #C4C6CF, border 1px solid #C4C6CF

### Terciario (acciones informativas, navegación)

- Normal: bg #D1DFFD, text #005FC5, sin borde
- Hover: bg #005FC5, text #FFFFFF
- Disabled: bg #C4C6CF, text #FFFFFF

### Destructivo (eliminar, acciones irreversibles)

- Normal: bg #DC4B5C, text #FFFFFF, sin borde
- Hover: bg #FF6B75, text #FFFFFF
- Active: bg #BE0022, text #FFFFFF
- Disabled: bg #C4C6CF, text #FFFFFF

### Destructivo outline (primer paso destructivo)

- Normal: bg transparent, text #DC4B5C, border 1px solid #DC4B5C
- Hover: bg #FFE9EA, text #DC4B5C
- Disabled: bg transparent, text #C4C6CF, border 1px solid #C4C6CF

### Acciones (botón icónico en tabla)

- Dimensiones: 28x28px, border-radius 4px, border 1px solid #C4C6CF
- Normal: bg #FFFFFF
- Hover: bg #EDEEF0
- Íconos 24px, color #4C516D

---

## Inputs / Formulario

Dimensiones base: width 413px, height 32px, padding 4px 12px, border-radius 5px
Textarea: width 413px, min-height 76px, padding 4px 12px, border-radius 5px

| Estado    | Background | Border            | Text color                      |
| --------- | ---------- | ----------------- | ------------------------------- |
| Default   | #FFFFFF    | 1px solid #828599 | #4C516D                         |
| Hover     | #FFFFFF    | 1px solid #828599 | #4C516D                         |
| Focus     | #FFFFFF    | 1px solid #005FC5 | #4C516D                         |
| Con texto | #FFFFFF    | 1px solid #828599 | #232942                         |
| Error     | #FFFFFF    | 1px solid #DC4B5C | #4C516D, helper text en #DC4B5C |
| Disabled  | #F2F3F4    | 1px solid #C4C6CF | #A9ACB9                         |
| Bloqueado | #EEF3FE    | 1px solid #C4C6CF | #A9ACB9                         |

Labels: parrafoDestacado (14px/700), color #232942
Helper text: caption (12px/500)
Input value: parrafo (14px/500)

---

## Badges / Tags

- Padding: 4px 12px, border-radius 4px
- Font: 12px/16px Montserrat Semibold
- Siempre con borde visible (1px solid, color al 30% de opacidad)

| Tipo    | Fondo   | Borde         | Texto   |
| ------- | ------- | ------------- | ------- |
| Éxito   | #C6F7E1 | #00A27F (30%) | #00A27F |
| Error   | #FFE9EA | #DC4B5C (30%) | #DC4B5C |
| Info    | #EEF3FE | #005FC5 (30%) | #005FC5 |
| Warning | #FFFAB9 | #FFC000 (30%) | #232942 |
| Neutral | #F2F3F4 | #C4C6CF       | #A9ACB9 |

---

## Tabla

Padding-x: 32px, gap 12px entre celdas, border-bottom 1px solid #EDEEF0

| Tipo       | Alto | Background | Tipografía                         |
| ---------- | ---- | ---------- | ---------------------------------- |
| Encabezado | 48px | #FFFFFF    | 14px/700 Montserrat, texto #232942 |
| Contenido  | 52px | #FFFFFF    | 14px/500 Montserrat, texto #4C516D |

- Hover fila: bg #F2F3F4
- Hover fila (con color): bg #EDEEF0
- Fila seleccionada: bg #D1DFFD
- Cifras numéricas: alineadas a la derecha
- Botones de acción: a la derecha de la fila
- Sort icon: 16x16px, bg #F2F3F4
- Paginador: abajo, con selector de filas por página

---

## Modales

Overlay: rgba(0,0,0,0.5)
Base card: bg #FFFFFF, border 1px solid #C4C6CF, border-radius 5px

### Confirmación

- Desktop: 598px ancho, max-height 380px, padding-top 20px, padding-x 24px
- Mobile: 343px ancho
- Header: título (14px bold) + X top-right para cerrar
- Body: descripción (14px/500, #4C516D)
- Divider: 1px #C4C6CF
- Footer fijo: Botón Secundario + Botón Primario (o Destructivo), gap 16px

### Formulario

- Desktop: 598x538px, padding-y 24px
- Labels parrafoDestacado + descripción opcional (aclaraciones #4C516D)
- Gap label→input: 8px, gap entre campos: 32px
- Footer fijo: Botón Secundario + Botón Primario

### Detalles

- Desktop: 684px ancho, padding-y 24px, padding-x 20px
- Contenido con scroll interno, header y footer fijos
- Filas 2 columnas, gap 24px, label 145px (14px bold), valor flex-1 (14px/500 #4C516D)

---

## Estructura base de pantalla

### Layout principal

```
┌─────────────────────────────────────────────┐
│  Top Bar (56px altura, ancho completo)      │
├──────┬──────────────────────────────────────┤
│      │                                      │
│ Side │     Área de contenido                │
│ bar  │     (padding: 24px)                  │
│      │                                      │
│56px/ │     - Banners/alertas                │
│280px │     - Título de sección              │
│      │     - Cards de métricas              │
│      │     - Tablas de datos                │
│      │                                      │
└──────┴──────────────────────────────────────┘
```

### Top Bar

- Altura: 56px, fondo blanco, border-bottom 1px solid #EDEEF0
- Shadow: drop-shadow(0 1px 5px rgba(129,155,184,0.3))
- Izquierda: logo ComunidadFeliz (imagotipo verde #4CBF8C)
- Derecha: iconos de acción (24px, color #4C516D), gap 16px

### Sidebar

- Colapsado: 56px (solo iconos 24px centrados)
- Expandido: ~280px (icono + label Montserrat Medium 14px blanco)
- Fondo: #2D3748, item activo: bg #4CBF8C texto blanco
- Transición suave al expandir/colapsar (200-300ms ease)

### Área de contenido

- Fondo: #F8F9FA o #FFFFFF
- Padding: 24px
- Cards: bg #FFFFFF, border 1px solid #C4C6CF, border-radius 8px, padding 24px

| Zona              | Dimensiones           | Color                      |
| ----------------- | --------------------- | -------------------------- |
| Header            | 1440x56px, top 0      | bg #FFFFFF, border #EDEEF0 |
| Sidebar colapsado | 56px ancho, top 56px  | bg #2D3748                 |
| Sidebar expandido | 280px ancho, top 56px | bg #2D3748                 |
| Fondo general     | restante              | #F8F9FA                    |
| Card contenido    | ancho disponible      | bg #FFFFFF, border #C4C6CF |

---

## Banners / Alertas inline

- Fondo: #FFFAB9 (alertas), border-radius 4px, padding 12px 16px
- Icono a la izquierda, texto Montserrat Medium 14px #232942
- Botón cerrar (X) a la derecha, color #828599

---

## Cards de métricas

- Border: 1px solid #C4C6CF, border-radius 4px, fondo blanco
- Padding: 16px 24px, centrado vertical
- Label: Montserrat Medium 14px, color #4C516D
- Valor: Montserrat Semibold 24-36px, color #232942
- Disposición: flex row, gap 16-20px

---

## Paginador

- width 238px, height 34px, bg #FFFFFF, border 1px solid #C4C6CF, border-radius 4px
- Layout: Anterior | divider | [páginas] | divider | Siguiente
- Página activa: width 30px, bg #005FC5, color #FFFFFF
- Página inactiva: color #005FC5
- "Anterior": color #4C516D
- "Siguiente": color #005FC5

---

## Search Bar

- width 413px, height 32px, padding 4px 12px, border-radius 5px
- bg #FFFFFF, border 1px solid #828599
- Ícono lupa 16x16px izquierda
- Con texto: texto #232942 + ícono X 16x16px derecha
- Placeholder: color #4C516D

---

## Dropdown con Buscador

- width 413px, bg #FFFFFF, border 1px solid #C4C6CF, border-radius 5px, padding 16px, gap 12px
- Opción default: 14px/500, text #232942
- Opción seleccionada: 14px/700, control fill #00A27F
- Opción hover: bg #EEF3FE
- Checkbox: 14x14px, Radio: 12x12px, Gap label: 12px

---

## Tabs

- Activa: 14px/600 Montserrat Semibold, color #005FC5, línea inferior de acento
- Inactiva: 14px/400 Montserrat Regular, color #4C516D
- Separador: línea vertical 1px solid #C4C6CF, 20px alto

---

## Toggle

- Sin label: 24x24px, Con label: 91x24px
- Track On: #4CBF8C, Track Off: #C4C6CF
- Label: parrafo (14px/500), color #232942

---

## Tooltip

- bg #232942, border-radius 5px, padding 4px 8px
- Texto: caption (12px/500), color #FFFFFF, text-align center

---

## Notificaciones (banners laterales)

- width 527px, bg #FFFFFF, border-radius 12px, padding 24px 18px
- Shadow: 0px 1px 7.3px 0px rgba(0,0,0,0.25), 0px 4px 20.3px 0px rgba(0,0,0,0.1)
- Border-left: 5px solid [color por tipo]
- Título: bajadaDestacada (16px/700), color #232942
- Descripción: parrafo (14px/500), color #4C516D

| Tipo        | Border-left | Ícono bg |
| ----------- | ----------- | -------- |
| Información | #005FC5     | #005FC5  |
| Éxito       | #4CBF8C     | #4CBF8C  |
| Error       | #DC4B5C     | #DC4B5C  |
| Alerta      | #FFD450     | #FFD450  |

---

## Snackbar

- width 100% del contenedor, height 37px, border-radius 5px, padding 8px 12px
- Exitosa/Alerta: bg #FFFAB9
- Sin información: bg #EEF3FE, texto centrado

---

## Checkbox / Radio Button

Checkbox: 14x14px

- Off: borde #828599, sin relleno
- On: fill #00A27F, checkmark blanco
- Indeterminado: fill #00A27F, guión blanco

Radio Button: 12x12px

- Off: círculo vacío borde #828599
- On: fill #00A27F, punto interior blanco

Gap control-label: 4px, tipografía label: parrafo (14px/500)

---

## Iconografía

- Área total: 40x40px, área útil: 35x35px
- Tamaños permitidos: 16px (botones), 24px (menú y textos), 35px (enfatizar)
- Trazo: 2.5px, radio de curvatura 2-3px
- Color default: #4C516D
- En sidebar: color #FFFFFF, item activo bg #4CBF8C
- En modo oscuro: color #A9ACB9, activo #00A27F

---

## Lo que NUNCA hacer

- Colores fuera de esta paleta
- Fuentes distintas a Montserrat
- Gradientes propios, sombras exageradas, bordes muy redondeados (>8px en cards)
- Más de un botón Primario por vista
- Texto claro sobre fondo claro
- Inventar variantes de componentes que no existen en este documento
- Usar #4CBF8C para texto sobre fondo blanco (no pasa accesibilidad, usar #00A27F)
- Usar amarillo (#FFC000) para textos
- Iconos solos sin texto ni tooltip
