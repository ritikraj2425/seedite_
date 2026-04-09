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
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
// ═══════════════════════════════════════════════════════════════════
// 3D BRAIN HEMISPHERE — pure auto-animation, NO scroll dependency
// ═══════════════════════════════════════════════════════════════════
function BrainHemisphere({ side, color1, color2 }) {
    const meshRef = useRef();
    const glowRef = useRef();

    useFrame((state) => {
        if (!meshRef.current) return;
        const t = state.clock.elapsedTime;
        meshRef.current.rotation.y = t * 0.15 + side * 0.3;
        meshRef.current.rotation.z = Math.sin(t * 0.3) * 0.1;
        if (glowRef.current) {
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
                        emissiveIntensity={0.3}
                        roughness={0.2}
                        metalness={0.8}
                        distort={0.35}
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
                        opacity={0.04}
                        side={THREE.BackSide}
                    />
                </Sphere>
            </mesh>
        </group>
    );
}

// ═══════════════════════════════════════════════════════════════════
// NEURAL PARTICLES — pure auto-animation
// ═══════════════════════════════════════════════════════════════════
function NeuralParticles({ count = 150 }) {
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
                opacity={0.6}
                sizeAttenuation
                blending={THREE.AdditiveBlending}
                depthWrite={false}
            />
        </points>
    );
}

function EnergyCore() {
    const coreRef = useRef();

    useFrame((state) => {
        if (!coreRef.current) return;
        const t = state.clock.elapsedTime;
        coreRef.current.rotation.y = t * 2;
        coreRef.current.rotation.z = t * 0.5;
    });

    return (
        <group ref={coreRef}>
            <mesh>
                <sphereGeometry args={[0.3, 32, 32]} />
                <meshBasicMaterial color="#93c5fd" transparent opacity={0.5} />
            </mesh>
            <mesh scale={1.5}>
                <sphereGeometry args={[0.3, 32, 32]} />
                <meshBasicMaterial color="#60a5fa" transparent opacity={0.2} side={THREE.BackSide} />
            </mesh>
            <mesh scale={3}>
                <sphereGeometry args={[0.3, 16, 16]} />
                <meshBasicMaterial color="#93c5fd" transparent opacity={0.08} side={THREE.BackSide} />
            </mesh>
            {[0, 1, 2].map((i) => (
                <mesh key={i} rotation={[Math.PI / 2 * i * 0.7, i * 0.5, 0]}>
                    <torusGeometry args={[0.6 + i * 0.2, 0.008, 16, 100]} />
                    <meshBasicMaterial color="#60a5fa" transparent opacity={0.3} />
                </mesh>
            ))}
        </group>
    );
}

// ═══════════════════════════════════════════════════════════════════
// SCENE — pure animation, no scroll, no props that trigger re-renders
// ═══════════════════════════════════════════════════════════════════
function BrainScene() {
    return (
        <>
            <ambientLight intensity={0.3} />
            <pointLight position={[5, 5, 5]} intensity={1} color="#60a5fa" />
            <pointLight position={[-5, -3, 5]} intensity={0.8} color="#3b82f6" />
            <pointLight position={[0, 0, 3]} intensity={0.5} color="#dbeafe" />

            <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.4}>
                <BrainHemisphere side={-1} color1="#bfdbfe" color2="#60a5fa" />
            </Float>
            <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.4} floatingRange={[0, 0.1]}>
                <BrainHemisphere side={1} color1="#93c5fd" color2="#3b82f6" />
            </Float>

            <EnergyCore />
            <NeuralParticles count={150} />

            <EffectComposer>
                <Bloom intensity={0.4} luminanceThreshold={0.5} luminanceSmoothing={0.9} radius={0.5} />
            </EffectComposer>
        </>
    );
}


// ═══════════════════════════════════════════════════════════════════
// MAIN PAGE COMPONENT — NO scroll state, NO scroll listener at all
// ═══════════════════════════════════════════════════════════════════
export default function IQTestsIndex() {
    const [iqTests, setIqTests] = useState([]);
    const [attemptedTestIds, setAttemptedTestIds] = useState(new Set());
    const [loading, setLoading] = useState(true);
    const router = useRouter();

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

        const fetchUserProfile = async () => {
            if (typeof window === 'undefined') return;
            const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
            if (savedUser.token) {
                try {
                    const res = await fetch(`${API_URL}/api/users/profile`, {
                        headers: { 'Authorization': `Bearer ${savedUser.token}` }
                    });
                    if (res.ok) {
                        const data = await res.json();
                        if (data.mockTestResults) {
                            const ids = new Set(data.mockTestResults.map(r => r.test?._id || r.test));
                            setAttemptedTestIds(ids);
                        }
                    }
                } catch (error) {
                    console.error('Error fetching profile:', error);
                }
            }
        };

        fetchIQTests();
        fetchUserProfile();
    }, []);

    return (
        <>
            <style>{`
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');

            .iq-page {
                background: #f8fafc;
                position: relative;
                font-family: 'Inter', -apple-system, sans-serif;
                color: #1e293b;
            }

            /* ── Hero Section ── */
            .iq-hero {
                position: relative;
                height: 100vh;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                overflow: hidden;
                background: #f8fafc;
            }

            .iq-canvas-wrap {
                position: absolute;
                inset: 0;
                z-index: 0;
            }

            /* Text wrapper with frosted glass card */
            .iq-hero-text-wrap {
                position: relative;
                z-index: 10;
                text-align: center;
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

            /* Title — white on dark background */
            .iq-title {
                font-size: clamp(2.8rem, 6vw, 5.2rem);
                font-weight: 900;
                line-height: 1.05;
                letter-spacing: -0.04em;
                margin-bottom: 22px;
                color: #111827;
                animation: iqReveal 1s ease-out 0.2s both;
            }
            .iq-title em {
                font-style: normal;
                color: #1D4ED8;
            }

            .iq-subtitle {
                color: #1F2937;
                font-size: 1.15rem;
                font-weight: 500;
                line-height: 1.7;
                margin-bottom: 40px;
                max-width: 540px;
                margin-left: auto;
                margin-right: auto;
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
                color: rgba(15, 23, 42, 0.4);
                font-size: 0.72rem;
                font-weight: 500;
                letter-spacing: 0.12em;
                text-transform: uppercase;
                animation: iqBounce 2s ease-in-out infinite;
                margin-top: 32px;
                position: absolute;
                bottom: 32px;
                left: 50%;
                transform: translateX(-50%);
                z-index: 10;
            }
            @keyframes iqBounce {
                0%, 100% { transform: translateX(-50%) translateY(0); }
                50% { transform: translateX(-50%) translateY(10px); }
            }

            /* ── Content Section ── */
            .iq-content {
                position: relative;
                z-index: 5;
                background: #f8fafc;
                padding-top: 80px;
            }

            /* ── Content Section Premium Light Theme ── */
            .iq-content {
                position: relative;
                z-index: 5;
                background: #f8fafc;
                color: #0f172a;
                padding-top: 100px;
                background-image: 
                    radial-gradient(circle at 15% 50%, rgba(37, 99, 235, 0.03) 0%, transparent 50%),
                    radial-gradient(circle at 85% 30%, rgba(29, 78, 216, 0.03) 0%, transparent 50%);
            }

            /* ── How It Works ── */
            .iq-how {
                max-width: 1100px;
                margin: 0 auto 100px;
                padding: 0 40px;
            }
            .iq-how-title {
                text-align: center;
                font-size: 0.85rem;
                font-weight: 700;
                letter-spacing: 0.2em;
                text-transform: uppercase;
                background: linear-gradient(135deg, #2563eb, #1d4ed8);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                margin-bottom: 20px;
            }
            .iq-how-heading {
                text-align: center;
                font-size: 2.5rem;
                font-weight: 800;
                color: #0f172a;
                margin-bottom: 70px;
                letter-spacing: -0.03em;
            }
            .iq-how-grid {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 30px;
            }
            .iq-step {
                position: relative;
                background: #ffffff;
                border: 1px solid #e2e8f0;
                border-radius: 24px;
                padding: 40px 30px;
                text-align: left;
                box-shadow: 0 4px 20px -5px rgba(0,0,0,0.03);
                transition: all 0.4s ease;
            }
            .iq-step:hover {
                border-color: rgba(37, 99, 235, 0.2);
                transform: translateY(-5px);
                box-shadow: 0 20px 40px -10px rgba(37, 99, 235, 0.1);
            }
            .iq-step-num {
                font-size: 4rem;
                font-weight: 900;
                color: transparent;
                -webkit-text-stroke: 1px #cbd5e1;
                margin-bottom: 15px;
                line-height: 1;
                transition: all 0.4s ease;
            }
            .iq-step:hover .iq-step-num {
                -webkit-text-stroke: 1px #60a5fa;
                color: rgba(37, 99, 235, 0.05);
            }
            .iq-step h4 {
                font-size: 1.3rem;
                font-weight: 700;
                color: #0f172a;
                margin-bottom: 12px;
                letter-spacing: -0.01em;
            }
            .iq-step p {
                color: #64748b;
                font-size: 0.95rem;
                line-height: 1.7;
            }

            /* ── Section Header ── */
            .iq-section-hdr {
                max-width: 1200px;
                margin: 0 auto 60px;
                padding: 0 40px;
                text-align: center;
            }
            .iq-section-label {
                font-size: 0.85rem;
                font-weight: 700;
                letter-spacing: 0.2em;
                text-transform: uppercase;
                background: linear-gradient(135deg, #2563eb, #1d4ed8);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                margin-bottom: 20px;
            }
            .iq-section-hdr h2 {
                font-size: 2.8rem;
                font-weight: 800;
                color: #0f172a;
                margin-bottom: 16px;
                letter-spacing: -0.03em;
            }
            .iq-section-hdr p { 
                color: #64748b; 
                font-size: 1.15rem; 
                max-width: 600px;
                margin: 0 auto;
            }

            /* ── Premium Test Cards ── */
            .iq-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
                gap: 30px;
                max-width: 1150px;
                margin: 0 auto;
                padding: 0 40px 80px;
            }
            
            /* Overriding generic Card component */
            .iq-card-premium {
                padding: 0 !important;
                border-radius: 20px !important;
                border: 1px solid #e2e8f0;
                box-shadow: 0 4px 6px -1px rgba(0,0,0,0.03) !important;
                cursor: pointer;
                transition: all 0.4s cubic-bezier(0.4,0,0.2,1) !important;
                display: flex;
                flex-direction: column;
                position: relative;
                overflow: hidden;
                text-decoration: none;
            }
            .iq-card-premium::before {
                content: '';
                position: absolute;
                top: 0; left: 0; right: 0;
                height: 3px;
                background: linear-gradient(90deg, #60a5fa, #2563eb, #1d4ed8);
                transform: scaleX(0);
                transform-origin: left;
                transition: transform 0.5s cubic-bezier(0.4,0,0.2,1);
            }
            .iq-card-premium:hover::before { transform: scaleX(1); }
            .iq-card-premium:hover {
                transform: translateY(-8px) !important;
                border-color: rgba(37,99,235,0.2);
                box-shadow: 0 24px 48px -12px rgba(37,99,235,0.12), 0 8px 24px rgba(0,0,0,0.04) !important;
            }

            .iq-card-top {
                padding: 35px 35px 25px;
                flex: 1;
                display: flex;
                flex-direction: column;
            }
            .iq-card-number {
                font-size: 0.75rem;
                font-weight: 800;
                letter-spacing: 0.15em;
                text-transform: uppercase;
                color: #2563eb;
                margin-bottom: 20px;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            .iq-card-number::before {
                content: '';
                display: block;
                width: 6px; height: 6px;
                border-radius: 50%;
                background: #2563eb;
                box-shadow: 0 0 8px rgba(37, 99, 235, 0.4);
            }
            .iq-card-title {
                font-size: 1.3rem;
                font-weight: 800;
                color: #0f172a;
                margin-bottom: 16px;
                line-height: 1.3;
                letter-spacing: -0.02em;
            }
            .iq-card-metrics {
                display: flex;
                gap: 15px;
                padding-top: 20px;
                border-top: 1px solid #f1f5f9;
                margin-top: auto;
            }
            .iq-card-metric {
                background: #f8fafc;
                border: 1px solid #f1f5f9;
                border-radius: 12px;
                padding: 12px 16px;
                flex: 1;
                text-align: center;
            }
            .iq-card-metric-val {
                font-size: 1.2rem;
                font-weight: 800;
                color: #0f172a;
                margin-bottom: 4px;
            }
            .iq-card-metric-label {
                font-size: 0.7rem;
                color: #64748b;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.05em;
            }
            .iq-card-bottom {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 24px 35px;
                background: #fafbfc;
                border-top: 1px solid #f1f5f9;
                transition: background 0.3s;
            }
            .iq-card-premium:hover .iq-card-bottom { background: #f0f7ff; }
            .iq-card-btn {
                font-size: 0.95rem;
                font-weight: 700;
                color: #2563eb;
                letter-spacing: -0.01em;
            }
            .iq-card-chevron {
                width: 36px; height: 36px;
                border-radius: 50%;
                background: white;
                border: 1px solid #e2e8f0;
                color: #2563eb;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.4s ease;
            }
            .iq-card-premium:hover .iq-card-chevron {
                background: #2563eb;
                color: #fff;
                border-color: #2563eb;
                transform: translateX(6px) scale(1.05);
                box-shadow: 0 4px 15px rgba(37,99,235,0.3);
            }

            /* ── Footer CTA ── */
            .iq-footer-cta {
                text-align: center;
                padding: 100px 40px 140px;
                max-width: 800px;
                margin: 0 auto;
                position: relative;
            }
            .iq-footer-cta h3 {
                font-size: 2.6rem;
                font-weight: 900;
                color: #0f172a;
                margin-bottom: 20px;
                letter-spacing: -0.03em;
            }
            .iq-footer-cta p {
                color: #64748b;
                font-size: 1.15rem;
                line-height: 1.8;
                margin-bottom: 40px;
                max-width: 600px;
                margin-left: auto;
                margin-right: auto;
            }
            .iq-footer-btn {
                box-shadow: 0 10px 30px -10px rgba(37,99,235,0.4);
                padding: 18px 48px !important;
                border-radius: 100px !important;
                font-size: 1.1rem !important;
                font-weight: 700 !important;
                gap: 12px;
                display: inline-flex;
            }
            .iq-footer-btn:hover {
                transform: translateY(-3px) scale(1.02);
                box-shadow: 0 20px 50px -10px rgba(37,99,235,0.4);
            }

            /* ── Utilities ── */
            .iq-empty {
                text-align: center;
                padding: 100px 40px;
                max-width: 500px;
                margin: 0 auto;
                background: white;
                border: 1px solid #e2e8f0;
                border-radius: 24px;
                box-shadow: 0 4px 20px -5px rgba(0,0,0,0.03);
            }
            .iq-empty h3 { color: #0f172a; font-size: 1.5rem; font-weight: 800; margin-bottom: 12px; }
            .iq-empty p { color: #64748b; font-size: 1rem; line-height: 1.6; }

            .iq-loader {
                display: flex;
                justify-content: center;
                padding: 120px 0;
            }
            .iq-ldot {
                width: 10px; height: 10px;
                border-radius: 50%;
                background: #3b82f6;
                margin: 0 6px;
                animation: iqDot 1.4s ease-in-out infinite;
                box-shadow: 0 0 10px rgba(59, 130, 246, 0.3);
            }            .iq-ldot:nth-child(2) { animation-delay: 0.2s; }
            .iq-ldot:nth-child(3) { animation-delay: 0.4s; }
            @keyframes iqDot {
                0%, 80%, 100% { transform: scale(0.5); opacity: 0.2; }
                40% { transform: scale(1.2); opacity: 1; }
            }

            /* ── Responsive ── */
            @media (max-width: 992px) {
                .iq-how-grid { grid-template-columns: 1fr; gap: 28px; }
                .iq-grid { grid-template-columns: 1fr; padding: 0 20px 60px; gap: 20px; }
            }
            @media (max-width: 768px) {
                .iq-title { font-size: 2.4rem; }
                .iq-subtitle { font-size: 0.95rem; }
                .iq-section-hdr h2 { font-size: 1.8rem; }
                .iq-how-heading { font-size: 1.6rem; }
                .iq-card-top { padding: 24px 24px 20px; }
                .iq-card-bottom { padding: 14px 24px; }
                .iq-footer-cta h3 { font-size: 1.6rem; }
            }
        `}</style>

            <main className="iq-page">
                <Navbar />

                {/* ── Hero — no scroll JS, just static layout ── */}
                <section className="iq-hero">
                    <div className="iq-canvas-wrap">
                        <Canvas
                            camera={{ position: [0, 0, 5], fov: 45 }}
                            gl={{ antialias: true, alpha: true }}
                            style={{ background: 'transparent' }}
                        >
                            <Suspense fallback={null}>
                                <BrainScene />
                            </Suspense>
                        </Canvas>
                    </div>

                    <div className="iq-hero-text-wrap">
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

                        {iqTests.length > 0 && (
                            <Button variant="primary" className="iq-cta" onClick={() => {
                                document.getElementById('iq-tests-grid')?.scrollIntoView({ behavior: 'smooth' });
                            }}>
                                Begin Assessment <ArrowRight size={18} />
                            </Button>
                        )}
                    </div>

                    <div className="iq-scroll-indicator">
                        <span>Scroll to Explore</span>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 5v14M19 12l-7 7-7-7" />
                        </svg>
                    </div>
                </section>

                {/* ── Content — normal flow, no scroll-linked transforms ── */}
                <div className="iq-content">
                    {/* How It Works */}
                    <div className="iq-how">
                        <div className="iq-how-title">How It Works</div>
                        <h3 className="iq-how-heading">Three steps to test your mind</h3>
                        <div className="iq-how-grid">
                            <div className="iq-step">
                                <div className="iq-step-num">01</div>
                                <h4>Choose a Test</h4>
                                <p>Select from our curated assessments designed by cognitive science experts.</p>
                            </div>
                            <div className="iq-step">
                                <div className="iq-step-num">02</div>
                                <h4>Solve Under Time</h4>
                                <p>Answer MCQ-based questions within the time limit. Speed and accuracy both matter.</p>
                            </div>
                            <div className="iq-step">
                                <div className="iq-step-num">03</div>
                                <h4>Get Your Score</h4>
                                <p>Receive detailed analytics with your performance breakdown and comparative rank.</p>
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
                        <div id="iq-tests-grid">
                            <div className="iq-section-hdr">
                                <div className="iq-section-label">Assessments</div>
                                <h2>Select Your Assessment</h2>
                                <p>Premium cognitive test suite timed, scored, ranked</p>
                            </div>
                            <div className="iq-grid">
                                {iqTests.map((test, idx) => {
                                    const hasAttempted = attemptedTestIds.has(test._id);
                                    return (
                                        <Link href={`/iq-tests/${test._id}`} key={test._id} style={{ textDecoration: 'none' }}>
                                            <Card className="iq-card-premium">
                                                <div className="iq-card-top">
                                                    <div className="iq-card-number">Assessment {String(idx + 1).padStart(2, '0')}</div>
                                                    <div className="iq-card-title">{test.title}</div>
                                                    <div className="iq-card-metrics">
                                                        <div className="iq-card-metric">
                                                            <div className="iq-card-metric-val">{test.duration}m</div>
                                                            <div className="iq-card-metric-label">Duration</div>
                                                        </div>
                                                        <div className="iq-card-metric">
                                                            <div className="iq-card-metric-val">{test.totalQuestions || test.questions?.length || '—'}</div>
                                                            <div className="iq-card-metric-label">Questions</div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="iq-card-bottom">
                                                    <span className="iq-card-btn">{hasAttempted ? 'View Result' : 'Start Assessment'}</span>
                                                    <div className="iq-card-chevron">
                                                        <ArrowRight size={18} />
                                                    </div>
                                                </div>
                                            </Card>
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Footer CTA */}
                    {iqTests.length > 0 && (
                        <div className="iq-footer-cta">
                            <h3>Ready to Challenge Yourself?</h3>
                            <p>Just start and get your score instantly.</p>
                            <Button className="iq-footer-btn" variant="primary" onClick={() => {
                                document.getElementById('iq-tests-grid')?.scrollIntoView({ behavior: 'smooth' });
                            }}>
                                Start an Assessment <ArrowRight size={18} />
                            </Button>
                        </div>
                    )}
                </div>
            </main>
        </>
    );
}
