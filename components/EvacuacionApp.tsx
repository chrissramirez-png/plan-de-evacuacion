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

/* ─── AI: emergency plan PDF analysis ───────────────────────── */
/* ─── AI: generate floor plan SVG from PDF ───────────────────── */
async function generateFloorPlanSVG(pdfDataUrl: string, extracted: PDFExtracted): Promise<string> {
  const { data } = parseDataUrl(pdfDataUrl);
  const buildingDesc = [
    extracted.edificio?.nombre && `Edificio: ${extracted.edificio.nombre}`,
    extracted.edificio?.pisos && `Pisos: ${extracted.edificio.pisos}`,
    extracted.edificio?.infoAdicional,
  ].filter(Boolean).join(". ") || "Edificio residencial";

  const text = await callGemini({
    max_tokens: 4000,
    messages: [{
      role: "user",
      content: [
        { type: "document", source: { type: "base64", media_type: "application/pdf", data } },
        {
          type: "text",
          text: `Basándote en este plan de emergencia, genera un plano esquemático de UN PISO TÍPICO en formato SVG.

Información del edificio: ${buildingDesc}

REQUISITOS DEL SVG:
- width="1200" height="800" con xmlns="http://www.w3.org/2000/svg"
- Dibuja la planta del piso: pasillos centrales, escaleras, shaft de ascensores, departamentos esquematizados como rectángulos
- Colores: fondo #F8FAFC, paredes #6B7280 (stroke, no fill), habitaciones/deptos #FFFFFF con stroke #D1D5DB, pasillos #F3F4F6, escaleras #E5E7EB con texto
- Grosor de paredes: stroke-width="3" para muros exteriores, stroke-width="1.5" para interiores
- Agrega etiquetas de texto simples: "Pasillo", "Escalera Norte", "Escalera Sur", "Ascensores", "Depto", etc.
- El plano debe ocupar casi todo el SVG, con margen de ~40px
- Sé preciso con la distribución típica de un edificio residencial de altura

Responde ÚNICAMENTE con el código SVG completo, empezando exactamente con <svg y terminando con </svg>. Sin markdown, sin bloques de código, sin texto adicional.`,
        },
      ],
    }],
  });

  const svgMatch = text.match(/<svg[\s\S]*<\/svg>/i);
  if (!svgMatch) throw new Error("No se pudo generar el plano SVG");
  const svgCode = svgMatch[0];
  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgCode)))}`;
}

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

  return {
    elements, routes, activeTool, currentRoute,
    canvasRef, handleCanvasClick, finishRoute,
    removeElement, removeRoute, selectTool, reset, addElement, addRoute,
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

function ElementPin({ el, emergency, showTooltip, onMouseEnter, onMouseLeave }: {
  el: Element; emergency: boolean; showTooltip: boolean;
  onMouseEnter: () => void; onMouseLeave: () => void;
}) {
  const tool      = TOOLS[el.type];
  const Icon      = tool?.icon || MapPin;
  const isCritical = CRITICAL_TYPES.has(el.type);

  if (emergency && !isCritical) return null;

  return (
    <div style={{ position: "absolute", left: `${el.x}%`, top: `${el.y}%`, transform: "translate(-50%,-50%)", zIndex: 10 }}>
      {emergency && isCritical && (
        <span className="ping" style={{ position: "absolute", inset: 0, borderRadius: "50%", background: tool?.color, opacity: 0.4 }} />
      )}
      <div
        className="element-pin"
        style={{ background: tool?.color || C.gray }}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        aria-label={el.label}
      >
        <Icon size={15} color="white" />
      </div>
      {showTooltip && (
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
            <CheckCircle size={14} /> Aplicar al editor
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
    <div className="app-root" style={{ display: "flex", flexDirection: "column" }}>
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
function EntryScreen({ onAdmin, onResident }: {
  onAdmin: () => void;
  onResident: (plan: Plan, code: string) => void;
}) {
  const [code, setCode]             = useState("");
  const [err, setErr]               = useState("");
  const [loading, setLoading]       = useState(false);
  const [savedPlans, setSavedPlans] = useState<Array<{ code: string; name: string; date: string; _data: Plan }> | null>(null);
  const [recovering, setRecovering] = useState(false);

  const handleJoin = useCallback(async () => {
    const c = code.trim().toUpperCase();
    if (c.length < 6) { setErr("Ingresa el código de 6 caracteres."); return; }
    setLoading(true);
    setErr("");
    try {
      const val = storage.get(`plan:${c}`);
      if (!val) { setErr("Código no encontrado."); return; }
      onResident(JSON.parse(val), c);
    } catch {
      setErr("Código no encontrado.");
    } finally {
      setLoading(false);
    }
  }, [code, onResident]);

  const handleRecover = useCallback(async () => {
    setRecovering(true);
    setSavedPlans(null);
    try {
      const keys = storage.list("plan:");
      const plans = keys.map((k) => {
        try {
          const val  = storage.get(k);
          const data = val ? JSON.parse(val) : null;
          return {
            code:  k.replace("plan:", ""),
            name:  data?.name || "Sin nombre",
            date:  data?.publishedAt ? new Date(data.publishedAt).toLocaleDateString("es-CL") : "—",
            _data: data,
          };
        } catch { return null; }
      }).filter(Boolean) as Array<{ code: string; name: string; date: string; _data: Plan }>;
      setSavedPlans(plans);
    } catch {
      setSavedPlans([]);
    } finally {
      setRecovering(false);
    }
  }, []);

  return (
    <div className="app-root" style={{
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 24, position: "relative", overflow: "hidden",
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
          <button
            onClick={handleRecover}
            disabled={recovering}
            style={{
              width: "100%", background: "none", border: "none", cursor: "pointer",
              color: C.grayMid, fontSize: 11, fontWeight: 500, padding: "8px",
              display: "flex", alignItems: "center", justifyContent: "center",
              gap: 6, fontFamily: "inherit", marginTop: 2,
            }}
          >
            {recovering
              ? <><RefreshCw size={11} className="spin" />Buscando…</>
              : <><RefreshCw size={11} />No recuerdo mi código — Recuperar</>
            }
          </button>
        </div>

        {savedPlans !== null && (
          <div className="card" style={{ padding: 16, marginBottom: 14 }}>
            <p className="sidebar-label" style={{ marginBottom: 10 }}>
              {savedPlans.length > 0 ? `${savedPlans.length} plan(es) encontrado(s)` : "Sin planes guardados."}
            </p>
            {savedPlans.map((p) => (
              <button
                key={p.code}
                onClick={() => onResident(p._data, p.code)}
                style={{
                  width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "10px 14px", background: C.bg, border: `1px solid ${C.grayLight}`,
                  borderRadius: 12, cursor: "pointer", marginBottom: 6, textAlign: "left",
                  color: C.gray, fontFamily: "inherit",
                }}
              >
                <div>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>{p.name}</p>
                  <p style={{ margin: 0, fontSize: 11, color: C.grayMid }}>Publicado: {p.date}</p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: C.green, letterSpacing: 2 }}>{p.code}</p>
                  <p style={{ margin: 0, fontSize: 11, color: C.grayMid }}>Abrir →</p>
                </div>
              </button>
            ))}
          </div>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "16px 0" }}>
          <div style={{ flex: 1, height: 1, background: C.grayLight }} />
          <span style={{ color: C.grayMid, fontSize: 12 }}>o</span>
          <div style={{ flex: 1, height: 1, background: C.grayLight }} />
        </div>

        <button className="btn-outline" onClick={onAdmin} style={{ width: "100%" }}>
          <MapPin size={14} color={C.green} /> Soy Administrador — Crear / Editar Plan
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

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [code]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      role="dialog" aria-modal="true" aria-labelledby="share-modal-title"
      style={{
        position: "fixed", inset: 0, zIndex: 50,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "rgba(78,82,110,0.35)", backdropFilter: "blur(6px)",
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{ padding: 24, width: "100%", maxWidth: 340, margin: 16 }}
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
          background: C.blueBg, border: `1px solid ${C.grayLight}`,
          borderRadius: 14, padding: 20, textAlign: "center", marginBottom: 16,
        }}>
          <p style={{ margin: "0 0 4px", fontSize: 11, color: C.grayMid, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>
            Código de acceso
          </p>
          <p style={{ margin: 0, fontSize: 38, fontFamily: "Montserrat, monospace", fontWeight: 700, color: C.gray, letterSpacing: 8 }}>
            {code}
          </p>
          <p style={{ margin: "8px 0 0", fontSize: 11, color: C.grayMid }}>{planName || "Plan de Evacuación"}</p>
        </div>

        <div style={{
          background: C.bg, borderRadius: 12, padding: 14, marginBottom: 16,
          fontSize: 11, color: C.gray, lineHeight: 1.8,
        }}>
          <p style={{ margin: "0 0 4px", fontWeight: 700 }}>👤 Para residentes:</p>
          <p style={{ margin: 0 }}>1. Abre la app → &quot;Soy Residente&quot;</p>
          <p style={{ margin: 0 }}>
            2. Ingresa el código{" "}
            <code style={{ background: C.blueBg, color: C.blue, padding: "1px 6px", borderRadius: 4, fontWeight: 700 }}>{code}</code>
          </p>
          <p style={{ margin: 0 }}>3. Usa ✨ Ruta IA para instrucciones personalizadas</p>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={handleCopy}
            style={{
              flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              padding: "10px", borderRadius: 12, fontSize: 13, fontWeight: 600,
              cursor: "pointer", border: "none", fontFamily: "inherit",
              background: copied ? C.green : C.gray, color: "white", transition: "background 0.2s",
            }}
          >
            {copied ? <><CheckCircle size={13} />¡Copiado!</> : <><Copy size={13} />Copiar código</>}
          </button>
          <button
            onClick={onRegen}
            aria-label="Regenerar código"
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

/* ════ ADMIN EDITOR ═════════════════════════════════════════════ */
function AdminEditor({ onBack }: { onBack: () => void }) {
  const [image, setImage]               = useState<string | null>(null);
  const [isViewMode, setIsViewMode]     = useState(false);
  const [emergency, setEmergency]       = useState(false);
  const [hoveredEl, setHoveredEl]       = useState<number | null>(null);
  const [planName, setPlanName]         = useState("Mi Edificio");
  const [shareCode, setShareCode]       = useState<string | null>(null);
  const [showShare, setShowShare]       = useState(false);
  const [saving, setSaving]             = useState(false);
  const [showCtx, setShowCtx]           = useState(false);
  const [floors, setFloors]             = useState("1");
  const [extraInfo, setExtraInfo]       = useState("");
  const [blockedZones, setBlockedZones] = useState("");
  const [mobilityNeeds, setMobilityNeeds] = useState(false);
  const [locationFields, setLocationFields] = useState<LocationField[]>(DEFAULT_LOCATION_FIELDS);

  const [aiSuggestions, setAiSuggestions]     = useState<AISuggestion | null>(null);
  const [analyzingPlan, setAnalyzingPlan]     = useState(false);
  const [analyzeError, setAnalyzeError]       = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [pdfAnalyzing, setPdfAnalyzing]     = useState(false);
  const [pdfExtracted, setPdfExtracted]     = useState<PDFExtracted | null>(null);
  const [pdfDataUrl, setPdfDataUrl]         = useState<string | null>(null);
  const [showPdfReview, setShowPdfReview]   = useState(false);
  const [pdfError, setPdfError]             = useState<string | null>(null);
  const [generatingPlan, setGeneratingPlan] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);
  const pdfRef  = useRef<HTMLInputElement>(null);
  const {
    elements, routes, activeTool, currentRoute, canvasRef,
    handleCanvasClick, finishRoute, removeElement, removeRoute,
    selectTool, reset, addElement, addRoute,
  } = useMapEditor();

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
        const dataUrl = ev.target?.result as string;
        setPdfDataUrl(dataUrl);
        const result = await analyzeEmergencyPlanPDF(dataUrl);
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

  const handleApplyPdf = useCallback(async () => {
    if (!pdfExtracted) return;
    const { edificio, salidas, extintores, puntos, mangueras, rutas } = pdfExtracted;
    if (edificio?.nombre) setPlanName(edificio.nombre);
    if (edificio?.pisos) setFloors(edificio.pisos.toString());
    if (edificio?.infoAdicional) setExtraInfo(edificio.infoAdicional);
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
    setShowPdfReview(false);
    setShowCtx(true);

    // Generar plano con IA a partir del PDF
    if (pdfDataUrl) {
      setGeneratingPlan(true);
      setImage(BLANK_CANVAS); // canvas temporal mientras genera
      try {
        const svgDataUrl = await generateFloorPlanSVG(pdfDataUrl, pdfExtracted);
        setImage(svgDataUrl);
      } catch {
        // Si falla la generación, dejar el canvas en blanco
      } finally {
        setGeneratingPlan(false);
      }
    } else {
      setImage((prev) => prev ?? BLANK_CANVAS);
    }
  }, [pdfExtracted, pdfDataUrl, reset, addElement, addRoute, setImage]);

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
    const data = JSON.stringify({
      name: planName, image, elements, routes,
      buildingCtx: {
        name: planName, floors, extra: extraInfo,
        blocked: blockedZones, mobility: mobilityNeeds, locationFields,
      },
      publishedAt: new Date().toISOString(),
    });
    try {
      storage.set(`plan:${code}`, data);
      setShareCode(code);
      setShowShare(true);
    } catch (e) {
      console.error("Error al guardar:", e);
    } finally {
      setSaving(false);
    }
  }, [planName, image, elements, routes, floors, extraInfo, blockedZones, mobilityNeeds, locationFields]);

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
    <div className="app-root" style={{ display: "flex" }}>
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
            className="btn-primary"
            onClick={() => publishPlan(shareCode || genCode())}
            disabled={saving || !image}
            style={{ width: "100%", borderRadius: 10 }}
          >
            {saving
              ? <><RefreshCw size={13} className="spin" />Guardando…</>
              : <><Share2 size={13} />{shareCode ? "Actualizar y Compartir" : "Publicar y Compartir"}</>
            }
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
                  position: "absolute", inset: 0, background: "rgba(248,250,252,0.85)",
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, zIndex: 10,
                }}>
                  <Loader2 size={36} color={C.blue} className="spin" />
                  <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: C.gray }}>Generando plano con IA...</p>
                  <p style={{ margin: 0, fontSize: 12, color: C.grayMid }}>Esto puede tomar unos segundos</p>
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
                />
              ))}
            </div>
          </>
        )}
      </main>

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
          onConfirm={handleApplyPdf}
          onClose={() => setShowPdfReview(false)}
        />
      )}
    </div>
  );
}

/* ════ ROOT ═════════════════════════════════════════════════════ */
export default function EvacuacionApp() {
  const [screen, setScreen]             = useState<"entry" | "admin" | "resident">("entry");
  const [residentPlan, setResidentPlan] = useState<Plan | null>(null);

  return (
    <>
      {screen === "admin"    && <AdminEditor onBack={() => setScreen("entry")} />}
      {screen === "resident" && residentPlan && <ResidentView plan={residentPlan} onBack={() => setScreen("entry")} />}
      {screen === "entry"    && (
        <EntryScreen
          onAdmin={() => setScreen("admin")}
          onResident={(plan) => { setResidentPlan(plan); setScreen("resident"); }}
        />
      )}
    </>
  );
}
