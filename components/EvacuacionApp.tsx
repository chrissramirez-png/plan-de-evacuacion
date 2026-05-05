"use client";

import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import {
  Flame, Droplets, DoorOpen, Users, Route, Eye, EyeOff,
  AlertTriangle, X, MapPin, CheckCircle, Copy,
  Share2, LogIn, ArrowLeft, Link, RefreshCw, Sparkles,
  ChevronRight, Loader2, BotMessageSquare, ScanSearch, Plus,
  FileText, ImageIcon, KeyRound,
} from "lucide-react";

/* ─── Design tokens ──────────────────────────────────────────── */
const C = {
  green:     "#4CBF8C",
  greenDark: "#3AA87A",
  greenBg:   "#E8F8F1",
  blue:      "#005FC5",
  blueBg:    "#EEF3FE",
  yellow:    "#FFC000",
  yellowBg:  "#FEF9C3",
  red:       "#FF6B75",
  redBg:     "#FFE4E6",
  gray:      "#4E526E",
  grayMid:   "#9CA3AF",
  grayLight: "#E8EBF0",
  bg:        "#F8FAFC",
  white:     "#FFFFFF",
  shadow:    "0 2px 12px rgba(78,82,110,0.08)",
  shadowMd:  "0 4px 20px rgba(78,82,110,0.12)",
};

/* ─── Types ──────────────────────────────────────────────────── */
interface Point { x: number; y: number; }
interface Element { id: number; num: number; type: string; label: string; detail: string; x: number; y: number; }
interface RouteItem { id: number; points: Point[]; }
interface LocationField { id: string; label: string; placeholder: string; enabled: boolean; }
interface BuildingCtx {
  name?: string; floors?: string; extra?: string;
  blocked?: string; mobility?: boolean; locationFields?: LocationField[];
}
interface Plan {
  name?: string; image?: string | null;
  elements?: Element[]; routes?: RouteItem[];
  buildingCtx?: BuildingCtx; publishedAt?: string;
}
interface AISuggestion {
  resumen?: string;
  salidas?: Array<{ x: number; y: number; label: string; razon: string }>;
  extintores?: Array<{ x: number; y: number; label: string; razon: string }>;
  puntos?: Array<{ x: number; y: number; label: string; razon: string }>;
  mangueras?: Array<{ x: number; y: number; label: string; razon: string }>;
  rutas?: Array<{ label: string; razon: string; points: Point[] }>;
}
interface PDFExtracted extends AISuggestion {
  edificio?: { nombre?: string; pisos?: string; infoAdicional?: string; zonasBlockeadas?: string };
  alertas?: string[];
}
interface BuildingDetails {
  nombre:          string;
  tipo:            string;
  pisos:           string;
  forma:           string;
  unidadesPorPiso: string;
  escaleras:       string;
  tieneAscensores: boolean;
  descripcion:     string;
}

/* ─── Constants ─────────────────────────────────────────────── */
const TOOLS: Record<string, { id: string; label: string; icon: React.ComponentType<any>; color: string; bg: string }> = {
  extintor: { id: "extintor", label: "Extintor",           icon: Flame,    color: "#FF6B75", bg: "#FFE4E6" },
  manguera: { id: "manguera", label: "Manguera",           icon: Droplets, color: "#005FC5", bg: "#EEF3FE" },
  salida:   { id: "salida",   label: "Salida",             icon: DoorOpen, color: "#4CBF8C", bg: "#E8F8F1" },
  punto:    { id: "punto",    label: "Punto de Encuentro", icon: Users,    color: "#FFC000", bg: "#FEF9C3" },
  ruta:     { id: "ruta",     label: "Dibujar Ruta",       icon: Route,    color: "#005FC5", bg: "#EEF3FE" },
};

const CRITICAL_TYPES = new Set(["salida", "punto"]);

/* Canvas en blanco usado cuando se aplica un plan extraído de PDF sin imagen */
const BLANK_CANVAS_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800">
  <rect width="1200" height="800" fill="#F8FAFC"/>
  <defs>
    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#E8EBF0" stroke-width="1"/>
    </pattern>
  </defs>
  <rect width="1200" height="800" fill="url(#grid)"/>
  <text x="600" y="390" text-anchor="middle" fill="#C4C9D4" font-family="sans-serif" font-size="18" font-weight="600">Plano sin imagen</text>
  <text x="600" y="416" text-anchor="middle" fill="#C4C9D4" font-family="sans-serif" font-size="13">Sube una imagen del plano para mayor precisión</text>
</svg>`;
const BLANK_CANVAS = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(BLANK_CANVAS_SVG)))}`;

const SAMPLE_DETAILS: Record<string, string[]> = {
  extintor: ["Última mantención: Ene 2025", "PQS 6kg — Zona A", "Próx. revisión: Jul 2025"],
  manguera: ["Presión: OK — Rev. Mar 2025", "Longitud: 15m", "Conexión DN 45"],
  salida:   ["Salida principal N°1", "Abre hacia el exterior", "Iluminación de emergencia: OK"],
  punto:    ["Capacidad: 80 personas", "Zona libre de riesgo", "Responsable: Conserje"],
};

const EMERGENCY_TYPES = [
  { id: "incendio", label: "🔥 Incendio",  hint: "Evita escaleras si hay humo" },
  { id: "sismo",    label: "🌎 Sismo",     hint: "Aléjate de ventanas y estructuras" },
  { id: "gas",      label: "💨 Gas",       hint: "No uses ascensores ni electricidad" },
  { id: "general",  label: "⚠️ General",  hint: "Sigue las indicaciones del personal" },
];

const DEFAULT_LOCATION_FIELDS: LocationField[] = [
  { id: "depto",  label: "N° Depto",  placeholder: "Ej: 206",          enabled: true  },
  { id: "torre",  label: "Torre",     placeholder: "Ej: Torre A",       enabled: true  },
  { id: "piso",   label: "N° Piso",   placeholder: "Ej: Piso 2",        enabled: true  },
  { id: "sector", label: "Sector",    placeholder: "Ej: Ala norte",     enabled: false },
  { id: "otros",  label: "Otros",     placeholder: "Detalle adicional", enabled: false },
];

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const genCode = () =>
  Array.from({ length: 6 }, () => CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)]).join("");

/* ─── localStorage storage helpers ─────────────────────────── */
const storage = {
  set: (key: string, value: string) => {
    try { localStorage.setItem(key, value); } catch { /* ignore */ }
  },
  get: (key: string): string | null => {
    try { return localStorage.getItem(key); } catch { return null; }
  },
  list: (prefix: string): string[] => {
    try {
      return Object.keys(localStorage).filter((k) => k.startsWith(prefix));
    } catch { return []; }
  },
};

/* ─── API helpers ────────────────────────────────────────────── */
const callGemini = async ({ max_tokens, messages }: { max_tokens: number; messages: any[] }) => {
  const contents = messages.map((msg) => {
    const blocks = Array.isArray(msg.content)
      ? msg.content
      : [{ type: "text", text: msg.content }];
    const parts = blocks
      .map((block: any) => {
        if (block.type === "text") return { text: block.text };
        if (block.type === "image")
          return { inlineData: { mimeType: block.source.media_type, data: block.source.data } };
        if (block.type === "document")
          return { inlineData: { mimeType: block.source.media_type, data: block.source.data } };
        return null;
      })
      .filter(Boolean);
    return { role: msg.role === "user" ? "user" : "model", parts };
  });

  const res = await fetch("/api/gemini", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents,
      generationConfig: { maxOutputTokens: max_tokens },
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`API ${res.status}: ${err?.error?.message || res.statusText}`);
  }
  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Respuesta vacía");
  return text;
};

/* ─── AI: floor plan vision analysis ────────────────────────── */
function parseDataUrl(dataUrl: string) {
  const [header, data] = dataUrl.split(",");
  const mediaType = header.match(/:(.*?);/)![1];
  return { mediaType, data };
}

async function analyzeFloorPlan(imageDataUrl: string) {
  const { mediaType, data } = parseDataUrl(imageDataUrl);
  const text = await callGemini({
    max_tokens: 1500,
    messages: [{
      role: "user",
      content: [
        { type: "image", source: { type: "base64", media_type: mediaType, data } },
        {
          type: "text",
          text: `Analiza este plano arquitectónico y sugiere ubicaciones óptimas para elementos de seguridad Y rutas de evacuación.

Responde ÚNICAMENTE con JSON válido (sin markdown, sin backticks, sin texto extra):
{
  "resumen": "Descripción breve del espacio identificado (máx 2 frases)",
  "salidas":    [{"x": 15, "y": 20, "label": "Salida 1",             "razon": "Puerta principal con acceso directo al exterior"}],
  "extintores": [{"x": 30, "y": 45, "label": "Extintor 1",           "razon": "Zona de mayor riesgo de incendio"}],
  "puntos":     [{"x": 50, "y": 80, "label": "Punto de Encuentro A", "razon": "Área abierta y despejada"}],
  "mangueras":  [{"x": 20, "y": 30, "label": "Manguera 1",           "razon": "Acceso estratégico a red húmeda"}],
  "rutas": [
    {
      "label": "Ruta principal",
      "razon": "Recorrido más corto desde el centro hacia la salida principal",
      "points": [{"x": 50, "y": 50}, {"x": 50, "y": 30}, {"x": 15, "y": 20}]
    }
  ]
}

Reglas:
- x,y son porcentajes (0-100) de posición en el plano
- Máximo 3 elementos por tipo y 3 rutas; usa [] si no aplica
- Las rutas deben conectar zonas interiores con las salidas sugeridas usando pasillos identificados
- Cada ruta debe tener entre 3 y 6 puntos que tracen el recorrido real por el plano
- Identifica puertas, pasillos, escaleras, zonas de riesgo y áreas abiertas`,
        },
      ],
    }],
  });
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No se pudo interpretar la respuesta");
  return JSON.parse(jsonMatch[0]);
}

/* ─── AI: generate floor plan SVG from PDF ───────────────────── */
async function generateFloorPlanSVG(extracted: PDFExtracted, details?: BuildingDetails): Promise<string> {
  const ed = extracted.edificio || {};

  const nombre      = details?.nombre          || ed.nombre          || "Edificio";
  const tipo        = details?.tipo            || "Residencial";
  const pisos       = details?.pisos           || ed.pisos            || "varios";
  const forma       = details?.forma           || "Rectangular";
  const unidades    = details?.unidadesPorPiso ? `${details.unidadesPorPiso} unidades por piso` : "";
  const escaleras   = details?.escaleras       || "2";
  const ascensores  = details?.tieneAscensores !== false ? "con ascensores" : "sin ascensores";
  const descripcion = details?.descripcion     || ed.infoAdicional    || "";

  const salidas = (extracted.salidas || []).map((s) => s.label).join(", ") || "no identificadas";

  // Diseño específico por tipo de edificio
  const disenoTipo: Record<string, string> = {
    Residencial:  "departamentos a ambos lados del pasillo, hall de ascensores central, cuarto de basura",
    Oficinas:     "open space con cubiculos, sala de reuniones, recepcion, kitchenette, sala de servidores",
    Hospital:     "habitaciones de pacientes a ambos lados, nurses station central, sala de espera, deposito",
    Hotel:        "habitaciones con bano a ambos lados del pasillo, cuarto de limpieza, bodega de ropa",
    Comercial:    "locales comerciales con vitrinas hacia pasillo central, zona de carga trasera, banos",
    Industrial:   "nave central de produccion, oficinas laterales, zona de maquinaria, bodega de materiales",
    Mixto:        "mix de espacios residenciales y comerciales con pasillo de acceso compartido",
  };

  const distribDesc = disenoTipo[tipo] || disenoTipo.Residencial;

  const prompt = `Genera un plano arquitectonico SVG de planta de un piso de un edificio.

EDIFICIO: ${nombre} | Tipo: ${tipo} | Pisos: ${pisos} | Forma: ${forma} | ${unidades} | ${escaleras} nucleos de escalera | ${ascensores}
DISTRIBUCION: ${distribDesc}
${descripcion ? `NOTAS: ${descripcion}` : ""}
SALIDAS DE EMERGENCIA: ${salidas}

INSTRUCCIONES:
- Genera el plano completo de UN PISO TIPICO adaptado al tipo "${tipo}" con forma "${forma}"
- Fondo gris claro, paredes en gris oscuro, habitaciones en blanco, pasillos en gris muy claro
- Escaleras con patron diagonal (lineas cruzadas), ascensores en azul claro
- Salidas de emergencia como rectangulos verdes en los bordes del perimetro
- Etiquetas de texto simples en cada espacio
- Plano bien distribuido que ocupe casi todo el area visible

FORMATO OBLIGATORIO: responde SOLO con el SVG, sin markdown, sin explicacion.
El SVG debe comenzar con: <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800">
El SVG debe terminar con: </svg>`;

  const raw = await callGemini({
    max_tokens: 6000,
    messages: [{ role: "user", content: [{ type: "text", text: prompt }] }],
  });

  // Strip markdown code fences if Gemini added them (```svg ... ``` or ```xml ... ```)
  const cleaned = raw.replace(/^```(?:svg|xml|html)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();

  // Greedy match to capture the full SVG including the closing tag
  const svgMatch = cleaned.match(/<svg[\s\S]*<\/svg>/i);
  if (!svgMatch) throw new Error(`Gemini no devolvió SVG válido. Respuesta: ${cleaned.slice(0, 200)}`);

  const svgCode = svgMatch[0];
  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgCode)))}`;
}

/* ─── AI: emergency plan PDF analysis ───────────────────────── */
async function analyzeEmergencyPlanPDF(pdfDataUrl: string): Promise<PDFExtracted> {
  const { data } = parseDataUrl(pdfDataUrl);
  const text = await callGemini({
    max_tokens: 8000,
    messages: [{
      role: "user",
      content: [
        {
          type: "document",
          source: { type: "base64", media_type: "application/pdf", data },
        },
        {
          type: "text",
          text: `Eres un experto en seguridad y evacuación de edificios. Analiza este plan de emergencia y extrae la información clave.

IMPORTANTE: Responde ÚNICAMENTE con JSON válido y compacto. Sé BREVE en los textos (máx 80 caracteres por campo de texto). No uses caracteres especiales que rompan el JSON.

{"edificio":{"nombre":"string","pisos":"string","infoAdicional":"string breve","zonasBlockeadas":"string breve o null"},"resumen":"máx 2 frases","salidas":[{"x":15,"y":85,"label":"Salida 1","razon":"breve"}],"extintores":[{"x":30,"y":40,"label":"Extintor 1","razon":"breve"}],"puntos":[{"x":50,"y":95,"label":"Punto A","razon":"breve"}],"mangueras":[{"x":20,"y":30,"label":"Manguera 1","razon":"breve"}],"rutas":[{"label":"Ruta 1","razon":"breve","points":[{"x":50,"y":50},{"x":50,"y":30},{"x":15,"y":15}]}],"alertas":["alerta breve 1"]}

Reglas estrictas:
- x,y son números enteros 0-100 (posición % en plano)
- Máximo 3 elementos por tipo, máximo 3 rutas, máximo 3 alertas
- Salidas en bordes (x<20 o x>80 o y<20 o y>80)
- Puntos de encuentro con y>85 (exterior)
- Cada ruta: entre 3 y 5 puntos
- Si no hay info de un tipo, usa []
- Strings sin comillas dobles internas ni saltos de línea`,
        },
      ],
    }],
  });

  const tryParse = (str: string) => {
    try { return JSON.parse(str); } catch { return null; }
  };
  let result = tryParse(text.trim());
  if (!result) {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) result = tryParse(match[0]);
  }
  if (!result) throw new Error("La IA devolvió un formato inesperado. Intenta con un PDF más corto.");
  return result;
}

/* ─── AI: evacuation route suggestion ───────────────────────── */
async function fetchAISuggestion({ elements, routes, buildingCtx, userLocation, emergencyType, floors }: {
  elements: Element[]; routes: RouteItem[]; buildingCtx: BuildingCtx;
  userLocation: string; emergencyType: string; floors: string;
}) {
  const fmt = (arr: Element[]) => arr.map((e) => `"${e.label}" en (${e.x.toFixed(0)}%,${e.y.toFixed(0)}%)`);
  const emType = EMERGENCY_TYPES.find((t) => t.id === emergencyType);

  const prompt = `Eres un experto en protocolos de evacuación. Analiza este plan y genera instrucciones claras para un residente.

EDIFICIO:
- Nombre: ${buildingCtx.name || "Edificio"}
- Pisos: ${floors}
- Info adicional: ${buildingCtx.extra || "Ninguna"}
- Zonas bloqueadas: ${buildingCtx.blocked || "Ninguna"}
- Movilidad reducida: ${buildingCtx.mobility ? "Sí" : "No"}

ELEMENTOS EN PLANO:
- Salidas: ${fmt(elements.filter((e) => e.type === "salida")).join(", ") || "Ninguna marcada"}
- Extintores: ${fmt(elements.filter((e) => e.type === "extintor")).join(", ") || "Ninguno marcado"}
- Puntos de encuentro: ${fmt(elements.filter((e) => e.type === "punto")).join(", ") || "Ninguno marcado"}
- Rutas dibujadas: ${routes.length}

RESIDENTE:
- Ubicación: ${userLocation}
- Emergencia: ${emType?.label} — ${emType?.hint}

Responde con:
1. **Ruta recomendada**: pasos numerados (máx 6)
2. **Salida sugerida**: cuál y por qué
3. **Precauciones**: 2-3 puntos clave
4. **Al llegar al punto de encuentro**: qué hacer

Sé directo y usa lenguaje simple.`;

  return callGemini({ max_tokens: 1000, messages: [{ role: "user", content: prompt }] });
}

/* ─── Custom Hooks ───────────────────────────────────────────── */
function useAI({ plan, userLocation, emergencyType }: { plan: Plan; userLocation: string; emergencyType: string }) {
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState<string | null>(null);

  const ask = useCallback(async () => {
    setLoading(true);
    setSuggestion(null);
    setError(null);
    try {
      const text = await fetchAISuggestion({
        elements:    plan.elements || [],
        routes:      plan.routes || [],
        buildingCtx: plan.buildingCtx || {},
        userLocation,
        emergencyType,
        floors:      plan.buildingCtx?.floors || "?",
      });
      setSuggestion(text);
    } catch (e: any) {
      setError(`Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }, [plan, userLocation, emergencyType]);

  return { suggestion, loading, error, ask };
}

function useMapEditor() {
  const [elements, setElements]         = useState<Element[]>([]);
  const [routes, setRoutes]             = useState<RouteItem[]>([]);
  const [activeTool, setActiveTool]     = useState<string | null>(null);
  const [currentRoute, setCurrentRoute] = useState<Point[] | null>(null);
  const counterRef = useRef(1);
  const canvasRef  = useRef<HTMLDivElement>(null);

  const getCoords = useCallback((e: React.MouseEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return {
      x: parseFloat((((e.clientX - rect.left) / rect.width)  * 100).toFixed(2)),
      y: parseFloat((((e.clientY - rect.top)  / rect.height) * 100).toFixed(2)),
    };
  }, []);

  const handleCanvasClick = useCallback((e: React.MouseEvent, { isViewMode, image }: { isViewMode: boolean; image: string | null }) => {
    if (isViewMode || !activeTool || !image) return;
    e.stopPropagation();
    const coords = getCoords(e);

    if (activeTool === "ruta") {
      setCurrentRoute((prev) => (prev ? [...prev, coords] : [coords]));
    } else {
      const tool     = TOOLS[activeTool];
      const sameType = elements.filter((el) => el.type === activeTool).length;
      const details  = SAMPLE_DETAILS[activeTool] || [];
      setElements((prev) => [
        ...prev,
        {
          id:     Date.now(),
          num:    counterRef.current++,
          type:   activeTool,
          label:  `${tool.label} ${sameType + 1}`,
          detail: details[Math.floor(Math.random() * details.length)] || "",
          x:      coords.x,
          y:      coords.y,
        },
      ]);
    }
  }, [activeTool, elements, getCoords]);

  const addElement = useCallback((type: string, { x, y, label, detail = "" }: { x: number; y: number; label: string; detail?: string }) => {
    setElements((prev) => [
      ...prev,
      { id: Date.now(), num: counterRef.current++, type, label, detail, x, y },
    ]);
  }, []);

  const addRoute = useCallback((points: Point[]) => {
    setRoutes((prev) => [...prev, { id: Date.now(), points }]);
  }, []);

  const finishRoute = useCallback(() => {
    if (!currentRoute || currentRoute.length < 2) { setCurrentRoute(null); return; }
    setRoutes((prev) => [...prev, { id: Date.now(), points: currentRoute }]);
    setCurrentRoute(null);
  }, [currentRoute]);

  const removeElement = useCallback((id: number) => setElements((prev) => prev.filter((e) => e.id !== id)), []);
  const removeRoute   = useCallback((id: number) => setRoutes((prev) => prev.filter((r) => r.id !== id)), []);
  const moveElement   = useCallback((id: number, x: number, y: number) => {
    setElements((prev) => prev.map((el) => el.id === id ? { ...el, x, y } : el));
  }, []);;

  const selectTool = useCallback((toolId: string | null) => {
    setActiveTool(toolId);
    setCurrentRoute(null);
  }, []);

  const reset = useCallback(() => {
    setElements([]);
    setRoutes([]);
    setCurrentRoute(null);
    setActiveTool(null);
    counterRef.current = 1;
  }, []);

  const loadPlan = useCallback((els: Element[], rts: RouteItem[]) => {
    setElements(els);
    setRoutes(rts);
    setCurrentRoute(null);
    setActiveTool(null);
    counterRef.current = (els.length > 0 ? Math.max(...els.map((e) => e.num)) + 1 : 1);
  }, []);

  return {
    elements, routes, activeTool, currentRoute,
    canvasRef, handleCanvasClick, finishRoute,
    removeElement, removeRoute, moveElement, selectTool, reset, addElement, addRoute, loadPlan,
  };
}

/* ─── Shared UI ──────────────────────────────────────────────── */
function MarkdownText({ text }: { text: string }) {
  return (
    <>
      {text.split("\n").map((line, i) => {
        const parts = line.split(/\*\*(.*?)\*\*/g);
        return (
          <p key={i} style={{ margin: "2px 0", lineHeight: 1.6 }}>
            {parts.map((p, j) =>
              j % 2 === 1
                ? <strong key={j} style={{ color: C.gray }}>{p}</strong>
                : <span key={j}>{p.replace(/^#+\s*/, "")}</span>
            )}
          </p>
        );
      })}
    </>
  );
}

function ElementPin({ el, emergency, showTooltip, onMouseEnter, onMouseLeave, onMove, getCanvasRect }: {
  el: Element; emergency: boolean; showTooltip: boolean;
  onMouseEnter: () => void; onMouseLeave: () => void;
  onMove?: (id: number, x: number, y: number) => void;
  getCanvasRect?: () => DOMRect | null;
}) {
  const tool       = TOOLS[el.type];
  const Icon       = tool?.icon || MapPin;
  const isCritical = CRITICAL_TYPES.has(el.type);
  const isDragging  = useRef(false);
  const [dragging, setDragging] = useState(false);

  if (emergency && !isCritical) return null;

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!onMove || !getCanvasRect) return;
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    isDragging.current = true;
    setDragging(true);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging.current || !onMove || !getCanvasRect) return;
    const rect = getCanvasRect();
    if (!rect) return;
    const x = Math.max(1, Math.min(99, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(1, Math.min(99, ((e.clientY - rect.top) / rect.height) * 100));
    onMove(el.id, x, y);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging.current) return;
    e.stopPropagation();
    isDragging.current = false;
    setDragging(false);
  };

  return (
    <div
      style={{
        position: "absolute", left: `${el.x}%`, top: `${el.y}%`,
        transform: "translate(-50%,-50%)",
        zIndex: dragging ? 20 : 10,
        cursor: onMove ? (dragging ? "grabbing" : "grab") : "default",
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {emergency && isCritical && (
        <span className="ping" style={{ position: "absolute", inset: 0, borderRadius: "50%", background: tool?.color, opacity: 0.4 }} />
      )}
      <div
        className="element-pin"
        style={{ background: tool?.color || C.gray }}
        onMouseEnter={dragging ? undefined : onMouseEnter}
        onMouseLeave={dragging ? undefined : onMouseLeave}
        aria-label={el.label}
      >
        <Icon size={15} color="white" />
      </div>
      {showTooltip && !dragging && (
        <div className="tooltip">
          <p style={{ margin: 0, fontWeight: 700, fontSize: 12 }}>{el.label}</p>
          {el.detail && <p style={{ margin: "3px 0 0", color: C.grayMid, fontSize: 11 }}>{el.detail}</p>}
          <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.green, display: "inline-block" }} />
            <span style={{ color: C.green, fontWeight: 600, fontSize: 11 }}>Operativo</span>
          </div>
        </div>
      )}
    </div>
  );
}

function RouteLayer({ routes, currentRoute, routeColor, emergency, markerId }: {
  routes: RouteItem[]; currentRoute: Point[] | null;
  routeColor: string; emergency: boolean; markerId: string;
}) {
  const cls    = emergency ? "fem" : "fl";
  const sw     = emergency ? "0.9" : "0.55";
  const sd     = emergency ? "3 1.5" : "4 2";
  const glowId = `glow-${markerId}`;

  return (
    <svg
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
    >
      <defs>
        <marker id={markerId} markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto">
          <path d="M0,0 L0,5 L5,2.5 z" fill={routeColor} />
        </marker>
        {emergency && (
          <filter id={glowId}>
            <feGaussianBlur stdDeviation="0.5" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        )}
      </defs>
      {routes.map((r) => (
        <polyline
          key={r.id}
          points={r.points.map((p) => `${p.x},${p.y}`).join(" ")}
          fill="none" stroke={routeColor} strokeWidth={sw}
          strokeDasharray={sd} className={cls}
          markerEnd={`url(#${markerId})`}
          filter={emergency ? `url(#${glowId})` : undefined}
          opacity={emergency ? 1 : 0.85}
        />
      ))}
      {currentRoute && currentRoute.length >= 2 && (
        <polyline
          points={currentRoute.map((p) => `${p.x},${p.y}`).join(" ")}
          fill="none" stroke={C.yellow} strokeWidth="0.45" strokeDasharray="2 1" opacity="0.8"
        />
      )}
      {currentRoute?.map((pt, i) => (
        <circle key={i} cx={pt.x} cy={pt.y} r="0.8" fill={C.yellow} opacity="0.9" />
      ))}
    </svg>
  );
}

/* ─── API Key Modal ──────────────────────────────────────────── */
function ApiKeyModal({ onClose }: { onClose: () => void }) {
  const [value, setValue] = useState(() => {
    if (typeof window !== "undefined") return localStorage.getItem("anthropic_api_key") || "";
    return "";
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleSave = () => {
    localStorage.setItem("anthropic_api_key", value.trim());
    setSaved(true);
    setTimeout(onClose, 800);
  };

  return (
    <div
      role="dialog" aria-modal="true"
      style={{
        position: "fixed", inset: 0, zIndex: 60,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "rgba(78,82,110,0.35)", backdropFilter: "blur(6px)",
      }}
      onClick={onClose}
    >
      <div className="card" style={{ padding: 24, width: "100%", maxWidth: 380, margin: 16 }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: C.blueBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <KeyRound size={16} color={C.blue} />
            </div>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>API Key de Anthropic</p>
          </div>
          <button className="icon-btn" onClick={onClose}><X size={16} /></button>
        </div>
        <p style={{ margin: "0 0 14px", fontSize: 12, color: C.grayMid, lineHeight: 1.6 }}>
          Necesaria para usar las funciones de IA localmente. Se guarda solo en tu navegador.
          Obtén una en{" "}
          <span style={{ color: C.blue }}>console.anthropic.com</span>.
        </p>
        <input
          className="input-field"
          type="password"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="sk-ant-api03-..."
          onKeyDown={(e) => e.key === "Enter" && handleSave()}
          style={{ marginBottom: 12, fontFamily: "monospace", fontSize: 12 }}
        />
        <button
          className="btn-primary"
          onClick={handleSave}
          style={{ width: "100%", borderRadius: 12 }}
        >
          {saved ? <><CheckCircle size={14} /> Guardada</> : <><KeyRound size={14} /> Guardar clave</>}
        </button>
      </div>
    </div>
  );
}

/* ─── PDF Review Modal ───────────────────────────────────────── */
function PdfReviewModal({ extracted, onConfirm, onClose }: {
  extracted: PDFExtracted; onConfirm: () => void; onClose: () => void;
  // onConfirm now opens the building-details step instead of applying directly
}) {
  const { edificio, resumen, salidas, extintores, puntos, mangueras, rutas, alertas } = extracted;

  const counts = [
    { label: "Salidas", count: salidas?.length || 0, color: C.green,  bg: C.greenBg },
    { label: "Extintores", count: extintores?.length || 0, color: C.red, bg: C.redBg },
    { label: "Puntos de encuentro", count: puntos?.length || 0, color: C.yellow, bg: C.yellowBg },
    { label: "Mangueras", count: mangueras?.length || 0, color: C.blue, bg: C.blueBg },
    { label: "Rutas", count: rutas?.length || 0, color: C.blue, bg: C.blueBg },
  ].filter((c) => c.count > 0);

  return (
    <div
      role="dialog" aria-modal="true"
      style={{
        position: "fixed", inset: 0, zIndex: 60,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "rgba(78,82,110,0.40)", backdropFilter: "blur(6px)",
        padding: 16,
      }}
      onClick={onClose}
    >
      <div className="card" style={{ width: "100%", maxWidth: 520, maxHeight: "90vh", display: "flex", flexDirection: "column" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: "18px 20px", borderBottom: `1px solid ${C.grayLight}`, display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
          <div style={{ width: 38, height: 38, borderRadius: 12, background: C.greenBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <FileText size={18} color={C.green} />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>Plan extraído del PDF</p>
            <p style={{ margin: 0, fontSize: 11, color: C.grayMid }}>Revisa antes de aplicar al editor</p>
          </div>
          <button className="icon-btn" onClick={onClose}><X size={16} /></button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
          <div style={{ background: C.blueBg, borderRadius: 12, padding: "12px 16px", marginBottom: 16 }}>
            <p style={{ margin: "0 0 4px", fontSize: 12, fontWeight: 700, color: C.blue }}>
              🏢 {edificio?.nombre || "Edificio"}
            </p>
            {edificio?.pisos && <p style={{ margin: "2px 0", fontSize: 11, color: C.gray }}>Pisos: {edificio.pisos}</p>}
            {edificio?.infoAdicional && <p style={{ margin: "2px 0", fontSize: 11, color: C.gray }}>{edificio.infoAdicional}</p>}
            {edificio?.zonasBlockeadas && (
              <p style={{ margin: "4px 0 0", fontSize: 11, color: C.red }}>⚠️ Zonas bloqueadas: {edificio.zonasBlockeadas}</p>
            )}
          </div>

          {resumen && (
            <p style={{ fontSize: 12, color: C.grayMid, lineHeight: 1.6, margin: "0 0 16px" }}>{resumen}</p>
          )}

          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
            {counts.map((c) => (
              <div key={c.label} style={{
                display: "flex", alignItems: "center", gap: 6,
                background: c.bg, borderRadius: 8, padding: "6px 12px",
              }}>
                <span style={{ fontSize: 16, fontWeight: 700, color: c.color }}>{c.count}</span>
                <span style={{ fontSize: 11, color: C.gray }}>{c.label}</span>
              </div>
            ))}
          </div>

          {[
            { key: "salidas",    label: "Salidas",              items: salidas,    icon: "🚪" },
            { key: "extintores", label: "Extintores",           items: extintores, icon: "🧯" },
            { key: "puntos",     label: "Puntos de Encuentro",  items: puntos,     icon: "👥" },
            { key: "mangueras",  label: "Mangueras",            items: mangueras,  icon: "💧" },
            { key: "rutas",      label: "Rutas de Evacuación",  items: rutas,      icon: "➡️" },
          ].filter(({ items }) => items && items.length > 0).map(({ label, items, icon }) => (
            <div key={label} style={{ marginBottom: 12 }}>
              <p style={{ margin: "0 0 6px", fontSize: 11, fontWeight: 700, color: C.gray }}>{icon} {label}</p>
              {(items as any[]).map((item, i) => (
                <div key={i} style={{
                  background: C.bg, borderRadius: 8, padding: "8px 12px", marginBottom: 4,
                  border: `1px solid ${C.grayLight}`, fontSize: 11,
                }}>
                  <span style={{ fontWeight: 600, color: C.gray }}>{item.label}</span>
                  {item.razon && <span style={{ color: C.grayMid }}> — {item.razon}</span>}
                  {item.points && <span style={{ color: C.grayMid }}> ({item.points.length} puntos)</span>}
                </div>
              ))}
            </div>
          ))}

          {alertas && alertas.length > 0 && (
            <div style={{ background: C.yellowBg, borderRadius: 10, padding: "10px 14px", border: `1px solid ${C.yellow}` }}>
              <p style={{ margin: "0 0 6px", fontSize: 11, fontWeight: 700, color: C.gray }}>⚠️ Consideraciones especiales</p>
              {alertas.map((a, i) => (
                <p key={i} style={{ margin: "2px 0", fontSize: 11, color: C.gray }}>• {a}</p>
              ))}
            </div>
          )}

          <div style={{ background: C.blueBg, borderRadius: 10, padding: "10px 14px", marginTop: 14, fontSize: 11, color: C.blue, lineHeight: 1.5 }}>
            ℹ️ Las posiciones son aproximadas. Después de aplicar podrás arrastrar cada elemento a su ubicación exacta en el plano.
          </div>
        </div>

        <div style={{ padding: "14px 20px", borderTop: `1px solid ${C.grayLight}`, display: "flex", gap: 10, flexShrink: 0 }}>
          <button className="btn-outline" onClick={onClose} style={{ flex: 1 }}>
            Cancelar
          </button>
          <button className="btn-primary" onClick={onConfirm} style={{ flex: 2, borderRadius: 12 }}>
            <ChevronRight size={14} /> Siguiente: detalles del edificio
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Building Details Modal ─────────────────────────────────── */
function BuildingDetailsModal({
  prefill, onGenerate, onBack,
}: {
  prefill: { nombre?: string; pisos?: string; infoAdicional?: string };
  onGenerate: (details: BuildingDetails) => void;
  onBack: () => void;
}) {
  const [form, setForm] = useState<BuildingDetails>({
    nombre:          prefill.nombre          || "",
    tipo:            "Residencial",
    pisos:           prefill.pisos           || "",
    forma:           "Rectangular",
    unidadesPorPiso: "",
    escaleras:       "2",
    tieneAscensores: true,
    descripcion:     prefill.infoAdicional   || "",
  });

  const set = (k: keyof BuildingDetails, v: string | boolean) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const labelStyle: React.CSSProperties = {
    display: "block", fontSize: 11, fontWeight: 700, color: C.gray, marginBottom: 4,
  };
  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "8px 12px", borderRadius: 8, border: `1.5px solid ${C.grayLight}`,
    fontSize: 13, color: C.gray, background: C.white, outline: "none", boxSizing: "border-box",
  };
  const selectStyle: React.CSSProperties = { ...inputStyle, cursor: "pointer" };
  const rowStyle: React.CSSProperties = { display: "flex", gap: 12 };

  return (
    <div
      role="dialog" aria-modal="true"
      style={{
        position: "fixed", inset: 0, zIndex: 60,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "rgba(78,82,110,0.40)", backdropFilter: "blur(6px)", padding: 16,
      }}
      onClick={onBack}
    >
      <div
        className="card"
        style={{ width: "100%", maxWidth: 520, maxHeight: "90vh", display: "flex", flexDirection: "column" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: "18px 20px", borderBottom: `1px solid ${C.grayLight}`, display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
          <div style={{ width: 38, height: 38, borderRadius: 12, background: C.blueBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Sparkles size={18} color={C.blue} />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>Detalles del edificio</p>
            <p style={{ margin: 0, fontSize: 11, color: C.grayMid }}>La IA usará esta información para generar un plano más preciso</p>
          </div>
          <button className="icon-btn" onClick={onBack}><ArrowLeft size={16} /></button>
        </div>

        {/* Form */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px", display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Nombre y tipo */}
          <div style={rowStyle}>
            <div style={{ flex: 2 }}>
              <label style={labelStyle}>Nombre del edificio</label>
              <input
                style={inputStyle} value={form.nombre} placeholder="Ej: Torre Alameda"
                onChange={(e) => set("nombre", e.target.value)}
              />
            </div>
            <div style={{ flex: 2 }}>
              <label style={labelStyle}>Tipo de edificio</label>
              <select style={selectStyle} value={form.tipo} onChange={(e) => set("tipo", e.target.value)}>
                {["Residencial", "Oficinas", "Hospital", "Hotel", "Comercial", "Industrial", "Mixto"].map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Pisos y forma */}
          <div style={rowStyle}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>N° de pisos</label>
              <input
                style={inputStyle} value={form.pisos} placeholder="Ej: 12"
                onChange={(e) => set("pisos", e.target.value)}
              />
            </div>
            <div style={{ flex: 2 }}>
              <label style={labelStyle}>Forma de la planta</label>
              <select style={selectStyle} value={form.forma} onChange={(e) => set("forma", e.target.value)}>
                {["Rectangular", "Cuadrada", "En L", "En U", "En T", "Irregular"].map((f) => (
                  <option key={f}>{f}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Unidades y escaleras */}
          <div style={rowStyle}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Unidades por piso</label>
              <input
                style={inputStyle} value={form.unidadesPorPiso} placeholder="Ej: 8"
                onChange={(e) => set("unidadesPorPiso", e.target.value)}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Núcleos de escalera</label>
              <select style={selectStyle} value={form.escaleras} onChange={(e) => set("escaleras", e.target.value)}>
                <option value="1">1 escalera</option>
                <option value="2">2 escaleras</option>
                <option value="3">3 o más</option>
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Ascensores</label>
              <select
                style={selectStyle}
                value={form.tieneAscensores ? "si" : "no"}
                onChange={(e) => set("tieneAscensores", e.target.value === "si")}
              >
                <option value="si">Sí</option>
                <option value="no">No</option>
              </select>
            </div>
          </div>

          {/* Descripción libre */}
          <div>
            <label style={labelStyle}>Descripción adicional (opcional)</label>
            <textarea
              style={{ ...inputStyle, minHeight: 72, resize: "vertical", fontFamily: "inherit" }}
              value={form.descripcion}
              placeholder="Ej: Hay un hall de entrada amplio, bodega subterránea, terraza en último piso, lobby doble altura..."
              onChange={(e) => set("descripcion", e.target.value)}
            />
          </div>

          <div style={{ background: C.greenBg, borderRadius: 10, padding: "10px 14px", fontSize: 11, color: C.green, lineHeight: 1.5 }}>
            ✨ La IA generará el plano arquitectónico usando estos datos. Después podrás ajustar los elementos sobre el plano.
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: "14px 20px", borderTop: `1px solid ${C.grayLight}`, display: "flex", gap: 10, flexShrink: 0 }}>
          <button className="btn-outline" onClick={onBack} style={{ flex: 1 }}>
            <ArrowLeft size={14} /> Volver
          </button>
          <button className="btn-primary" onClick={() => onGenerate(form)} style={{ flex: 2, borderRadius: 12 }}>
            <Sparkles size={14} /> Generar plano
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── AI Suggestions Panel ───────────────────────────────────── */
const SUGGESTION_TYPE_MAP: Record<string, { type: string; tool: typeof TOOLS[string] }> = {
  salidas:    { type: "salida",   tool: TOOLS.salida   },
  extintores: { type: "extintor", tool: TOOLS.extintor },
  puntos:     { type: "punto",    tool: TOOLS.punto    },
  mangueras:  { type: "manguera", tool: TOOLS.manguera },
};

function AISuggestionsPanel({ suggestions, onAccept, onAcceptRoute, onClose }: {
  suggestions: AISuggestion;
  onAccept: (type: string, coords: { x: number; y: number; label: string; detail: string }) => void;
  onAcceptRoute: (points: Point[]) => void;
  onClose: () => void;
}) {
  const [addedRoutes, setAddedRoutes] = useState(new Set<number>());

  const allElements = Object.entries(SUGGESTION_TYPE_MAP).flatMap(([key, { type, tool }]) =>
    ((suggestions as any)[key] || []).map((s: any) => ({ ...s, type, tool, key: `${type}-${s.x}-${s.y}` }))
  );

  const routes = suggestions.rutas || [];
  const hasContent = allElements.length > 0 || routes.length > 0;

  const handleAddRoute = (route: { points: Point[] }, idx: number) => {
    onAcceptRoute(route.points);
    setAddedRoutes((prev) => new Set([...prev, idx]));
  };

  return (
    <div className="slide-in" style={{
      position: "absolute", top: 60, right: 16, width: 300, zIndex: 25,
      background: "white", borderRadius: 16,
      boxShadow: "0 8px 32px rgba(78,82,110,0.16)", border: `1px solid ${C.grayLight}`,
      overflow: "hidden",
    }}>
      <div style={{
        padding: "12px 16px", borderBottom: `1px solid ${C.grayLight}`,
        display: "flex", alignItems: "center", gap: 8, background: C.greenBg,
      }}>
        <ScanSearch size={15} color={C.green} />
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: C.gray }}>Análisis IA del plano</p>
        </div>
        <button className="icon-btn" onClick={onClose} aria-label="Cerrar"><X size={14} /></button>
      </div>

      {suggestions.resumen && (
        <div style={{
          padding: "10px 16px", borderBottom: `1px solid #F0F2F6`,
          fontSize: 11, color: C.grayMid, lineHeight: 1.6,
        }}>
          {suggestions.resumen}
        </div>
      )}

      <div style={{ maxHeight: 380, overflowY: "auto" }}>
        {allElements.length > 0 && (
          <div style={{ padding: "12px 16px", borderBottom: routes.length > 0 ? `1px solid #F0F2F6` : "none" }}>
            <p className="sidebar-label" style={{ marginBottom: 8 }}>Elementos sugeridos</p>
            {allElements.map((s: any) => {
              const Icon = s.tool.icon;
              return (
                <div key={s.key} className="suggestion-card">
                  <div style={{
                    width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                    background: s.tool.bg, display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Icon size={14} color={s.tool.color} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: C.gray }}>{s.label}</p>
                    <p style={{ margin: "2px 0 4px", fontSize: 11, color: C.grayMid, lineHeight: 1.4 }}>{s.razon}</p>
                    <button
                      onClick={() => onAccept(s.type, { x: s.x, y: s.y, label: s.label, detail: s.razon })}
                      style={{
                        display: "inline-flex", alignItems: "center", gap: 4,
                        fontSize: 11, fontWeight: 600, color: C.green,
                        background: C.greenBg, border: "none", borderRadius: 6,
                        padding: "4px 8px", cursor: "pointer", fontFamily: "inherit",
                      }}
                    >
                      <Plus size={11} /> Agregar al plano
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {routes.length > 0 && (
          <div style={{ padding: "12px 16px" }}>
            <p className="sidebar-label" style={{ marginBottom: 8 }}>Rutas de evacuación sugeridas</p>
            {routes.map((r, idx) => {
              const added = addedRoutes.has(idx);
              return (
                <div key={idx} className="suggestion-card">
                  <div style={{
                    width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                    background: C.blueBg, display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Route size={14} color={C.blue} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: C.gray }}>{r.label}</p>
                    <p style={{ margin: "2px 0 4px", fontSize: 11, color: C.grayMid, lineHeight: 1.4 }}>{r.razon}</p>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <button
                        onClick={() => handleAddRoute(r, idx)}
                        disabled={added}
                        style={{
                          display: "inline-flex", alignItems: "center", gap: 4,
                          fontSize: 11, fontWeight: 600,
                          color: added ? C.grayMid : C.blue,
                          background: added ? C.grayLight : C.blueBg,
                          border: "none", borderRadius: 6,
                          padding: "4px 8px", cursor: added ? "default" : "pointer", fontFamily: "inherit",
                        }}
                      >
                        {added
                          ? <><CheckCircle size={11} /> Agregada</>
                          : <><Plus size={11} /> Agregar ruta</>
                        }
                      </button>
                      <span style={{ fontSize: 10, color: C.grayMid }}>{r.points?.length || 0} pts</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!hasContent && (
          <div style={{ padding: "16px", textAlign: "center" }}>
            <p style={{ fontSize: 12, color: C.grayMid }}>Sin sugerencias disponibles.</p>
          </div>
        )}
      </div>

      <div style={{
        padding: "10px 16px", borderTop: `1px solid #F0F2F6`,
        display: "flex", justifyContent: "center",
      }}>
        <button
          onClick={onClose}
          style={{ fontSize: 11, color: C.grayMid, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}
        >
          Cerrar sugerencias
        </button>
      </div>
    </div>
  );
}

/* ════ RESIDENT VIEW ════════════════════════════════════════════ */
function ResidentView({ plan, onBack }: { plan: Plan; onBack: () => void }) {
  const [hoveredEl, setHoveredEl]         = useState<number | null>(null);
  const [emergency, setEmergency]         = useState(false);
  const [showAI, setShowAI]               = useState(false);
  const [fieldValues, setFieldValues]     = useState<Record<string, string>>({});
  const [emergencyType, setEmergencyType] = useState("incendio");

  const activeFields = useMemo(
    () => (plan.buildingCtx?.locationFields || DEFAULT_LOCATION_FIELDS).filter((f) => f.enabled),
    [plan.buildingCtx?.locationFields]
  );

  const userLocation = useMemo(
    () => activeFields.map((f) => `${f.label}: ${fieldValues[f.id] || "—"}`).join(" · "),
    [activeFields, fieldValues]
  );

  const locationComplete = useMemo(
    () => activeFields.some((f) => (fieldValues[f.id] || "").trim()),
    [activeFields, fieldValues]
  );

  const { suggestion, loading: loadingAI, error: aiError, ask: handleAsk } = useAI({
    plan, userLocation, emergencyType,
  });

  const routeColor = emergency ? C.red : C.blue;

  const setField = useCallback((id: string, value: string) => {
    setFieldValues((prev) => ({ ...prev, [id]: value }));
  }, []);

  const visibleElements = useMemo(
    () => emergency
      ? (plan.elements || []).filter((el) => CRITICAL_TYPES.has(el.type))
      : (plan.elements || []),
    [plan.elements, emergency]
  );

  return (
    <div className="app-root" style={{ display: "flex", flexDirection: "column", position: "fixed", inset: 0, zIndex: 60 }}>
      <header style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "12px 20px", background: "white",
        borderBottom: `1px solid ${C.grayLight}`, flexShrink: 0,
        boxShadow: "0 1px 4px rgba(78,82,110,0.06)",
      }}>
        <button className="icon-btn" onClick={onBack} aria-label="Volver"><ArrowLeft size={16} /></button>
        <div style={{
          width: 28, height: 28, borderRadius: 8, background: C.greenBg,
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14,
        }}>🏢</div>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 700 }}>{plan.name || "Plan de Evacuación"}</p>
          <p style={{ margin: 0, fontSize: 11, color: C.grayMid, fontWeight: 400 }}>Vista Residente</p>
        </div>
        <button
          onClick={() => setShowAI((v) => !v)}
          aria-pressed={showAI}
          style={{
            display: "flex", alignItems: "center", gap: 6, padding: "7px 14px",
            borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
            border: `1.5px solid ${showAI ? C.green : C.grayLight}`,
            background: showAI ? C.greenBg : "white",
            color: showAI ? C.green : C.grayMid,
          }}
        >
          <Sparkles size={12} /> Ruta IA
        </button>
        <button
          onClick={() => setEmergency((v) => !v)}
          aria-pressed={emergency}
          style={{
            display: "flex", alignItems: "center", gap: 6, padding: "7px 14px",
            borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
            border: `1.5px solid ${emergency ? C.red : "#FFE4E6"}`,
            background: emergency ? C.red : "#FFF5F5",
            color: emergency ? "white" : C.red,
          }}
        >
          <AlertTriangle size={12} /> {emergency ? "🚨" : "Emergencia"}
        </button>
      </header>

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <div style={{ flex: 1, position: "relative", overflow: "hidden", background: "#F0F2F5" }}>
          {plan.image
            ? <img src={plan.image} alt="Plano de evacuación" style={{ width: "100%", height: "100%", objectFit: "contain", userSelect: "none" }} draggable={false} />
            : <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: C.grayMid, fontSize: 14, fontWeight: 600 }}>Sin imagen de plano</div>
          }
          <RouteLayer routes={plan.routes || []} currentRoute={null} routeColor={routeColor} emergency={emergency} markerId="arrR" />
          {visibleElements.map((el) => (
            <ElementPin
              key={el.id} el={el} emergency={emergency}
              showTooltip={hoveredEl === el.id}
              onMouseEnter={() => setHoveredEl(el.id)}
              onMouseLeave={() => setHoveredEl(null)}
            />
          ))}
        </div>

        {showAI && (
          <aside style={{
            width: 300, flexShrink: 0, background: "white",
            borderLeft: `1px solid ${C.grayLight}`, display: "flex",
            flexDirection: "column", overflow: "hidden",
          }}>
            <div style={{
              padding: "14px 16px", borderBottom: `1px solid #F0F2F6`,
              display: "flex", alignItems: "center", gap: 8, background: C.greenBg,
            }}>
              <Sparkles size={14} color={C.green} />
              <p style={{ margin: 0, fontSize: 13, fontWeight: 700 }}>Sugerencia de Ruta IA</p>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 14 }}>

              <section>
                <p className="sidebar-label" style={{ marginBottom: 8 }}>¿Desde dónde partes?</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {activeFields.map((f) => (
                    <div key={f.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 11, color: C.grayMid, width: 60, flexShrink: 0, textAlign: "right", fontWeight: 500 }}>{f.label}</span>
                      <input
                        className="input-field"
                        value={fieldValues[f.id] || ""}
                        onChange={(e) => setField(f.id, e.target.value)}
                        placeholder={f.placeholder}
                        aria-label={f.label}
                        style={{ fontSize: 12 }}
                      />
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <p className="sidebar-label" style={{ marginBottom: 8 }}>Tipo de emergencia</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                  {EMERGENCY_TYPES.map((t) => {
                    const active = emergencyType === t.id;
                    return (
                      <button
                        key={t.id}
                        onClick={() => setEmergencyType(t.id)}
                        aria-pressed={active}
                        style={{
                          padding: "8px 6px", borderRadius: 10, fontSize: 11,
                          textAlign: "left", cursor: "pointer", fontFamily: "inherit", fontWeight: 500,
                          border: `1.5px solid ${active ? C.green : C.grayLight}`,
                          background: active ? C.greenBg : "white",
                          color: active ? C.green : C.gray,
                        }}
                      >
                        {t.label}
                      </button>
                    );
                  })}
                </div>
              </section>

              {plan.buildingCtx?.extra && (
                <div style={{
                  background: C.blueBg, borderRadius: 10, borderLeft: `3px solid ${C.blue}`,
                  padding: "10px 12px", fontSize: 11, color: C.gray, display: "flex", gap: 6,
                }}>
                  <span>ℹ️</span><span style={{ lineHeight: 1.5 }}>{plan.buildingCtx.extra}</span>
                </div>
              )}

              <button
                className="btn-primary"
                onClick={handleAsk}
                disabled={loadingAI || !locationComplete}
                style={{ width: "100%", borderRadius: 12 }}
              >
                {loadingAI
                  ? <><Loader2 size={14} className="spin" />Analizando…</>
                  : <><Sparkles size={14} />Generar ruta sugerida</>
                }
              </button>

              {aiError && (
                <div style={{
                  background: "#FFF5F5", border: `1px solid ${C.redBg}`,
                  borderRadius: 10, padding: "10px 12px", fontSize: 11, color: C.red, lineHeight: 1.5,
                }}>
                  {aiError}
                </div>
              )}

              {suggestion && (
                <div className="card" style={{ padding: 16 }}>
                  <div style={{
                    display: "flex", alignItems: "center", gap: 8,
                    marginBottom: 12, paddingBottom: 10, borderBottom: `1px solid #F0F2F6`,
                  }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: 8, background: C.blueBg,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <BotMessageSquare size={13} color={C.blue} />
                    </div>
                    <p style={{ margin: 0, fontSize: 11, fontWeight: 700 }}>Instrucciones de evacuación</p>
                  </div>
                  <div style={{ fontSize: 11, color: C.gray, lineHeight: 1.6 }}>
                    <MarkdownText text={suggestion} />
                  </div>
                  <button
                    onClick={handleAsk}
                    style={{
                      marginTop: 12, width: "100%", display: "flex", alignItems: "center",
                      justifyContent: "center", gap: 6, fontSize: 11, color: C.grayMid,
                      background: C.bg, border: `1px solid ${C.grayLight}`,
                      borderRadius: 8, padding: "6px", cursor: "pointer", fontFamily: "inherit",
                    }}
                  >
                    <RefreshCw size={11} /> Regenerar
                  </button>
                </div>
              )}

              {!suggestion && !loadingAI && (
                <p style={{ fontSize: 11, color: C.grayMid, textAlign: "center", lineHeight: 1.6 }}>
                  Ingresa tu ubicación y tipo de emergencia para obtener instrucciones personalizadas.
                </p>
              )}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}

/* ════ ENTRY SCREEN ═════════════════════════════════════════════ */
function EntryScreen({ onAdmin, onResident, initialCode = "" }: {
  onAdmin: (plan?: Plan, draftId?: string) => void;
  onResident: (plan: Plan, code: string) => void;
  initialCode?: string;
}) {
  const [code, setCode]             = useState(initialCode);
  const [err, setErr]               = useState("");
  const [loading, setLoading]       = useState(false);
  const [drafts, setDrafts] = useState<Array<{ draftId: string; name: string; savedAt: string; noImage?: boolean; _data: Plan }>>([]);

  // Load admin drafts from localStorage on mount
  useEffect(() => {
    try {
      const indexRaw = storage.get("drafts:index");
      if (!indexRaw) return;
      const index: Array<{ draftId: string; name: string; savedAt: string; noImage?: boolean }> = JSON.parse(indexRaw);
      const loaded = index.map((entry) => {
        const raw = storage.get(`draft:${entry.draftId}`);
        if (!raw) return null;
        return { ...entry, _data: JSON.parse(raw) as Plan };
      }).filter(Boolean) as Array<{ draftId: string; name: string; savedAt: string; noImage?: boolean; _data: Plan }>;
      setDrafts(loaded);
    } catch { /* ignore */ }
  }, []);

  const handleJoin = useCallback(async () => {
    const c = code.trim().toUpperCase();
    if (c.length < 6) { setErr("Ingresa el código de 6 caracteres."); return; }
    setLoading(true);
    setErr("");
    try {
      // Try Supabase first, fallback to localStorage cache
      const res = await fetch(`/api/plans/${c}`);
      if (res.ok) {
        const { data } = await res.json();
        onResident(data, c);
        return;
      }
      const val = storage.get(`plan:${c}`);
      if (val) { onResident(JSON.parse(val), c); return; }
      setErr("Plan no encontrado. Verifica el código.");
    } catch {
      setErr("Error de conexión. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }, [code, onResident]);

  return (
    <div className="app-root" style={{
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 24, position: "fixed", inset: 0, zIndex: 60, overflow: "hidden",
    }}>
      <div style={{
        position: "absolute", top: -80, right: -80,
        width: 280, height: 280, borderRadius: "0 0 0 100%",
        background: C.blueBg, pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", bottom: -50, left: -50,
        width: 180, height: 180, borderRadius: "0 100% 0 0",
        background: C.greenBg, pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", bottom: 80, right: 40,
        width: 80, height: 80, borderRadius: "50%",
        background: C.yellowBg, pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", top: 40, left: 40,
        width: 50, height: 50, borderRadius: "50%",
        background: C.redBg, pointerEvents: "none",
      }} />

      <div style={{ width: "100%", maxWidth: 360, position: "relative" }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{
            width: 68, height: 68, borderRadius: 22, background: C.greenBg,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 34, margin: "0 auto 14px",
            boxShadow: `0 6px 20px rgba(76,191,140,0.25)`,
          }}>🏢</div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: C.gray, letterSpacing: -0.3 }}>Plan de Evacuación</h1>
          <p style={{ margin: "6px 0 0", fontSize: 13, color: C.grayMid, fontWeight: 400 }}>
            Gestor Interactivo · Sugerencias IA
          </p>
        </div>

        <div className="card" style={{ padding: 20, marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 10, background: C.blueBg,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <LogIn size={16} color={C.blue} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>Soy Residente</p>
              <p style={{ margin: 0, fontSize: 11, color: C.grayMid }}>Ingresa tu código de acceso</p>
            </div>
          </div>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            maxLength={6}
            onKeyDown={(e) => e.key === "Enter" && handleJoin()}
            placeholder="ABC123"
            aria-label="Código de acceso"
            style={{
              width: "100%", background: C.blueBg,
              border: `1.5px solid ${err ? C.red : C.grayLight}`,
              borderRadius: 12, padding: "14px 16px", textAlign: "center",
              fontSize: 24, fontFamily: "Montserrat, system-ui", fontWeight: 700,
              letterSpacing: 8, color: C.gray, outline: "none", boxSizing: "border-box",
              transition: "border-color 0.15s",
            }}
          />
          {err && <p style={{ fontSize: 11, color: C.red, margin: "6px 0 0", fontWeight: 500 }}>{err}</p>}
          <button
            className="btn-primary"
            onClick={handleJoin}
            disabled={loading}
            style={{ width: "100%", marginTop: 10, borderRadius: 12 }}
          >
            {loading ? <><RefreshCw size={13} className="spin" />Buscando…</> : "Ver Plan de Evacuación"}
          </button>
        </div>

        {/* Admin drafts */}
        {drafts.length > 0 && (
          <div className="card" style={{ padding: 16, marginBottom: 14 }}>
            <p style={{ margin: "0 0 10px", fontSize: 11, fontWeight: 700, color: C.grayMid, textTransform: "uppercase", letterSpacing: 0.5 }}>
              📝 Borradores guardados
            </p>
            {drafts.map((d) => (
              <div
                key={d.draftId}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "10px 12px", background: C.bg, border: `1px solid ${C.grayLight}`,
                  borderRadius: 10, marginBottom: 6,
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: C.gray, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{d.name}</p>
                  <p style={{ margin: 0, fontSize: 10, color: C.grayMid }}>
                    {new Date(d.savedAt).toLocaleDateString("es-CL", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                    {d.noImage && <span style={{ color: C.yellow, marginLeft: 6 }}>· sin imagen</span>}
                  </p>
                </div>
                <button
                  onClick={() => onAdmin(d._data, d.draftId)}
                  style={{
                    flexShrink: 0, marginLeft: 8, display: "flex", alignItems: "center", gap: 4,
                    padding: "5px 10px", borderRadius: 8, border: "none", cursor: "pointer",
                    background: C.blueBg, color: C.blue, fontSize: 11, fontWeight: 600, fontFamily: "inherit",
                  }}
                >
                  <MapPin size={11} /> Editar
                </button>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "16px 0" }}>
          <div style={{ flex: 1, height: 1, background: C.grayLight }} />
          <span style={{ color: C.grayMid, fontSize: 12 }}>o</span>
          <div style={{ flex: 1, height: 1, background: C.grayLight }} />
        </div>

        <button className="btn-outline" onClick={() => onAdmin()} style={{ width: "100%" }}>
          <MapPin size={14} color={C.green} /> Soy Administrador — Crear Plan Nuevo
        </button>
      </div>
    </div>
  );
}

/* ════ SHARE MODAL ══════════════════════════════════════════════ */
function ShareModal({ code, planName, onClose, onRegen }: {
  code: string; planName: string; onClose: () => void; onRegen: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const shareUrl = typeof window !== "undefined"
    ? `${window.location.origin}/evacuacion?plan=${code}`
    : `/evacuacion?plan=${code}`;

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [shareUrl]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      role="dialog" aria-modal="true" aria-labelledby="share-modal-title"
      style={{
        position: "fixed", inset: 0, zIndex: 70,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "rgba(78,82,110,0.35)", backdropFilter: "blur(6px)",
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{ padding: 24, width: "100%", maxWidth: 400, margin: 16 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 10, background: C.greenBg,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Share2 size={16} color={C.green} />
            </div>
            <p id="share-modal-title" style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>Plan Publicado</p>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Cerrar"><X size={16} /></button>
        </div>

        <div style={{
          background: C.greenBg, border: `1px solid ${C.green}22`,
          borderRadius: 14, padding: "14px 16px", marginBottom: 16,
        }}>
          <p style={{ margin: "0 0 6px", fontSize: 11, color: C.green, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>
            🔗 Link para residentes
          </p>
          <p style={{ margin: 0, fontSize: 11, color: C.gray, wordBreak: "break-all", lineHeight: 1.5 }}>
            {shareUrl}
          </p>
          <p style={{ margin: "8px 0 0", fontSize: 11, color: C.grayMid }}>{planName || "Plan de Evacuación"}</p>
        </div>

        <div style={{
          background: C.bg, borderRadius: 12, padding: 14, marginBottom: 16,
          fontSize: 11, color: C.gray, lineHeight: 1.8,
        }}>
          <p style={{ margin: "0 0 4px", fontWeight: 700 }}>👤 Para compartir con residentes:</p>
          <p style={{ margin: 0 }}>Envía el link por WhatsApp, email o fíjalo en el cartelón del edificio.</p>
          <p style={{ margin: "4px 0 0", color: C.grayMid }}>El residente solo hace clic → abre el plan directo.</p>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={handleCopy}
            style={{
              flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              padding: "10px", borderRadius: 12, fontSize: 13, fontWeight: 600,
              cursor: "pointer", border: "none", fontFamily: "inherit",
              background: copied ? C.green : C.blue, color: "white", transition: "background 0.2s",
            }}
          >
            {copied ? <><CheckCircle size={13} />¡Link copiado!</> : <><Copy size={13} />Copiar link</>}
          </button>
          <button
            onClick={onRegen}
            aria-label="Regenerar código"
            title="Generar nuevo link"
            style={{
              padding: "10px 14px", background: C.bg, border: `1px solid ${C.grayLight}`,
              borderRadius: 12, color: C.grayMid, cursor: "pointer",
            }}
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Publish Review Modal ───────────────────────────────────── */
function PublishReviewModal({
  planName, floors, extraInfo, blockedZones, mobilityNeeds,
  elements, routes, onConfirm, onCancel, publishing,
}: {
  planName: string; floors: string; extraInfo: string;
  blockedZones: string; mobilityNeeds: boolean;
  elements: Element[]; routes: RouteItem[];
  onConfirm: () => void; onCancel: () => void; publishing: boolean;
}) {
  const counts = {
    salidas:    elements.filter((e) => e.type === "salida").length,
    extintores: elements.filter((e) => e.type === "extintor").length,
    puntos:     elements.filter((e) => e.type === "punto").length,
    mangueras:  elements.filter((e) => e.type === "manguera").length,
  };

  const warnings: string[] = [];
  if (counts.salidas === 0)    warnings.push("No hay salidas de emergencia marcadas");
  if (counts.puntos === 0)     warnings.push("No hay puntos de encuentro marcados");
  if (routes.length === 0)     warnings.push("No hay rutas de evacuación dibujadas");

  const TYPE_INFO = [
    { key: "salidas",    label: "Salidas",              icon: "🚪", color: C.green,  bg: C.greenBg  },
    { key: "extintores", label: "Extintores",           icon: "🧯", color: C.red,    bg: C.redBg    },
    { key: "puntos",     label: "Puntos de Encuentro",  icon: "👥", color: C.yellow, bg: C.yellowBg },
    { key: "mangueras",  label: "Mangueras",            icon: "💧", color: C.blue,   bg: C.blueBg   },
  ] as const;

  return (
    <div
      role="dialog" aria-modal="true"
      style={{
        position: "fixed", inset: 0, zIndex: 70,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "rgba(78,82,110,0.40)", backdropFilter: "blur(6px)", padding: 16,
      }}
      onClick={onCancel}
    >
      <div
        className="card"
        style={{ width: "100%", maxWidth: 500, maxHeight: "90vh", display: "flex", flexDirection: "column" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: "18px 20px", borderBottom: `1px solid ${C.grayLight}`, display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
          <div style={{ width: 38, height: 38, borderRadius: 12, background: C.greenBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Share2 size={18} color={C.green} />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>Verificar antes de publicar</p>
            <p style={{ margin: 0, fontSize: 11, color: C.grayMid }}>Revisa que todo esté correcto</p>
          </div>
          <button className="icon-btn" onClick={onCancel}><X size={16} /></button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px", display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Warnings */}
          {warnings.length > 0 && (
            <div style={{ background: C.yellowBg, borderRadius: 12, padding: "12px 16px", border: `1px solid ${C.yellow}55` }}>
              <p style={{ margin: "0 0 6px", fontSize: 12, fontWeight: 700, color: "#92400E" }}>⚠️ Recomendaciones</p>
              {warnings.map((w, i) => (
                <p key={i} style={{ margin: "3px 0", fontSize: 11, color: "#92400E" }}>• {w}</p>
              ))}
              <p style={{ margin: "8px 0 0", fontSize: 10, color: C.grayMid }}>Puedes publicar igual, pero considera completar estos elementos.</p>
            </div>
          )}

          {/* Building config */}
          <div>
            <p style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 700, color: C.grayMid, textTransform: "uppercase", letterSpacing: 0.5 }}>Configuración del edificio</p>
            <div style={{ background: C.bg, borderRadius: 12, padding: "12px 16px", display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                <span style={{ color: C.grayMid }}>Nombre</span>
                <span style={{ fontWeight: 600, color: C.gray }}>{planName || "—"}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                <span style={{ color: C.grayMid }}>Pisos</span>
                <span style={{ fontWeight: 600, color: C.gray }}>{floors || "—"}</span>
              </div>
              {extraInfo && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                  <span style={{ color: C.grayMid, flexShrink: 0, marginRight: 8 }}>Info adicional</span>
                  <span style={{ fontWeight: 500, color: C.gray, textAlign: "right" }}>{extraInfo}</span>
                </div>
              )}
              {blockedZones && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                  <span style={{ color: C.grayMid, flexShrink: 0, marginRight: 8 }}>Zonas bloqueadas</span>
                  <span style={{ fontWeight: 500, color: C.red, textAlign: "right" }}>{blockedZones}</span>
                </div>
              )}
              {mobilityNeeds && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: C.blue }}>
                  <CheckCircle size={12} /><span>Incluye indicaciones de movilidad reducida</span>
                </div>
              )}
            </div>
          </div>

          {/* Element counts */}
          <div>
            <p style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 700, color: C.grayMid, textTransform: "uppercase", letterSpacing: 0.5 }}>Elementos en el plano</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {TYPE_INFO.map(({ key, label, icon, color, bg }) => {
                const count = counts[key as keyof typeof counts];
                const missing = (key === "salidas" || key === "puntos") && count === 0;
                return (
                  <div key={key} style={{
                    display: "flex", alignItems: "center", gap: 10,
                    background: missing ? "#FFF5F5" : bg,
                    borderRadius: 10, padding: "10px 12px",
                    border: `1px solid ${missing ? C.red + "33" : "transparent"}`,
                  }}>
                    <span style={{ fontSize: 18, fontWeight: 700, color: missing ? C.red : color }}>{count}</span>
                    <div>
                      <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: C.gray }}>{icon} {label}</p>
                      {missing && <p style={{ margin: 0, fontSize: 10, color: C.red }}>Recomendado</p>}
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{
              display: "flex", alignItems: "center", gap: 10, marginTop: 8,
              background: routes.length === 0 ? "#FFF5F5" : C.blueBg,
              borderRadius: 10, padding: "10px 12px",
              border: `1px solid ${routes.length === 0 ? C.red + "33" : "transparent"}`,
            }}>
              <span style={{ fontSize: 18, fontWeight: 700, color: routes.length === 0 ? C.red : C.blue }}>{routes.length}</span>
              <div>
                <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: C.gray }}>➡️ Rutas de evacuación</p>
                {routes.length === 0 && <p style={{ margin: 0, fontSize: 10, color: C.red }}>Recomendado</p>}
              </div>
            </div>
          </div>

          <div style={{ background: C.greenBg, borderRadius: 10, padding: "10px 14px", fontSize: 11, color: C.green, lineHeight: 1.5 }}>
            ✅ Una vez publicado, los residentes podrán acceder al plan mediante el link que se generará.
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: "14px 20px", borderTop: `1px solid ${C.grayLight}`, display: "flex", gap: 10, flexShrink: 0 }}>
          <button className="btn-outline" onClick={onCancel} style={{ flex: 1 }}>
            <ArrowLeft size={14} /> Seguir editando
          </button>
          <button
            className="btn-primary"
            onClick={onConfirm}
            disabled={publishing}
            style={{ flex: 2, borderRadius: 12, background: C.green }}
          >
            {publishing
              ? <><RefreshCw size={13} className="spin" />Publicando…</>
              : <><Share2 size={13} />Publicar y compartir link</>
            }
          </button>
        </div>
      </div>
    </div>
  );
}

/* ════ ADMIN EDITOR ═════════════════════════════════════════════ */
function AdminEditor({ onBack, initialPlan, draftId: initDraftId }: {
  onBack: () => void;
  initialPlan?: Plan;
  draftId?: string;
}) {
  const [image, setImage]               = useState<string | null>(initialPlan?.image ?? null);
  const [isViewMode, setIsViewMode]     = useState(false);
  const [emergency, setEmergency]       = useState(false);
  const [hoveredEl, setHoveredEl]       = useState<number | null>(null);
  const [planName, setPlanName]         = useState(initialPlan?.name ?? "Mi Edificio");
  const [shareCode, setShareCode]       = useState<string | null>(null);
  const [showShare, setShowShare]       = useState(false);
  const [saving, setSaving]             = useState(false);
  const [savingDraft, setSavingDraft]     = useState(false);
  const [draftSaved, setDraftSaved]       = useState(false);
  const [draftNoImage, setDraftNoImage]   = useState(false);
  const [showPublishReview, setShowPublishReview] = useState(false);
  const [draftId]                         = useState<string>(() => initDraftId ?? crypto.randomUUID());
  const [showCtx, setShowCtx]           = useState(false);
  const [floors, setFloors]             = useState(initialPlan?.buildingCtx?.floors ?? "1");
  const [extraInfo, setExtraInfo]       = useState(initialPlan?.buildingCtx?.extra ?? "");
  const [blockedZones, setBlockedZones] = useState(initialPlan?.buildingCtx?.blocked ?? "");
  const [mobilityNeeds, setMobilityNeeds] = useState(initialPlan?.buildingCtx?.mobility ?? false);
  const [locationFields, setLocationFields] = useState<LocationField[]>(
    initialPlan?.buildingCtx?.locationFields ?? DEFAULT_LOCATION_FIELDS
  );

  const [aiSuggestions, setAiSuggestions]     = useState<AISuggestion | null>(null);
  const [analyzingPlan, setAnalyzingPlan]     = useState(false);
  const [analyzeError, setAnalyzeError]       = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [pdfAnalyzing, setPdfAnalyzing]   = useState(false);
  const [pdfExtracted, setPdfExtracted]   = useState<PDFExtracted | null>(null);
  const [showPdfReview, setShowPdfReview]           = useState(false);
  const [showBuildingDetails, setShowBuildingDetails] = useState(false);
  const [pdfError, setPdfError]                     = useState<string | null>(null);
  const [generatingPlan, setGeneratingPlan]         = useState(false);
  const [planGenError, setPlanGenError]             = useState<string | null>(null);
  const [lastDetails, setLastDetails]               = useState<BuildingDetails | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);
  const pdfRef  = useRef<HTMLInputElement>(null);
  const {
    elements, routes, activeTool, currentRoute, canvasRef,
    handleCanvasClick, finishRoute, removeElement, removeRoute, moveElement,
    selectTool, reset, addElement, addRoute, loadPlan,
  } = useMapEditor();

  const getCanvasRect = useCallback(() => canvasRef.current?.getBoundingClientRect() ?? null, [canvasRef]);

  // Load initial plan elements/routes when editing a saved plan (run once on mount)
  useEffect(() => {
    if (initialPlan?.elements || initialPlan?.routes) {
      loadPlan(initialPlan.elements ?? [], initialPlan.routes ?? []);
    }
  }, []);

  const routeColor = emergency ? C.red : C.blue;

  const toggleField = useCallback((id: string) => {
    setLocationFields((prev) => prev.map((f) => f.id === id ? { ...f, enabled: !f.enabled } : f));
  }, []);

  const renameField = useCallback((id: string, val: string) => {
    setLocationFields((prev) => prev.map((f) => f.id === id ? { ...f, label: val } : f));
  }, []);

  const handleFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type === "application/pdf") { alert("Usa JPG/PNG para el plano de imagen."); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImage(ev.target?.result as string);
      reset();
      setAiSuggestions(null);
      setShowSuggestions(false);
      setAnalyzeError(null);
    };
    reader.readAsDataURL(file);
  }, [reset]);

  const handlePdfFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPdfError(null);
    setPdfAnalyzing(true);
    setPdfExtracted(null);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const result = await analyzeEmergencyPlanPDF(ev.target?.result as string);
        setPdfExtracted(result);
        setShowPdfReview(true);
      } catch (err: any) {
        setPdfError(`Error al analizar PDF: ${err.message}`);
      } finally {
        setPdfAnalyzing(false);
      }
    };
    reader.readAsDataURL(file);
  }, []);

  // Step 1: PDF review → open building details modal
  const handleOpenBuildingDetails = useCallback(() => {
    setShowPdfReview(false);
    setShowBuildingDetails(true);
  }, []);

  // Step 2: Building details confirmed → apply elements + generate SVG
  const handleApplyPdf = useCallback(async (details: BuildingDetails) => {
    if (!pdfExtracted) return;
    const { edificio, salidas, extintores, puntos, mangueras, rutas } = pdfExtracted;
    setPlanName(details.nombre || edificio?.nombre || "Mi Edificio");
    setFloors(details.pisos || edificio?.pisos?.toString() || "1");
    if (details.descripcion) setExtraInfo(details.descripcion);
    if (edificio?.zonasBlockeadas) setBlockedZones(edificio.zonasBlockeadas);
    reset();
    const addEl = (type: string, items?: Array<{ x: number; y: number; label: string; razon?: string }>) => {
      (items || []).forEach((s) => addElement(type, { x: s.x, y: s.y, label: s.label, detail: s.razon || "" }));
    };
    addEl("salida", salidas);
    addEl("extintor", extintores);
    addEl("punto", puntos);
    addEl("manguera", mangueras);
    (rutas || []).forEach((r) => addRoute(r.points));
    setShowBuildingDetails(false);
    setShowCtx(true);

    // Generar plano arquitectónico con IA usando datos extraídos + detalles del usuario
    setLastDetails(details);
    setPlanGenError(null);
    setGeneratingPlan(true);
    setImage(BLANK_CANVAS);
    try {
      const svgDataUrl = await generateFloorPlanSVG(pdfExtracted, details);
      setImage(svgDataUrl);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("Error generando plano SVG:", msg);
      setPlanGenError(msg);
    } finally {
      setGeneratingPlan(false);
    }
  }, [pdfExtracted, reset, addElement, addRoute, setImage]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile({ target: { files: e.dataTransfer.files } } as React.ChangeEvent<HTMLInputElement>);
  }, [handleFile]);

  const handleAnalyzePlan = useCallback(async () => {
    if (!image) return;
    setAnalyzingPlan(true);
    setAiSuggestions(null);
    setAnalyzeError(null);
    setShowSuggestions(false);
    try {
      const result = await analyzeFloorPlan(image);
      setAiSuggestions(result);
      setShowSuggestions(true);
    } catch (e: any) {
      setAnalyzeError(`No se pudo analizar el plano: ${e.message}`);
    } finally {
      setAnalyzingPlan(false);
    }
  }, [image]);

  const handleAcceptSuggestion = useCallback((type: string, coords: { x: number; y: number; label: string; detail: string }) => {
    addElement(type, coords);
  }, [addElement]);

  const handleAcceptRoute = useCallback((points: Point[]) => {
    addRoute(points);
  }, [addRoute]);

  const publishPlan = useCallback(async (code: string) => {
    setSaving(true);
    const planData = {
      name: planName, image, elements, routes,
      buildingCtx: {
        name: planName, floors, extra: extraInfo,
        blocked: blockedZones, mobility: mobilityNeeds, locationFields,
      },
      publishedAt: new Date().toISOString(),
    };
    try {
      // Save to Supabase via API (cross-device sharing)
      const res = await fetch("/api/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, name: planName, data: planData }),
      });
      if (!res.ok) throw new Error("Error al guardar en servidor");
      // Also keep a localStorage cache for quick access
      storage.set(`plan:${code}`, JSON.stringify(planData));
      setShareCode(code);
      setShowShare(true);
    } catch (e) {
      console.error("Error al publicar:", e);
      // Fallback: save only to localStorage
      storage.set(`plan:${code}`, JSON.stringify(planData));
      setShareCode(code);
      setShowShare(true);
    } finally {
      setSaving(false);
    }
  }, [planName, image, elements, routes, floors, extraInfo, blockedZones, mobilityNeeds, locationFields]);

  const saveDraft = useCallback(() => {
    setSavingDraft(true);
    setDraftNoImage(false);
    const basePlan: Plan = {
      name: planName, elements, routes,
      buildingCtx: {
        name: planName, floors, extra: extraInfo,
        blocked: blockedZones, mobility: mobilityNeeds, locationFields,
      },
    };
    // Try saving with image; if > 2 MB, save without it to avoid QuotaExceededError
    const withImage = JSON.stringify({ ...basePlan, image });
    let noImgSave = false;
    if (withImage.length > 2_000_000) {
      noImgSave = true;
      storage.set(`draft:${draftId}`, JSON.stringify({ ...basePlan, image: null }));
    } else {
      storage.set(`draft:${draftId}`, withImage);
    }
    try {
      // Update drafts index
      const indexRaw = storage.get("drafts:index");
      const index: Array<{ draftId: string; name: string; savedAt: string; noImage?: boolean }> = indexRaw
        ? JSON.parse(indexRaw) : [];
      const existing = index.findIndex((d) => d.draftId === draftId);
      const entry = { draftId, name: planName, savedAt: new Date().toISOString(), noImage: noImgSave };
      if (existing >= 0) index[existing] = entry; else index.unshift(entry);
      storage.set("drafts:index", JSON.stringify(index));
      setDraftSaved(true);
      if (noImgSave) setDraftNoImage(true);
      setTimeout(() => { setDraftSaved(false); setDraftNoImage(false); }, 3500);
    } catch (e) {
      console.error("Error guardando borrador:", e);
    } finally {
      setSavingDraft(false);
    }
  }, [draftId, planName, image, elements, routes, floors, extraInfo, blockedZones, mobilityNeeds, locationFields]);

  const visibleElements = useMemo(
    () => emergency ? elements.filter((el) => CRITICAL_TYPES.has(el.type)) : elements,
    [elements, emergency]
  );

  const handleToggleViewMode = useCallback(() => {
    setIsViewMode((v) => !v);
    selectTool(null);
  }, [selectTool]);

  const clearPlan = useCallback(() => {
    setImage(null);
    setShareCode(null);
    setAiSuggestions(null);
    setShowSuggestions(false);
    reset();
  }, [reset]);

  return (
    <div className="app-root" style={{ display: "flex", position: "fixed", inset: 0, zIndex: 60 }}>
      {/* SIDEBAR */}
      <nav style={{
        width: 260, flexShrink: 0, background: "white",
        borderRight: `1px solid ${C.grayLight}`, display: "flex",
        flexDirection: "column", overflowY: "auto",
      }}>
        <div className="sidebar-section" style={{ padding: "14px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button className="icon-btn" onClick={onBack} aria-label="Volver"><ArrowLeft size={14} /></button>
            <div style={{
              width: 28, height: 28, borderRadius: 8, background: C.greenBg,
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0,
            }}>🏢</div>
            <input
              value={planName}
              onChange={(e) => setPlanName(e.target.value)}
              aria-label="Nombre del plan"
              style={{
                flex: 1, background: "none", border: "none", color: C.gray,
                fontSize: 13, fontWeight: 700, outline: "none", minWidth: 0, fontFamily: "inherit",
              }}
            />
          </div>
        </div>

        <div className="sidebar-section">
          <button
            onClick={handleToggleViewMode}
            aria-pressed={isViewMode}
            style={{
              width: "100%", display: "flex", alignItems: "center", gap: 8,
              padding: "9px 12px", borderRadius: 10, fontSize: 12, fontWeight: 600,
              cursor: "pointer", border: "none", fontFamily: "inherit",
              background: isViewMode ? C.greenBg : C.bg,
              color: isViewMode ? C.green : C.gray,
            }}
          >
            {isViewMode ? <Eye size={13} color={C.green} /> : <EyeOff size={13} />}
            {isViewMode ? "Vista Vecino — Activa" : "Modo Edición (Admin)"}
          </button>
        </div>

        {!isViewMode && (
          <div className="sidebar-section">
            <span className="sidebar-label">Herramientas</span>
            {Object.values(TOOLS).map((tool) => {
              const Icon   = tool.icon;
              const active = activeTool === tool.id;
              return (
                <button
                  key={tool.id}
                  onClick={() => selectTool(tool.id)}
                  aria-pressed={active}
                  style={{
                    width: "100%", display: "flex", alignItems: "center", gap: 10,
                    padding: "8px 10px", borderRadius: 10, fontSize: 12, cursor: "pointer",
                    border: `1.5px solid ${active ? tool.color : "transparent"}`,
                    background: active ? tool.bg : "transparent",
                    color: active ? tool.color : C.gray, marginBottom: 4,
                    fontFamily: "inherit", fontWeight: 500,
                  }}
                >
                  <div style={{
                    width: 24, height: 24, borderRadius: 7, flexShrink: 0,
                    background: active ? tool.bg : C.bg,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Icon size={13} color={tool.color} />
                  </div>
                  {tool.label}
                  {active && <span style={{ marginLeft: "auto", fontSize: 11, color: tool.color }}>✓</span>}
                </button>
              );
            })}
            {activeTool === "ruta" && currentRoute && (
              <button
                onClick={finishRoute}
                style={{
                  width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  padding: "8px 12px", borderRadius: 10, fontSize: 12, fontWeight: 600,
                  cursor: "pointer", border: "none", background: C.greenBg, color: C.green,
                  marginTop: 8, fontFamily: "inherit",
                }}
              >
                <CheckCircle size={12} /> Finalizar ruta ({currentRoute.length} pts)
              </button>
            )}
          </div>
        )}

        <div className="sidebar-section">
          <button
            onClick={() => setShowCtx((v) => !v)}
            style={{
              width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "8px 10px", borderRadius: 10, fontSize: 12, fontWeight: 600,
              cursor: "pointer", border: "none", background: C.bg, color: C.gray, fontFamily: "inherit",
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Sparkles size={12} color={C.green} /> Configuración del edificio
            </span>
            <ChevronRight size={11} style={{
              transform: showCtx ? "rotate(90deg)" : "none",
              transition: "transform 0.2s", color: C.grayMid,
            }} />
          </button>

          {showCtx && (
            <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
              <div>
                <label className="sidebar-label">Pisos del edificio</label>
                <input
                  className="input-field" type="number" min="1"
                  value={floors} onChange={(e) => setFloors(e.target.value)}
                  aria-label="Número de pisos" style={{ fontSize: 12 }}
                />
              </div>
              <div>
                <label className="sidebar-label">Info adicional</label>
                <textarea
                  className="textarea-field" rows={2} value={extraInfo}
                  onChange={(e) => setExtraInfo(e.target.value)}
                  placeholder="Ej: Torre A de 3 bloques, escalera central..."
                  style={{ fontSize: 12 }}
                />
              </div>
              <div>
                <label className="sidebar-label">Zonas bloqueadas</label>
                <textarea
                  className="textarea-field" rows={2} value={blockedZones}
                  onChange={(e) => setBlockedZones(e.target.value)}
                  placeholder="Ej: Pasillo sur cerrado, puerta trasera con llave..."
                  style={{ fontSize: 12 }}
                />
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 12, color: C.gray, fontWeight: 500 }}>
                <input
                  type="checkbox" checked={mobilityNeeds}
                  onChange={(e) => setMobilityNeeds(e.target.checked)}
                  style={{ accentColor: C.green, width: 14, height: 14 }}
                />
                Personas con movilidad reducida
              </label>

              <div>
                <span className="sidebar-label" style={{ marginBottom: 6 }}>Campos de ubicación para residentes</span>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {locationFields.map((f) => (
                    <div key={f.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <button
                        role="switch" aria-checked={f.enabled}
                        onClick={() => toggleField(f.id)}
                        style={{
                          width: 32, height: 18, borderRadius: 9, flexShrink: 0, position: "relative",
                          background: f.enabled ? C.green : C.grayLight,
                          cursor: "pointer", border: "none", transition: "background 0.2s",
                        }}
                      >
                        <div style={{
                          position: "absolute", top: 2, width: 14, height: 14, borderRadius: 7,
                          background: "white", transition: "left 0.2s", left: f.enabled ? 16 : 2,
                          boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                        }} />
                      </button>
                      <input
                        value={f.label} onChange={(e) => renameField(f.id, e.target.value)} disabled={!f.enabled}
                        style={{
                          flex: 1, borderRadius: 6, padding: "4px 8px", fontSize: 11, outline: "none",
                          border: `1px solid ${f.enabled ? C.grayLight : "#F0F2F6"}`,
                          background: f.enabled ? "white" : C.bg,
                          color: f.enabled ? C.gray : C.grayMid, fontFamily: "inherit",
                        }}
                      />
                    </div>
                  ))}
                </div>
                <p style={{ fontSize: 10, color: C.grayMid, marginTop: 6 }}>Activa los que necesites. Puedes renombrarlos.</p>
              </div>
            </div>
          )}
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px" }}>
          <span className="sidebar-label">Elementos · {elements.length + routes.length}</span>
          {elements.map((el) => {
            const tool = TOOLS[el.type];
            const Icon = tool?.icon || MapPin;
            return (
              <div key={el.id} className="element-row">
                <div style={{
                  width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                  background: tool?.bg || C.bg,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Icon size={11} color={tool?.color} />
                </div>
                <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: C.gray, fontSize: 12, fontWeight: 500 }}>{el.label}</span>
                {!isViewMode && (
                  <button onClick={() => removeElement(el.id)} className="icon-btn" aria-label={`Eliminar ${el.label}`}>
                    <X size={11} />
                  </button>
                )}
              </div>
            );
          })}
          {routes.map((r, i) => (
            <div key={r.id} className="element-row">
              <div style={{
                width: 22, height: 22, borderRadius: 6, flexShrink: 0, background: C.blueBg,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Route size={11} color={C.blue} />
              </div>
              <span style={{ flex: 1, color: C.gray, fontSize: 12, fontWeight: 500 }}>Ruta {i + 1} · {r.points.length} pts</span>
              {!isViewMode && (
                <button onClick={() => removeRoute(r.id)} className="icon-btn" aria-label={`Eliminar ruta ${i + 1}`}>
                  <X size={11} />
                </button>
              )}
            </div>
          ))}
          {elements.length === 0 && routes.length === 0 && (
            <p style={{ fontSize: 11, color: C.grayMid, padding: "4px 0" }}>Sin elementos aún.</p>
          )}
        </div>

        <div style={{ padding: "12px 16px", borderTop: `1px solid #F0F2F6`, display: "flex", flexDirection: "column", gap: 8 }}>
          <button
            onClick={() => setEmergency((v) => !v)}
            aria-pressed={emergency}
            style={{
              width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              padding: "9px 12px", borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: "pointer",
              fontFamily: "inherit",
              border: `1.5px solid ${emergency ? C.red : "#FFE4E6"}`,
              background: emergency ? C.red : "#FFF5F5",
              color: emergency ? "white" : C.red,
            }}
          >
            <AlertTriangle size={13} /> {emergency ? "🚨 EMERGENCIA ACTIVA" : "Modo Emergencia"}
          </button>
          <button
            onClick={saveDraft}
            disabled={savingDraft}
            style={{
              width: "100%", borderRadius: 10, display: "flex", alignItems: "center",
              justifyContent: "center", gap: 6, padding: "8px 12px",
              fontSize: 12, fontWeight: 600, cursor: "pointer", border: "none",
              fontFamily: "inherit", marginBottom: 2,
              background: draftSaved ? C.greenBg : C.bg,
              color: draftSaved ? C.green : C.gray,
              transition: "background 0.3s, color 0.3s",
            }}
          >
            {savingDraft
              ? <><RefreshCw size={12} className="spin" />Guardando…</>
              : draftSaved
                ? <><CheckCircle size={12} />¡Borrador guardado!</>
                : <><KeyRound size={12} />Guardar borrador</>
            }
          </button>
          {draftNoImage && (
            <p style={{ fontSize: 10, color: C.yellow, textAlign: "center", margin: "0 0 4px", lineHeight: 1.4 }}>
              ⚠️ Imagen no guardada (muy grande). Recárgala al retomar.
            </p>
          )}
          {!draftNoImage && draftSaved && (
            <p style={{ fontSize: 10, color: C.grayMid, textAlign: "center", margin: "0 0 4px" }}>
              Vuelve al inicio para continuar después.
            </p>
          )}
          <button
            className="btn-primary"
            onClick={() => setShowPublishReview(true)}
            disabled={saving || !image}
            style={{ width: "100%", borderRadius: 10 }}
          >
            <Share2 size={13} />{shareCode ? "Actualizar link" : "Publicar y compartir link"}
          </button>
        </div>
      </nav>

      {/* CANVAS */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", position: "relative" }}>
        {!image ? (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: C.bg, padding: 24 }}>
            <div style={{ width: "100%", maxWidth: 520 }}>
              <div style={{ textAlign: "center", marginBottom: 28 }}>
                <div style={{ fontSize: 40, marginBottom: 10 }}>🗺️</div>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: C.gray }}>¿Cómo quieres crear el plan?</h2>
                <p style={{ margin: "6px 0 0", fontSize: 13, color: C.grayMid }}>Elige una opción para comenzar</p>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div
                  className="card"
                  onClick={() => fileRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  role="button" tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && fileRef.current?.click()}
                  style={{ padding: 24, textAlign: "center", cursor: "pointer", transition: "box-shadow 0.2s, border-color 0.2s" }}
                  onMouseEnter={(e) => (e.currentTarget.style.boxShadow = `0 4px 20px rgba(76,191,140,0.2)`)}
                  onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "0 2px 12px rgba(78,82,110,0.08)")}
                >
                  <div style={{
                    width: 56, height: 56, borderRadius: 16, background: C.greenBg,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    margin: "0 auto 14px",
                  }}>
                    <ImageIcon size={26} color={C.green} />
                  </div>
                  <p style={{ margin: "0 0 6px", fontSize: 14, fontWeight: 700, color: C.gray }}>Subir imagen del plano</p>
                  <p style={{ margin: "0 0 16px", fontSize: 11, color: C.grayMid, lineHeight: 1.5 }}>
                    Carga un JPG o PNG del plano y coloca los elementos manualmente o con IA.
                  </p>
                  <div style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    background: C.greenBg, color: C.green, padding: "7px 16px",
                    borderRadius: 8, fontSize: 12, fontWeight: 600,
                  }}>
                    Seleccionar imagen
                  </div>
                  <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png" onChange={handleFile} style={{ display: "none" }} />
                </div>

                <div
                  className="card"
                  onClick={() => !pdfAnalyzing && pdfRef.current?.click()}
                  role="button" tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && !pdfAnalyzing && pdfRef.current?.click()}
                  style={{ padding: 24, textAlign: "center", cursor: pdfAnalyzing ? "wait" : "pointer", transition: "box-shadow 0.2s" }}
                  onMouseEnter={(e) => { if (!pdfAnalyzing) e.currentTarget.style.boxShadow = `0 4px 20px rgba(0,95,197,0.2)`; }}
                  onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "0 2px 12px rgba(78,82,110,0.08)")}
                >
                  <div style={{
                    width: 56, height: 56, borderRadius: 16, background: C.blueBg,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    margin: "0 auto 14px",
                  }}>
                    {pdfAnalyzing
                      ? <Loader2 size={26} color={C.blue} className="spin" />
                      : <FileText size={26} color={C.blue} />
                    }
                  </div>
                  <p style={{ margin: "0 0 6px", fontSize: 14, fontWeight: 700, color: C.gray }}>
                    {pdfAnalyzing ? "Analizando PDF…" : "Subir Plan de Emergencia"}
                  </p>
                  <p style={{ margin: "0 0 16px", fontSize: 11, color: C.grayMid, lineHeight: 1.5 }}>
                    {pdfAnalyzing
                      ? "La IA está leyendo el documento. Un momento…"
                      : "Sube un PDF con el plan de emergencia y la IA creará el plan interactivo automáticamente."
                    }
                  </p>
                  {!pdfAnalyzing && (
                    <div style={{
                      display: "inline-flex", alignItems: "center", gap: 6,
                      background: C.blueBg, color: C.blue, padding: "7px 16px",
                      borderRadius: 8, fontSize: 12, fontWeight: 600,
                    }}>
                      <Sparkles size={12} /> Analizar con IA
                    </div>
                  )}
                  <input ref={pdfRef} type="file" accept=".pdf" onChange={handlePdfFile} style={{ display: "none" }} />
                </div>
              </div>

              {pdfError && (
                <div style={{
                  marginTop: 16, background: "#FFF5F5", border: `1px solid ${C.redBg}`,
                  borderRadius: 12, padding: "12px 16px", fontSize: 12, color: C.red, textAlign: "center",
                }}>
                  {pdfError}
                </div>
              )}

              <p style={{ textAlign: "center", marginTop: 16, fontSize: 11, color: C.grayMid }}>
                JPG · PNG para imagen · PDF para plan de emergencia
              </p>
            </div>
          </div>
        ) : (
          <>
            <div style={{
              position: "absolute", top: 12, left: 12, right: 12, zIndex: 20,
              display: "flex", alignItems: "flex-start", justifyContent: "space-between",
              gap: 8, pointerEvents: "none",
            }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, pointerEvents: "auto" }}>
                {emergency && (
                  <div style={{
                    background: C.red, color: "white", padding: "7px 14px", borderRadius: 10,
                    fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", gap: 6,
                    boxShadow: `0 3px 10px rgba(255,107,117,0.45)`,
                  }}>
                    <AlertTriangle size={13} /> MODO EMERGENCIA
                  </div>
                )}
                {activeTool && !isViewMode && !emergency && (
                  <div className="card" style={{ padding: "7px 14px", fontSize: 11, color: C.gray, fontWeight: 500 }}>
                    {activeTool === "ruta"
                      ? "🖱️ Clic para punto · Doble clic para finalizar"
                      : `📍 Clic para colocar: ${TOOLS[activeTool]?.label}`}
                  </div>
                )}
                {shareCode && (
                  <button
                    onClick={() => setShowShare(true)}
                    style={{
                      background: C.greenBg, border: `1px solid ${C.green}`, color: C.green,
                      padding: "7px 14px", borderRadius: 10, fontSize: 11,
                      display: "flex", alignItems: "center", gap: 6, cursor: "pointer",
                      fontFamily: "inherit", fontWeight: 600,
                    }}
                  >
                    <Link size={11} /> Código activo:{" "}
                    <span style={{ fontWeight: 700, letterSpacing: 2 }}>{shareCode}</span>
                  </button>
                )}
                {analyzeError && (
                  <div style={{
                    background: "#FFF5F5", border: `1px solid ${C.redBg}`,
                    color: C.red, padding: "7px 14px", borderRadius: 10, fontSize: 11,
                  }}>
                    {analyzeError}
                  </div>
                )}
              </div>

              <div style={{ display: "flex", gap: 8, pointerEvents: "auto" }}>
                {!isViewMode && (
                  <button
                    onClick={handleAnalyzePlan}
                    disabled={analyzingPlan}
                    style={{
                      display: "flex", alignItems: "center", gap: 6,
                      background: "white", border: `1.5px solid ${C.green}`, color: C.green,
                      padding: "7px 14px", borderRadius: 10, fontSize: 11,
                      cursor: analyzingPlan ? "not-allowed" : "pointer",
                      fontFamily: "inherit", fontWeight: 600,
                      boxShadow: "0 2px 8px rgba(0,0,0,0.07)", opacity: analyzingPlan ? 0.7 : 1,
                    }}
                  >
                    {analyzingPlan
                      ? <><Loader2 size={12} className="spin" />Analizando…</>
                      : <><ScanSearch size={12} />Analizar con IA</>
                    }
                  </button>
                )}
                <button
                  onClick={clearPlan}
                  style={{
                    background: "white", border: `1px solid ${C.grayLight}`, color: C.grayMid,
                    padding: "7px 12px", borderRadius: 10, fontSize: 11, cursor: "pointer", fontFamily: "inherit",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                  }}
                >
                  Cambiar plano
                </button>
              </div>
            </div>

            {showSuggestions && aiSuggestions && (
              <AISuggestionsPanel
                suggestions={aiSuggestions}
                onAccept={handleAcceptSuggestion}
                onAcceptRoute={handleAcceptRoute}
                onClose={() => setShowSuggestions(false)}
              />
            )}

            <div
              ref={canvasRef}
              style={{
                flex: 1, position: "relative", overflow: "hidden",
                cursor: activeTool && !isViewMode ? "crosshair" : "default",
                background: "#F0F2F5",
              }}
              onClick={(e) => handleCanvasClick(e, { isViewMode, image })}
              onDoubleClick={() => activeTool === "ruta" && currentRoute && currentRoute.length >= 2 && finishRoute()}
            >
              <img
                src={image} alt="Plano"
                style={{ width: "100%", height: "100%", objectFit: "contain", userSelect: "none" }}
                draggable={false}
              />
              {generatingPlan && (
                <div style={{
                  position: "absolute", inset: 0, background: "rgba(248,250,252,0.88)",
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, zIndex: 10,
                }}>
                  <Loader2 size={36} color={C.blue} className="spin" />
                  <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: C.gray }}>Generando plano con IA...</p>
                  <p style={{ margin: 0, fontSize: 12, color: C.grayMid }}>Esto puede tomar unos segundos</p>
                </div>
              )}
              {!generatingPlan && planGenError && (
                <div style={{
                  position: "absolute", inset: 0, background: "rgba(248,250,252,0.92)",
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, zIndex: 10, padding: 32,
                }}>
                  <AlertTriangle size={36} color={C.red} />
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: C.gray, textAlign: "center" }}>No se pudo generar el plano</p>
                  <p style={{ margin: 0, fontSize: 11, color: C.grayMid, textAlign: "center", maxWidth: 340 }}>{planGenError}</p>
                  <button
                    className="btn-primary"
                    style={{ marginTop: 4 }}
                    onClick={async () => {
                      if (!pdfExtracted || !lastDetails) return;
                      setPlanGenError(null);
                      setGeneratingPlan(true);
                      try {
                        const svgDataUrl = await generateFloorPlanSVG(pdfExtracted, lastDetails);
                        setImage(svgDataUrl);
                      } catch (err) {
                        setPlanGenError(err instanceof Error ? err.message : String(err));
                      } finally {
                        setGeneratingPlan(false);
                      }
                    }}
                  >
                    <RefreshCw size={14} /> Reintentar
                  </button>
                  <button className="btn-outline" style={{ fontSize: 12 }} onClick={() => setPlanGenError(null)}>
                    Continuar sin plano
                  </button>
                </div>
              )}
              <RouteLayer
                routes={routes} currentRoute={currentRoute}
                routeColor={routeColor} emergency={emergency} markerId="arrA"
              />
              {visibleElements.map((el) => (
                <ElementPin
                  key={el.id} el={el} emergency={emergency}
                  showTooltip={hoveredEl === el.id}
                  onMouseEnter={() => setHoveredEl(el.id)}
                  onMouseLeave={() => setHoveredEl(null)}
                  onMove={!isViewMode ? moveElement : undefined}
                  getCanvasRect={!isViewMode ? getCanvasRect : undefined}
                />
              ))}
            </div>
          </>
        )}
      </main>

      {showPublishReview && (
        <PublishReviewModal
          planName={planName} floors={floors} extraInfo={extraInfo}
          blockedZones={blockedZones} mobilityNeeds={mobilityNeeds}
          elements={elements} routes={routes}
          publishing={saving}
          onConfirm={() => { setShowPublishReview(false); publishPlan(shareCode || genCode()); }}
          onCancel={() => setShowPublishReview(false)}
        />
      )}
      {showShare && shareCode && (
        <ShareModal
          code={shareCode} planName={planName}
          onClose={() => setShowShare(false)}
          onRegen={() => publishPlan(genCode())}
        />
      )}
      {showPdfReview && pdfExtracted && (
        <PdfReviewModal
          extracted={pdfExtracted}
          onConfirm={handleOpenBuildingDetails}
          onClose={() => setShowPdfReview(false)}
        />
      )}
      {showBuildingDetails && pdfExtracted && (
        <BuildingDetailsModal
          prefill={{
            nombre:          pdfExtracted.edificio?.nombre,
            pisos:           pdfExtracted.edificio?.pisos,
            infoAdicional:   pdfExtracted.edificio?.infoAdicional,
          }}
          onGenerate={handleApplyPdf}
          onBack={() => { setShowBuildingDetails(false); setShowPdfReview(true); }}
        />
      )}
    </div>
  );
}

/* ════ ROOT ═════════════════════════════════════════════════════ */
export default function EvacuacionApp() {
  const [screen, setScreen]                  = useState<"entry" | "admin" | "resident" | "loading">("entry");
  const [residentPlan, setResidentPlan]      = useState<Plan | null>(null);
  const [adminInitialPlan, setAdminInitialPlan] = useState<Plan | undefined>(undefined);
  const [adminDraftId, setAdminDraftId]      = useState<string | undefined>(undefined);
  const [urlCode, setUrlCode]                = useState("");

  // Auto-load plan from URL ?plan=CODE (shared link for residents)
  // Uses window.location.search directly to avoid SSR/hydration timing issues with useSearchParams()
  useEffect(() => {
    const raw = new URLSearchParams(window.location.search).get("plan");
    if (!raw) return;
    const code = raw.toUpperCase();
    setUrlCode(code);
    setScreen("loading");

    const applyPlan = (plan: Plan) => { setResidentPlan(plan); setScreen("resident"); };
    const tryLocalStorage = () => {
      const cached = storage.get(`plan:${code}`);
      if (cached) { try { applyPlan(JSON.parse(cached)); return true; } catch { /* ignore */ } }
      return false;
    };

    fetch(`/api/plans/${code}`)
      .then((r) => r.ok ? r.json() : null)
      .then((res) => {
        if (res?.data) { applyPlan(res.data); return; }
        if (!tryLocalStorage()) setScreen("entry");
      })
      .catch(() => { if (!tryLocalStorage()) setScreen("entry"); });
  }, []);

  const handleAdmin = useCallback((plan?: Plan, draftId?: string) => {
    setAdminInitialPlan(plan);
    setAdminDraftId(draftId);
    setScreen("admin");
  }, []);

  return (
    <>
      {screen === "loading" && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 60,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          background: "#F8FAFC", gap: 16,
        }}>
          <div style={{
            width: 60, height: 60, borderRadius: 18, background: "#E8F8F1",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30,
          }}>🏢</div>
          <Loader2 size={24} color="#4CBF8C" className="spin" />
          <p style={{ margin: 0, fontSize: 13, color: "#9CA3AF", fontWeight: 500 }}>
            Cargando plan de evacuación…
          </p>
        </div>
      )}
      {screen === "admin" && (
        <AdminEditor
          onBack={() => { setAdminInitialPlan(undefined); setAdminDraftId(undefined); setScreen("entry"); }}
          initialPlan={adminInitialPlan}
          draftId={adminDraftId}
        />
      )}
      {screen === "resident" && residentPlan && (
        <ResidentView plan={residentPlan} onBack={() => setScreen("entry")} />
      )}
      {screen === "entry" && (
        <EntryScreen
          initialCode={urlCode}
          onAdmin={handleAdmin}
          onResident={(plan) => { setResidentPlan(plan); setScreen("resident"); }}
        />
      )}
    </>
  );
}
