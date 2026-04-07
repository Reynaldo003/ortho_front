// src/components/layout/patients/BodyPainMap.jsx
import React, {
    Suspense,
    useCallback,
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import * as THREE from "three";
import { Canvas, useThree } from "@react-three/fiber";
import { Environment, OrbitControls, useGLTF } from "@react-three/drei";

const MODEL_URL = "/cuerpo_humano.glb?v=2";
const COLOR_BASE = "#d46a6a";
const COLOR_HOVER = "#7dd3fc";

const LABELS_POR_MESH = {
    cabeza: "Cabeza",
    skull: "Cabeza",
    head: "Cabeza",
    cuello: "Cuello",
    neck: "Cuello",
    esternocleido: "Esternocleidomastoideo",
    sternocleidomastoid: "Esternocleidomastoideo",
    nariz: "Nariz",
    ojo_izquierdo: "Ojo izquierdo",
    ojo_derecho: "Ojo derecho",
    oreja_izquierda: "Oreja izquierda",
    oreja_derecha: "Oreja derecha",

    trapecio_izquierdo: "Trapecio izquierdo",
    trapecio_derecho: "Trapecio derecho",
    trapezius_left: "Trapecio izquierdo",
    trapezius_right: "Trapecio derecho",
    pectoral_izquierdo: "Pectoral izquierdo",
    pectoral_derecho: "Pectoral derecho",
    pectoralis_major_left: "Pectoral izquierdo",
    pectoralis_major_right: "Pectoral derecho",
    abdominal_izquierdo: "Abdomen izquierdo",
    abdominar_derecho: "Abdomen derecho",
    abdomen: "Abdomen",
    abs: "Abdomen",
    columna: "Columna",
    lumbar: "Lumbar",
    dorsal: "Dorsal",

    hombro_izquierdo: "Hombro izquierdo",
    hombro_derecho: "Hombro derecho",
    shoulder_left: "Hombro izquierdo",
    shoulder_right: "Hombro derecho",
    deltoid_left: "Hombro izquierdo",
    deltoid_right: "Hombro derecho",

    brazo_izquierdo: "Brazo izquierdo",
    brazo_derecho: "Brazo derecho",
    biceps_left: "Brazo izquierdo",
    biceps_right: "Brazo derecho",
    triceps_left: "Tríceps izquierdo",
    triceps_right: "Tríceps derecho",

    antebrazo_izquierdo: "Antebrazo izquierdo",
    antebrazo_derecho: "Antebrazo derecho",
    forearm_left: "Antebrazo izquierdo",
    forearm_right: "Antebrazo derecho",

    muñeca_izquierda: "Muñeca izquierda",
    muñeca_derecha: "Muñeca derecha",
    mano_izquierda: "Mano izquierda",
    mano_derecha: "Mano derecha",

    gluteo_izquierdo: "Glúteo izquierdo",
    gluteo_derecho: "Glúteo derecho",
    glute_left: "Glúteo izquierdo",
    glute_right: "Glúteo derecho",

    cuadricep_izquierdo: "Cuádriceps izquierdo",
    cuadricep_derecho: "Cuádriceps derecho",
    quadriceps_left: "Cuádriceps izquierdo",
    quadriceps_right: "Cuádriceps derecho",

    aductor_izquierdo: "Aductor izquierdo",
    aductor_derecho: "Aductor derecho",

    isquiotibial_izquierdo: "Isquiotibial izquierdo",
    isquiotibial_derecho: "Isquiotibial derecho",
    hamstring_left: "Isquiotibial izquierdo",
    hamstring_right: "Isquiotibial derecho",

    vasto_lateral_izquierdo: "Vasto lateral izquierdo",
    vasto_lateral_derecho: "Vasto lateral derecho",

    tibial_izquierdo: "Tibial izquierdo",
    tibial_derecho: "Tibial derecho",
    tibialis_left: "Tibial izquierdo",
    tibialis_right: "Tibial derecho",

    gastrocnemio_izquierdo: "Pantorrilla izquierda",
    gastrocnemio_derecho: "Pantorrilla derecha",
    gastrocnemius_left: "Pantorrilla izquierda",
    gastrocnemius_right: "Pantorrilla derecha",
    calf_left: "Pantorrilla izquierda",
    calf_right: "Pantorrilla derecha",
};

function normalizarNombreMesh(name = "") {
    return String(name)
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\./g, "_")
        .replace(/\s+/g, "_");
}

function humanizarTexto(texto = "") {
    return String(texto)
        .replace(/_/g, " ")
        .replace(/\bleft\b/gi, "izquierdo")
        .replace(/\bright\b/gi, "derecho")
        .replace(/\bizq\b/gi, "izquierdo")
        .replace(/\bder\b/gi, "derecho")
        .replace(/\s+/g, " ")
        .trim()
        .replace(/\b\w/g, (m) => m.toUpperCase());
}

function traducirMesh(name = "") {
    const key = normalizarNombreMesh(name);

    if (LABELS_POR_MESH[key]) return LABELS_POR_MESH[key];

    const reglas = [
        [/head|skull|cabeza/i, "Cabeza"],
        [/neck|cuello|cerv/i, "Cuello"],
        [/sternocleid|esternocleido/i, "Esternocleidomastoideo"],
        [/nariz/i, "Nariz"],
        [/ojo.*izq|izq.*ojo|ojo_izquierdo/i, "Ojo izquierdo"],
        [/ojo.*der|der.*ojo|ojo_derecho/i, "Ojo derecho"],
        [/oreja.*izq|izq.*oreja|oreja_izquierda/i, "Oreja izquierda"],
        [/oreja.*der|der.*oreja|oreja_derecha/i, "Oreja derecha"],

        [/trapecio.*izq|izq.*trapecio|trapezius.*left/i, "Trapecio izquierdo"],
        [/trapecio.*der|der.*trapecio|trapezius.*right/i, "Trapecio derecho"],
        [/pectoral.*izq|izq.*pectoral|pectoralis.*left/i, "Pectoral izquierdo"],
        [/pectoral.*der|der.*pectoral|pectoralis.*right/i, "Pectoral derecho"],
        [/abdominal.*izq|izq.*abdominal|abs.*left/i, "Abdomen izquierdo"],
        [/abdominal.*der|der.*abdominal|abs.*right|abdominar_derecho/i, "Abdomen derecho"],
        [/abdomen|abdominal|abs/i, "Abdomen"],
        [/columna|spine/i, "Columna"],
        [/lumbar/i, "Lumbar"],
        [/dorsal|latissimus|dorsi/i, "Dorsal"],

        [/hombro.*izq|izq.*hombro|shoulder.*left|deltoid.*left/i, "Hombro izquierdo"],
        [/hombro.*der|der.*hombro|shoulder.*right|deltoid.*right/i, "Hombro derecho"],
        [/brazo.*izq|izq.*brazo|biceps.*left/i, "Brazo izquierdo"],
        [/brazo.*der|der.*brazo|biceps.*right/i, "Brazo derecho"],
        [/triceps.*left/i, "Tríceps izquierdo"],
        [/triceps.*right/i, "Tríceps derecho"],
        [/antebrazo.*izq|izq.*antebrazo|forearm.*left/i, "Antebrazo izquierdo"],
        [/antebrazo.*der|der.*antebrazo|forearm.*right/i, "Antebrazo derecho"],
        [/muneca.*izq|izq.*muneca/i, "Muñeca izquierda"],
        [/muneca.*der|der.*muneca/i, "Muñeca derecha"],
        [/mano.*izq|izq.*mano/i, "Mano izquierda"],
        [/mano.*der|der.*mano/i, "Mano derecha"],

        [/gluteo.*izq|izq.*gluteo|glute.*left/i, "Glúteo izquierdo"],
        [/gluteo.*der|der.*gluteo|glute.*right/i, "Glúteo derecho"],
        [/cuadricep.*izq|izq.*cuadricep|quadriceps.*left/i, "Cuádriceps izquierdo"],
        [/cuadricep.*der|der.*cuadricep|quadriceps.*right/i, "Cuádriceps derecho"],
        [/aductor.*izq|izq.*aductor/i, "Aductor izquierdo"],
        [/aductor.*der|der.*aductor/i, "Aductor derecho"],
        [/isquiotibial.*izq|izq.*isquiotibial|hamstring.*left/i, "Isquiotibial izquierdo"],
        [/isquiotibial.*der|der.*isquiotibial|hamstring.*right/i, "Isquiotibial derecho"],
        [/vasto_lateral.*izq|izq.*vasto_lateral/i, "Vasto lateral izquierdo"],
        [/vasto_lateral.*der|der.*vasto_lateral/i, "Vasto lateral derecho"],
        [/tibial.*izq|izq.*tibial|tibialis.*left/i, "Tibial izquierdo"],
        [/tibial.*der|der.*tibial|tibialis.*right/i, "Tibial derecho"],
        [/gastrocnemio.*izq|izq.*gastrocnemio|gastrocnemius.*left|calf.*left/i, "Pantorrilla izquierda"],
        [/gastrocnemio.*der|der.*gastrocnemio|gastrocnemius.*right|calf.*right/i, "Pantorrilla derecha"],
    ];

    for (const [regex, label] of reglas) {
        if (regex.test(key)) return label;
    }

    return humanizarTexto(key || "zona");
}

export function getPainLabels(value = []) {
    if (!Array.isArray(value)) return [];

    const labels = value
        .map((item) => {
            if (!item) return "";
            if (typeof item === "string") return traducirMesh(item);
            return item.label || traducirMesh(item.meshName || item.id || "");
        })
        .filter(Boolean);

    return [...new Set(labels)];
}

export default function BodyPainMap({
    value = [],
    onChange,
    accent = "#3dc2d5",
}) {
    const selectedValue = useMemo(() => {
        if (!Array.isArray(value)) return [];

        return value.map((item) => {
            if (typeof item === "string") {
                return {
                    id: item,
                    meshName: item,
                    label: traducirMesh(item),
                    side: null,
                };
            }

            return {
                id: item?.id || item?.meshName || "",
                meshName: item?.meshName || item?.id || "",
                label: item?.label || traducirMesh(item?.meshName || item?.id || ""),
                side: item?.side ?? null,
            };
        });
    }, [value]);

    const selectedLabels = useMemo(() => getPainLabels(selectedValue), [selectedValue]);
    const [hoveredZone, setHoveredZone] = useState(null);

    const selectedIds = useMemo(() => {
        return new Set(selectedValue.map((item) => item.id));
    }, [selectedValue]);

    const toggleZone = useCallback(
        (zone) => {
            const cleanZone = {
                id: zone.id,
                meshName: zone.meshName || zone.id,
                label: traducirMesh(zone.meshName || zone.id),
                side: zone.side ?? null,
            };

            const existe = selectedValue.some((x) => x.id === cleanZone.id);

            const next = existe
                ? selectedValue.filter((x) => x.id !== cleanZone.id)
                : [...selectedValue, cleanZone];

            onChange?.(next);
        },
        [selectedValue, onChange]
    );

    const clearAll = useCallback(() => {
        onChange?.([]);
    }, [onChange]);

    return (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[520px_1fr]">
            <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <div className="text-sm font-extrabold text-slate-900">Mapa corporal 3D</div>
                        <div className="text-xs text-slate-500">
                            Haz clic directamente sobre la zona del modelo.
                        </div>
                    </div>
                </div>

                <div className="mt-4">
                    <div className="relative h-[520px] w-full overflow-hidden rounded-3xl border border-slate-200 bg-slate-50">
                        <BodyModelViewer
                            selectedIds={selectedIds}
                            hoveredZoneId={hoveredZone?.id || null}
                            onHoverZone={setHoveredZone}
                            onToggleZone={toggleZone}
                            accent={accent}
                        />

                        {hoveredZone ? (
                            <div
                                className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-[120%] rounded-2xl border border-slate-200 bg-white/95 px-3 py-2 text-xs font-semibold text-slate-800 shadow-lg backdrop-blur"
                                style={{
                                    left: hoveredZone.x,
                                    top: hoveredZone.y,
                                }}
                            >
                                {hoveredZone.label}
                            </div>
                        ) : null}
                    </div>
                </div>

                <div className="mt-3 text-xs text-slate-500">
                    Tip: pasa el cursor por encima para ver la zona y haz clic para marcarla.
                </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <div className="text-sm font-extrabold text-slate-900">Zonas seleccionadas</div>
                        <div className="text-xs text-slate-500">
                            Solo se muestran nombres legibles del cuerpo.
                        </div>
                    </div>

                    <button
                        type="button"
                        className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        onClick={clearAll}
                    >
                        Limpiar
                    </button>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                    {selectedLabels.length === 0 ? (
                        <div className="text-sm text-slate-500">Sin zonas seleccionadas.</div>
                    ) : (
                        selectedLabels.map((txt, i) => (
                            <span
                                key={`${txt}-${i}`}
                                className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700"
                            >
                                {txt}
                            </span>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

function BodyModelViewer({
    selectedIds,
    hoveredZoneId,
    onHoverZone,
    onToggleZone,
    accent,
}) {
    return (
        <Canvas
            dpr={[1, 1.75]}
            camera={{ position: [0, 0.9, 5.2], fov: 32, near: 0.1, far: 100 }}
            gl={{
                antialias: true,
                alpha: false,
                powerPreference: "high-performance",
            }}
            shadows={false}
        >
            <color attach="background" args={["#f8fafc"]} />

            <ambientLight intensity={1.15} />
            <hemisphereLight intensity={0.8} groundColor="#dbeafe" />
            <directionalLight position={[5, 8, 6]} intensity={1.25} />
            <directionalLight position={[-4, 5, -4]} intensity={0.5} />

            <Suspense fallback={null}>
                <SceneRig />
                <InteractiveMaleModel
                    selectedIds={selectedIds}
                    hoveredZoneId={hoveredZoneId}
                    onHoverZone={onHoverZone}
                    onToggleZone={onToggleZone}
                    accent={accent}
                />
                <Environment preset="studio" />
            </Suspense>
        </Canvas>
    );
}

function SceneRig() {
    const controlsRef = useRef(null);
    const { camera } = useThree();

    useEffect(() => {
        camera.position.set(0, 0.9, 5.2);
        camera.lookAt(0, 1.6, 0);
    }, [camera]);

    return (
        <OrbitControls
            ref={controlsRef}
            enablePan={false}
            enableDamping
            dampingFactor={0.08}
            rotateSpeed={0.8}
            minDistance={4.2}
            maxDistance={7.5}
            target={[0, 1.6, 0]}
        />
    );
}

function InteractiveMaleModel({
    selectedIds,
    hoveredZoneId,
    onHoverZone,
    onToggleZone,
    accent,
}) {
    const { scene } = useGLTF(MODEL_URL);

    const sceneClone = useMemo(() => scene.clone(true), [scene]);
    const rootRef = useRef(null);
    const meshRefs = useRef([]);
    const initialSetupDoneRef = useRef(false);

    useLayoutEffect(() => {
        if (!sceneClone || initialSetupDoneRef.current) return;

        const meshes = [];

        sceneClone.traverse((obj) => {
            if (!obj.isMesh) return;

            const meshName = obj.name || `mesh_${meshes.length + 1}`;
            const baseLabel = traducirMesh(meshName);

            meshes.push(obj);

            obj.userData.zoneId = meshName;
            obj.userData.zoneLabel = baseLabel;
            obj.userData.zoneMeshName = meshName;

            if (obj.geometry) {
                obj.geometry.computeBoundingBox();
                obj.geometry.computeBoundingSphere();
                obj.geometry.computeVertexNormals();
            }

            if (Array.isArray(obj.material)) {
                obj.material = obj.material.map((mat) => prepararMaterial(mat));
            } else if (obj.material) {
                obj.material = prepararMaterial(obj.material);
            } else {
                obj.material = prepararMaterial(
                    new THREE.MeshStandardMaterial({
                        color: COLOR_BASE,
                        roughness: 0.82,
                        metalness: 0.02,
                    })
                );
            }

            obj.castShadow = false;
            obj.receiveShadow = false;
            obj.frustumCulled = true;
            obj.renderOrder = 0;
        });

        const box = new THREE.Box3().setFromObject(sceneClone);
        const size = new THREE.Vector3();
        const center = new THREE.Vector3();

        box.getSize(size);
        box.getCenter(center);

        const desiredHeight = 3.55;
        const scale = size.y > 0 ? desiredHeight / size.y : 0.05;

        const minY = box.min.y;
        const offsetX = -center.x * scale;
        const offsetY = -minY * scale;
        const offsetZ = -center.z * scale;

        if (rootRef.current) {
            rootRef.current.scale.setScalar(scale);
            rootRef.current.position.set(offsetX, offsetY, offsetZ);
        }

        meshRefs.current = meshes;
        initialSetupDoneRef.current = true;
    }, [sceneClone]);

    useEffect(() => {
        if (!meshRefs.current.length) return;

        const selectedColor = new THREE.Color(accent);
        const hoverColor = new THREE.Color(COLOR_HOVER);

        for (const mesh of meshRefs.current) {
            const meshId = mesh.userData.zoneId;
            const activo = selectedIds.has(meshId);
            const enHover = hoveredZoneId === meshId;

            const aplicar = (mat) => {
                if (!mat) return;

                if (!mat.userData.__baseColor) {
                    mat.userData.__baseColor = mat.color
                        ? mat.color.clone()
                        : new THREE.Color(COLOR_BASE);
                }

                if (!mat.userData.__baseEmissive) {
                    mat.userData.__baseEmissive = mat.emissive
                        ? mat.emissive.clone()
                        : new THREE.Color("#000000");
                }

                if (mat.userData.__baseEmissiveIntensity == null) {
                    mat.userData.__baseEmissiveIntensity = mat.emissiveIntensity ?? 0;
                }

                if (activo) {
                    if (mat.color) mat.color.copy(selectedColor);
                    if (mat.emissive) mat.emissive.copy(selectedColor);
                    mat.emissiveIntensity = 0.22;
                } else if (enHover) {
                    if (mat.color) mat.color.copy(hoverColor);
                    if (mat.emissive) mat.emissive.copy(hoverColor);
                    mat.emissiveIntensity = 0.14;
                } else {
                    if (mat.color && mat.userData.__baseColor) {
                        mat.color.copy(mat.userData.__baseColor);
                    }
                    if (mat.emissive && mat.userData.__baseEmissive) {
                        mat.emissive.copy(mat.userData.__baseEmissive);
                    }
                    mat.emissiveIntensity = mat.userData.__baseEmissiveIntensity ?? 0;
                }
            };

            if (Array.isArray(mesh.material)) {
                mesh.material.forEach(aplicar);
            } else {
                aplicar(mesh.material);
            }
        }
    }, [selectedIds, hoveredZoneId, accent]);

    const resolverZonaDesdeEvento = useCallback((mesh) => {
        const meshName = mesh.userData.zoneMeshName || mesh.name || "mesh";
        const label = traducirMesh(meshName);

        return {
            id: meshName,
            label,
            meshName,
            side: null,
        };
    }, []);

    const actualizarHover = useCallback(
        (e) => {
            e.stopPropagation();

            const mesh = e.object;
            if (!mesh?.isMesh) return;

            const zone = resolverZonaDesdeEvento(mesh);

            onHoverZone?.({
                ...zone,
                x: e.sourceEvent?.offsetX ?? 0,
                y: e.sourceEvent?.offsetY ?? 0,
            });
        },
        [onHoverZone, resolverZonaDesdeEvento]
    );

    const limpiarHover = useCallback(() => {
        onHoverZone?.(null);
    }, [onHoverZone]);

    const handlePointerDown = useCallback(
        (e) => {
            e.stopPropagation();

            const mesh = e.object;
            if (!mesh?.isMesh) return;

            const zone = resolverZonaDesdeEvento(mesh);
            onToggleZone?.(zone);
        },
        [onToggleZone, resolverZonaDesdeEvento]
    );

    return (
        <group ref={rootRef}>
            <primitive
                object={sceneClone}
                onPointerMove={actualizarHover}
                onPointerOut={limpiarHover}
                onPointerMissed={limpiarHover}
                onPointerDown={handlePointerDown}
            />
        </group>
    );
}

function prepararMaterial(material) {
    const mat = material.clone();

    if ("transparent" in mat) mat.transparent = false;
    if ("opacity" in mat) mat.opacity = 1;

    if ("metalness" in mat) mat.metalness = 0.02;
    if ("roughness" in mat) mat.roughness = 0.82;
    if ("envMapIntensity" in mat) mat.envMapIntensity = 0.45;

    if ("side" in mat) {
        mat.side = THREE.FrontSide;
    }

    if (!mat.color) {
        mat.color = new THREE.Color(COLOR_BASE);
    }

    return mat;
}

useGLTF.preload(MODEL_URL);