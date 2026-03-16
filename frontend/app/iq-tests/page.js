'use client';

import { useState, useEffect, useRef, useMemo, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { API_URL } from '@/lib/api';
import Navbar from '@/components/Navbar';
import { ArrowRight } from 'lucide-react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Float, MeshDistortMaterial, Sphere } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import Link from 'next/link';

// ═══════════════════════════════════════════════════════════════════
// 3D BRAIN HEMISPHERE
// ═══════════════════════════════════════════════════════════════════
function BrainHemisphere({ side, splitProgress, color1, color2 }) {
    const meshRef = useRef();
    const glowRef = useRef();

    useFrame((state) => {
        if (!meshRef.current) return;
        const t = state.clock.elapsedTime;
        const splitX = side * splitProgress * 2.5;
        meshRef.current.position.x = splitX;
        meshRef.current.rotation.y = t * 0.15 + side * 0.3;
        meshRef.current.rotation.z = Math.sin(t * 0.3) * 0.1;
        if (glowRef.current) {
            glowRef.current.position.x = splitX;
            glowRef.current.rotation.y = t * 0.15 + side * 0.3;
        }
    });

    return (
        <group>
            <mesh ref={meshRef} scale={1.3}>
                <Sphere args={[1, 64, 64]}>
                    <MeshDistortMaterial
                        color={color1}
                        emissive={color2}
                        emissiveIntensity={0.3 + splitProgress * 0.5}
                        roughness={0.2}
                        metalness={0.8}
                        distort={0.35 + Math.sin(splitProgress * Math.PI) * 0.15}
                        speed={2}
                        transparent
                        opacity={0.85}
                    />
                </Sphere>
            </mesh>
            <mesh ref={glowRef} scale={1.5}>
                <Sphere args={[1, 32, 32]}>
                    <meshBasicMaterial
                        color={color2}
                        transparent
                        opacity={0.04 + splitProgress * 0.06}
                        side={THREE.BackSide}
                    />
                </Sphere>
            </mesh>
        </group>
    );
}

// ═══════════════════════════════════════════════════════════════════
// NEURAL PARTICLES
// ═══════════════════════════════════════════════════════════════════
function NeuralParticles({ count = 300, splitProgress }) {
    const pointsRef = useRef();
    const { positions, colors } = useMemo(() => {
        const pos = new Float32Array(count * 3);
        const col = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            const r = 1.2 + Math.random() * 2.5;
            pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
            pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.7;
            pos[i * 3 + 2] = r * Math.cos(phi) * 0.8;
            const color = new THREE.Color().setHSL(0.6, 0.8, 0.6 + Math.random() * 0.3);
            col[i * 3] = color.r;
            col[i * 3 + 1] = color.g;
            col[i * 3 + 2] = color.b;
        }
        return { positions: pos, colors: col };
    }, [count]);

    useFrame((state) => {
        if (!pointsRef.current) return;
        const t = state.clock.elapsedTime;
        pointsRef.current.rotation.y = t * 0.04;
        pointsRef.current.rotation.x = Math.sin(t * 0.05) * 0.1;
        const geo = pointsRef.current.geometry;
        const posAttr = geo.attributes.position;
        for (let i = 0; i < count; i++) {
            const ox = positions[i * 3];
            const spreadX = ox > 0 ? splitProgress * 1.5 : -splitProgress * 1.5;
            posAttr.array[i * 3] = ox + spreadX;
        }
        posAttr.needsUpdate = true;
    });

    return (
        <points ref={pointsRef}>
            <bufferGeometry>
                <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
                <bufferAttribute attach="attributes-color" count={count} array={colors} itemSize={3} />
            </bufferGeometry>
            <pointsMaterial
                size={0.04}
                vertexColors
                transparent
                opacity={0.6 + splitProgress * 0.3}
                sizeAttenuation
                blending={THREE.AdditiveBlending}
                depthWrite={false}
            />
        </points>
    );
}
function EnergyCore({ splitProgress }) {
    const coreRef = useRef();

    useFrame((state) => {
        if (!coreRef.current) return;
        const t = state.clock.elapsedTime;
        const scale = splitProgress * 1.2;
        coreRef.current.scale.setScalar(Math.max(scale, 0.01));
        coreRef.current.rotation.y = t * 2;
        coreRef.current.rotation.z = t * 0.5;
    });

    if (splitProgress < 0.05) return null;

    return (
        <group ref={coreRef}>
            <mesh>
                <sphereGeometry args={[0.3, 32, 32]} />
                <meshBasicMaterial color="#93c5fd" transparent opacity={splitProgress} />
            </mesh>
            <mesh scale={1.5}>
                <sphereGeometry args={[0.3, 32, 32]} />
                <meshBasicMaterial color="#60a5fa" transparent opacity={splitProgress * 0.4} side={THREE.BackSide} />
            </mesh>
            <mesh scale={3}>
                <sphereGeometry args={[0.3, 16, 16]} />
                <meshBasicMaterial color="#93c5fd" transparent opacity={splitProgress * 0.15} side={THREE.BackSide} />
            </mesh>
            {[0, 1, 2].map((i) => (
                <mesh key={i} rotation={[Math.PI / 2 * i * 0.7, i * 0.5, 0]}>
                    <torusGeometry args={[0.6 + i * 0.2, 0.008, 16, 100]} />
                    <meshBasicMaterial color="#60a5fa" transparent opacity={splitProgress * 0.6} />
                </mesh>
            ))}
        </group>
    );
}

// ═══════════════════════════════════════════════════════════════════
// SCENE WRAPPER
// ═══════════════════════════════════════════════════════════════════
function BrainScene({ splitProgress }) {
    const { camera } = useThree();
    useFrame(() => {
        camera.position.z = 5 + splitProgress * 1.5;
    });

    return (
        <>
            <ambientLight intensity={0.3} />
            <pointLight position={[5, 5, 5]} intensity={1} color="#60a5fa" />
            <pointLight position={[-5, -3, 5]} intensity={0.8} color="#3b82f6" />
            <pointLight position={[0, 0, 3]} intensity={0.5 + splitProgress * 2} color="#dbeafe" />

            <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.4}>
                <BrainHemisphere side={-1} splitProgress={splitProgress} color1="#1e40af" color2="#3b82f6" />
            </Float>
            <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.4} floatingRange={[0, 0.1]}>
                <BrainHemisphere side={1} splitProgress={splitProgress} color1="#1d4ed8" color2="#2563eb" />
            </Float>

            <EnergyCore splitProgress={splitProgress} />
            <NeuralParticles count={150} splitProgress={splitProgress} />

            <EffectComposer>
                <Bloom intensity={0.6 + splitProgress * 1.2} luminanceThreshold={0.3} luminanceSmoothing={0.9} radius={0.5} />
            </EffectComposer>
        </>
    );
}


// ═══════════════════════════════════════════════════════════════════
// MAIN PAGE COMPONENT
// ═══════════════════════════════════════════════════════════════════
export default function IQTestsIndex() {
    const [iqTests, setIqTests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [scrollY, setScrollY] = useState(0);
    const router = useRouter();

    useEffect(() => {
        let ticking = false;
        const handleScroll = () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    setScrollY(window.scrollY);
                    ticking = false;
                });
                ticking = true;
            }
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        const fetchIQTests = async () => {
            try {
                const res = await fetch(`${API_URL}/api/mock-tests/iq-tests`);
                if (res.ok) {
                    const data = await res.json();
                    setIqTests(data);
                }
            } catch (error) {
                console.error('Error fetching IQ tests:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchIQTests();
    }, []);

    const splitProgress = Math.min(Math.max(scrollY / 700, 0), 1);
    const heroOpacity = Math.max(1 - scrollY * 0.0025, 0);
    const contentReveal = Math.min(Math.max((scrollY - 300) / 400, 0), 1);

    return (
        <>
            <style>{`
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');

            .iq-page {
                background: #f8fafc;
                position: relative;
                overflow-x: hidden;
                font-family: 'Inter', -apple-system, sans-serif;
                color: #1e293b;
            }

            /* ── Hero ── */
            .iq-hero {
                position: sticky;
                top: 0;
                height: 100vh;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                z-index: 1;
                pointer-events: none;
            }

            .iq-canvas-wrap {
                width: 100%;
                height: 100vh;
                position: absolute;
                inset: 0;
            }

            .iq-hero-text-wrap {
                position: relative;
                z-index: 10;
                text-align: center;
                pointer-events: auto;
                max-width: 780px;
                padding: 0 24px;
            }

            /* Badge */
            .iq-badge {
                display: inline-flex;
                align-items: center;
                gap: 8px;
                background: rgba(255,255,255,0.85);
                backdrop-filter: blur(12px);
                -webkit-backdrop-filter: blur(12px);
                padding: 10px 22px;
                border-radius: 100px;
                margin-bottom: 24px;
                border: 1px solid rgba(37,99,235,0.15);
                font-size: 0.78rem;
                font-weight: 600;
                color: #1e40af;
                letter-spacing: 0.1em;
                text-transform: uppercase;
                animation: iqReveal 0.8s ease-out 0.1s both;
            }
            .iq-badge-dot {
                width: 7px; height: 7px;
                border-radius: 50%;
                background: #2563eb;
                animation: iqPulse 2s ease-in-out infinite;
            }
            @keyframes iqPulse {
                0%, 100% { opacity: 0.4; transform: scale(1); }
                50% { opacity: 1; transform: scale(1.4); }
            }

            /* Title — solid white with text-shadow for readability */
            .iq-title {
                font-size: clamp(2.8rem, 6vw, 5.2rem);
                font-weight: 900;
                line-height: 1.05;
                letter-spacing: -0.04em;
                margin-bottom: 22px;
                color: #fff;
                text-shadow: 0 2px 40px rgba(15,23,42,0.6), 0 1px 8px rgba(0,0,0,0.4);
                animation: iqReveal 1s ease-out 0.2s both;
            }
            .iq-title em {
                font-style: normal;
                color: #93c5fd;
                text-shadow: 0 0 60px rgba(59,130,246,0.5), 0 2px 40px rgba(15,23,42,0.6);
            }

            .iq-subtitle {
                color: rgba(255,255,255,0.8);
                font-size: 1.15rem;
                line-height: 1.7;
                margin-bottom: 40px;
                max-width: 540px;
                margin-left: auto;
                margin-right: auto;
                text-shadow: 0 1px 12px rgba(0,0,0,0.3);
                animation: iqReveal 0.8s ease-out 0.4s both;
            }

            @keyframes iqReveal {
                0% { opacity: 0; transform: translateY(30px); filter: blur(10px); }
                100% { opacity: 1; transform: translateY(0); filter: blur(0); }
            }

            .iq-cta {
                display: inline-flex;
                align-items: center;
                gap: 12px;
                padding: 16px 40px;
                border-radius: 14px;
                background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
                color: white;
                font-weight: 600;
                font-size: 1.05rem;
                border: none;
                cursor: pointer;
                transition: all 0.4s cubic-bezier(0.4,0,0.2,1);
                box-shadow: 0 8px 32px -4px rgba(37,99,235,0.45);
                position: relative;
                overflow: hidden;
                animation: iqReveal 0.8s ease-out 0.6s both;
            }
            .iq-cta:hover {
                transform: translateY(-3px) scale(1.02);
                box-shadow: 0 12px 40px rgba(37,99,235,0.5);
            }

            .iq-scroll-indicator {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 8px;
                color: rgba(255,255,255,0.5);
                font-size: 0.72rem;
                font-weight: 500;
                letter-spacing: 0.12em;
                text-transform: uppercase;
                animation: iqBounce 2s ease-in-out infinite;
            }
            @keyframes iqBounce {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(10px); }
            }

            /* ── Content Section ── */
            .iq-content {
                position: relative;
                z-index: 5;
                background: #f8fafc;
            }

            /* ── How It Works ── */
            .iq-how {
                max-width: 1000px;
                margin: 0 auto 80px;
                padding: 0 40px;
            }
            .iq-how-title {
                text-align: center;
                font-size: 0.78rem;
                font-weight: 600;
                letter-spacing: 0.12em;
                text-transform: uppercase;
                color: #2563eb;
                margin-bottom: 12px;
            }
            .iq-how-heading {
                text-align: center;
                font-size: 2rem;
                font-weight: 800;
                color: #0f172a;
                margin-bottom: 56px;
                letter-spacing: -0.03em;
            }
            .iq-how-grid {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 32px;
                counter-reset: step;
            }
            .iq-step {
                text-align: center;
                counter-increment: step;
            }
            .iq-step-num {
                width: 56px; height: 56px;
                border-radius: 16px;
                background: linear-gradient(135deg, #2563eb, #1e40af);
                color: white;
                font-size: 1.3rem;
                font-weight: 800;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0 auto 20px;
                box-shadow: 0 8px 24px -4px rgba(37,99,235,0.3);
            }
            .iq-step h4 {
                font-size: 1.1rem;
                font-weight: 700;
                color: #0f172a;
                margin-bottom: 8px;
            }
            .iq-step p {
                color: #64748b;
                font-size: 0.92rem;
                line-height: 1.6;
            }

            /* ── Section Header ── */
            .iq-section-hdr {
                max-width: 1200px;
                margin: 0 auto 50px;
                padding: 0 40px;
                text-align: center;
            }
            .iq-section-label {
                font-size: 0.78rem;
                font-weight: 600;
                letter-spacing: 0.12em;
                text-transform: uppercase;
                color: #2563eb;
                margin-bottom: 8px;
            }
            .iq-section-hdr h2 {
                font-size: 2.2rem;
                font-weight: 800;
                color: #0f172a;
                margin-bottom: 10px;
                letter-spacing: -0.03em;
            }
            .iq-section-hdr p { color: #64748b; font-size: 1.05rem; }

            /* ── Test Cards ── */
            .iq-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
                gap: 28px;
                max-width: 1100px;
                margin: 0 auto;
                padding: 0 40px 60px;
            }
            .iq-card {
                background: white;
                border-radius: 20px;
                border: 1px solid #e2e8f0;
                padding: 0;
                cursor: pointer;
                transition: all 0.4s cubic-bezier(0.4,0,0.2,1);
                display: flex;
                flex-direction: column;
                position: relative;
                overflow: hidden;
                box-shadow: 0 1px 3px rgba(0,0,0,0.04);
            }
            .iq-card::before {
                pointer-events: none;
                content: '';
                position: absolute;
                top: 0; left: 0; right: 0;
                height: 4px;
                background: linear-gradient(90deg, #2563eb, #3b82f6, #60a5fa);
                transform: scaleX(0);
                transform-origin: left;
                transition: transform 0.5s cubic-bezier(0.4,0,0.2,1);
            }
            .iq-card:hover::before { transform: scaleX(1); }
            .iq-card:hover {
                transform: translateY(-8px);
                border-color: rgba(37,99,235,0.2);
                box-shadow: 0 24px 48px -12px rgba(37,99,235,0.12), 0 8px 24px rgba(0,0,0,0.06);
            }
            .iq-card-top {
                padding: 32px 32px 24px;
                flex: 1;
                display: flex;
                flex-direction: column;
            }
            .iq-card-number {
                font-size: 0.72rem;
                font-weight: 700;
                letter-spacing: 0.12em;
                text-transform: uppercase;
                color: #2563eb;
                margin-bottom: 16px;
            }
            .iq-card-title {
                font-size: 1.35rem;
                font-weight: 800;
                color: #0f172a;
                margin-bottom: 12px;
                line-height: 1.25;
                letter-spacing: -0.02em;
            }
            .iq-card-desc {
                color: #64748b;
                font-size: 0.92rem;
                line-height: 1.6;
                margin-bottom: 24px;
                flex: 1;
            }
            .iq-card-details {
                display: flex;
                gap: 20px;
                padding-top: 16px;
                border-top: 1px solid #f1f5f9;
            }
            .iq-card-detail {
                display: flex;
                flex-direction: column;
            }
            .iq-card-detail-val {
                font-size: 1.1rem;
                font-weight: 700;
                color: #0f172a;
            }
            .iq-card-detail-label {
                font-size: 0.75rem;
                color: #94a3b8;
                font-weight: 500;
                text-transform: uppercase;
                letter-spacing: 0.05em;
            }
            .iq-card-bottom {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 18px 32px;
                border-top: 1px solid #f1f5f9;
                background: #fafbfc;
                transition: all 0.3s;
            }
            .iq-card:hover .iq-card-bottom { background: #f0f7ff; }
            .iq-card-btn {
                font-size: 0.92rem;
                font-weight: 700;
                color: #2563eb;
                letter-spacing: -0.01em;
            }
            .iq-card-chevron {
                width: 32px; height: 32px;
                border-radius: 50%;
                background: white;
                border: 1px solid #e2e8f0;
                display: flex;
                align-items: center;
                justify-content: center;
                color: #2563eb;
                transition: all 0.3s;
            }
            .iq-card:hover .iq-card-chevron {
                background: #2563eb;
                border-color: #2563eb;
                color: white;
                transform: translateX(4px);
            }

            /* ── Why Section ── */
            .iq-why {
                max-width: 1100px;
                margin: 0 auto 100px;
                padding: 0 40px;
            }
            .iq-why-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 24px;
            }
            .iq-why-card {
                background: white;
                border: 1px solid #e2e8f0;
                border-radius: 20px;
                padding: 36px;
                transition: all 0.35s ease;
            }
            .iq-why-card:hover {
                border-color: rgba(37,99,235,0.15);
                box-shadow: 0 16px 40px -12px rgba(0,0,0,0.08);
                transform: translateY(-4px);
            }
            .iq-why-card h4 {
                font-size: 1.15rem;
                font-weight: 700;
                color: #0f172a;
                margin-bottom: 10px;
                letter-spacing: -0.01em;
            }
            .iq-why-card p {
                color: #64748b;
                font-size: 0.92rem;
                line-height: 1.65;
            }
            .iq-why-emoji {
                font-size: 2rem;
                margin-bottom: 16px;
                display: block;
            }

            /* ── Footer CTA ── */
            .iq-footer-cta {
                text-align: center;
                padding: 80px 40px 120px;
                max-width: 700px;
                margin: 0 auto;
            }
            .iq-footer-cta h3 {
                font-size: 2rem;
                font-weight: 800;
                color: #0f172a;
                margin-bottom: 16px;
                letter-spacing: -0.03em;
            }
            .iq-footer-cta p {
                color: #64748b;
                font-size: 1.05rem;
                line-height: 1.7;
                margin-bottom: 36px;
            }
            .iq-footer-btn {
                display: inline-flex;
                align-items: center;
                gap: 12px;
                padding: 16px 40px;
                border-radius: 14px;
                background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
                color: white;
                font-weight: 600;
                font-size: 1.05rem;
                border: none;
                cursor: pointer;
                transition: all 0.4s ease;
                box-shadow: 0 8px 32px -4px rgba(37,99,235,0.4);
            }
            .iq-footer-btn:hover {
                transform: translateY(-3px);
                box-shadow: 0 12px 40px rgba(37,99,235,0.5);
            }

            /* ── Utilities ── */
            .iq-empty {
                text-align: center;
                padding: 100px 40px;
                max-width: 500px;
                margin: 0 auto;
            }
            .iq-loader {
                display: flex;
                justify-content: center;
                padding: 120px 0;
            }
            .iq-ldot {
                width: 10px; height: 10px;
                border-radius: 50%;
                background: #2563eb;
                margin: 0 6px;
                animation: iqDot 1.4s ease-in-out infinite;
            }
            .iq-ldot:nth-child(2) { animation-delay: 0.2s; }
            .iq-ldot:nth-child(3) { animation-delay: 0.4s; }
            @keyframes iqDot {
                0%, 80%, 100% { transform: scale(0.5); opacity: 0.2; }
                40% { transform: scale(1.2); opacity: 1; }
            }

            .iq-fade {
                opacity: 0;
                transform: translateY(30px);
                filter: blur(6px);
                transition: opacity 0.8s cubic-bezier(0.2,0.8,0.2,1), transform 0.8s cubic-bezier(0.2,0.8,0.2,1), filter 0.8s cubic-bezier(0.2,0.8,0.2,1);
            }
            .iq-fade.visible {
                opacity: 1;
                transform: translateY(0);
                filter: blur(0);
            }

            /* ── Responsive ── */
            @media (max-width: 992px) {
                .iq-how-grid { grid-template-columns: 1fr; gap: 28px; }
                .iq-why-grid { grid-template-columns: 1fr; }
                .iq-grid { grid-template-columns: 1fr; padding: 0 20px 60px; gap: 20px; }
            }
            @media (max-width: 768px) {
                .iq-title { font-size: 2.4rem; }
                .iq-subtitle { font-size: 0.95rem; }
                .iq-section-hdr h2 { font-size: 1.8rem; }
                .iq-how-heading { font-size: 1.6rem; }
                .iq-card-top { padding: 24px 24px 20px; }
                .iq-card-bottom { padding: 14px 24px; }
                .iq-why-card { padding: 28px; }
                .iq-footer-cta h3 { font-size: 1.6rem; }
            }
        `}</style>

            <main className="iq-page">
                <Navbar />

                {/* ── Sticky Hero ── */}
                <section className="iq-hero">
                    <div className="iq-canvas-wrap">
                        <Canvas
                            camera={{ position: [0, 0, 5], fov: 45 }}
                            gl={{ antialias: true, alpha: true }}
                            style={{ background: 'transparent' }}
                        >
                            <Suspense fallback={null}>
                                <BrainScene splitProgress={splitProgress} />
                            </Suspense>
                        </Canvas>
                    </div>

                    <div
                        className="iq-hero-text-wrap"
                        style={{
                            opacity: heroOpacity,
                            transform: `translateY(${scrollY * 0.25}px)`,
                        }}
                    >
                        <div className="iq-badge">
                            <div className="iq-badge-dot"></div>
                            Neural Assessment Suite
                        </div>
                        <h1 className="iq-title">
                            Unlock Your<br />
                            <em>Cognitive Power</em>
                        </h1>
                        <p className="iq-subtitle">
                            Advanced psychometric assessments measuring logic, pattern recognition, and analytical thinking — timed, scored, and ranked.
                        </p>

                        {iqTests.length > 0 && scrollY < 100 && (
                            <button className="iq-cta" onClick={() => {
                                document.getElementById('iq-tests-grid')?.scrollIntoView({ behavior: 'smooth' });
                            }}>
                                Begin Assessment <ArrowRight size={18} />
                            </button>
                        )}

                        {scrollY < 50 && (
                            <div className="iq-scroll-indicator" style={{ marginTop: 48 }}>
                                <span>Scroll to Explore</span>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 5v14M19 12l-7 7-7-7" />
                                </svg>
                            </div>
                        )}
                    </div>
                </section>

                {/* ── Scrollable Content ── */}
                <div
                    className="iq-content"
                    style={{
                        opacity: contentReveal,
                        transform: `translateY(${(1 - contentReveal) * 60}px)`,
                        transition: 'opacity 0.15s, transform 0.15s',
                    }}
                >
                    {/* How It Works */}
                    <div className={`iq-how iq-fade ${contentReveal > 0.3 ? 'visible' : ''}`} style={{ transitionDelay: '0.05s' }}>
                        <div className="iq-how-title">How It Works</div>
                        <h3 className="iq-how-heading">Three simple steps to test your mind</h3>
                        <div className="iq-how-grid">
                            <div className="iq-step">
                                <div className="iq-step-num">1</div>
                                <h4>Choose a Test</h4>
                                <p>Select from our curated assessments designed by cognitive science experts.</p>
                            </div>
                            <div className="iq-step">
                                <div className="iq-step-num">2</div>
                                <h4>Solve Under Time</h4>
                                <p>Answer MCQ-based questions within the time limit speed and accuracy both matter.</p>
                            </div>
                            <div className="iq-step">
                                <div className="iq-step-num">3</div>
                                <h4>Get Your Score</h4>
                                <p>Receive detailed analytics with your performance breakdown and rank.</p>
                            </div>
                        </div>
                    </div>

                    {/* Test Cards */}
                    {loading ? (
                        <div className="iq-loader">
                            <div className="iq-ldot"></div>
                            <div className="iq-ldot"></div>
                            <div className="iq-ldot"></div>
                        </div>
                    ) : iqTests.length === 0 ? (
                        <div className="iq-empty">
                            <h3 style={{ color: '#0f172a', fontSize: '1.4rem', fontWeight: 700, marginBottom: 12 }}>Assessments Coming Soon</h3>
                            <p style={{ color: '#64748b', fontSize: '1rem', lineHeight: 1.6 }}>New adaptive assessments are being prepared. Check back soon.</p>
                        </div>
                    ) : (
                        <div id="iq-tests-grid" className={`iq-fade ${contentReveal > 0.5 ? 'visible' : ''}`} style={{ transitionDelay: '0.15s' }}>
                            <div className="iq-section-hdr">
                                <div className="iq-section-label">Assessments</div>
                                <h2>Select Your Assessment</h2>
                                <p>Premium cognitive test suite — timed, scored, ranked</p>
                            </div>
                            <div className="iq-grid">
                                {iqTests.map((test, idx) => (
                                    <Link href={`/iq-tests/${test._id}`} key={test._id} className='iq-card' style={{ cursor: 'pointer' }}>
                                        <div className="iq-card-top">
                                            <div className="iq-card-number">Assessment {String(idx + 1).padStart(2, '0')}</div>
                                            <div className="iq-card-title">{test.title}</div>
                                            <div className="iq-card-details">
                                                <div className="iq-card-detail">
                                                    <div className="iq-card-detail-val">{test.duration} min</div>
                                                    <div className="iq-card-detail-label">Duration</div>
                                                </div>
                                                <div className="iq-card-detail">
                                                    <div className="iq-card-detail-val">{test.totalQuestions || test.questions?.length || '—'}</div>
                                                    <div className="iq-card-detail-label">Questions</div>
                                                </div>
                                                <div className="iq-card-detail">
                                                    <div className="iq-card-detail-val">MCQ</div>
                                                    <div className="iq-card-detail-label">Format</div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="iq-card-bottom">
                                            <span className="iq-card-btn">Start Assessment</span>
                                            <div className="iq-card-chevron">
                                                <ArrowRight size={15} />
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Footer CTA */}
                    {iqTests.length > 0 && (
                        <div className={`iq-footer-cta iq-fade ${contentReveal > 0.8 ? 'visible' : ''}`} style={{ transitionDelay: '0.3s' }}>
                            <h3>Ready to Challenge Yourself?</h3>
                            <p>Take 15 minutes to discover your cognitive profile. No registration required — just start and get your score instantly.</p>
                            <button className="iq-footer-btn" onClick={() => {
                                document.getElementById('iq-tests-grid')?.scrollIntoView({ behavior: 'smooth' });
                            }}>
                                Start an Assessment <ArrowRight size={18} />
                            </button>
                        </div>
                    )}
                </div>
            </main>
        </>
    );
}
