'use client';

import { useState, useEffect, useRef, useMemo, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { API_URL } from '@/lib/api';
import Navbar from '@/components/Navbar';
import { ArrowRight, Clock, BarChart3, Zap } from 'lucide-react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial, Sphere } from '@react-three/drei';
import * as THREE from 'three';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

// ═══════════════════════════════════════════════════════════════════
// 3D BRAIN HEMISPHERE
// ═══════════════════════════════════════════════════════════════════
function BrainHemisphere({ side, color1, color2 }) {
    const meshRef = useRef();
    const glowRef = useRef();
    useFrame((state) => {
        if (!meshRef.current) return;
        const t = state.clock.elapsedTime;
        meshRef.current.rotation.y = t * 0.15 + side * 0.3;
        meshRef.current.rotation.z = Math.sin(t * 0.3) * 0.1;
        if (glowRef.current) glowRef.current.rotation.y = t * 0.15 + side * 0.3;
    });
    return (
        <group>
            <mesh ref={meshRef} scale={1.3}>
                <Sphere args={[1, 64, 64]}>
                    <MeshDistortMaterial color={color1} emissive={color2} emissiveIntensity={0.3}
                        roughness={0.2} metalness={0.8} distort={0.35} speed={2} transparent opacity={0.85} />
                </Sphere>
            </mesh>
            <mesh ref={glowRef} scale={1.5}>
                <Sphere args={[1, 32, 32]}>
                    <meshBasicMaterial color={color2} transparent opacity={0.04} side={THREE.BackSide} />
                </Sphere>
            </mesh>
        </group>
    );
}

// ═══════════════════════════════════════════════════════════════════
// NEURAL NETWORK — nodes connected by dendrites with traveling pulses
// ═══════════════════════════════════════════════════════════════════
function NeuralNetwork({ nodeCount = 25 }) {
    const groupRef = useRef();
    const linesRef = useRef();
    const pulsesRef = useRef();

    const { nodes, edges, linePositions, pulseData } = useMemo(() => {
        const n = [];
        for (let i = 0; i < nodeCount; i++) {
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            const r = 1.8 + Math.random() * 1.8;
            n.push(new THREE.Vector3(
                r * Math.sin(phi) * Math.cos(theta),
                r * Math.sin(phi) * Math.sin(theta) * 0.7,
                r * Math.cos(phi) * 0.8
            ));
        }
        const e = [];
        for (let i = 0; i < n.length; i++) {
            for (let j = i + 1; j < n.length; j++) {
                if (n[i].distanceTo(n[j]) < 2.8) e.push([i, j]);
            }
        }
        const lp = new Float32Array(e.length * 6);
        e.forEach((edge, idx) => {
            lp[idx * 6] = n[edge[0]].x; lp[idx * 6 + 1] = n[edge[0]].y; lp[idx * 6 + 2] = n[edge[0]].z;
            lp[idx * 6 + 3] = n[edge[1]].x; lp[idx * 6 + 4] = n[edge[1]].y; lp[idx * 6 + 5] = n[edge[1]].z;
        });
        const pd = e.map(() => ({ progress: Math.random(), speed: 0.3 + Math.random() * 0.5 }));
        return { nodes: n, edges: e, linePositions: lp, pulseData: pd };
    }, [nodeCount]);

    useFrame((state) => {
        if (!groupRef.current) return;
        const t = state.clock.elapsedTime;
        groupRef.current.rotation.y = t * 0.06;
        groupRef.current.rotation.x = Math.sin(t * 0.04) * 0.08;
        if (pulsesRef.current) {
            const pos = pulsesRef.current.geometry.attributes.position;
            pulseData.forEach((p, i) => {
                p.progress = (p.progress + p.speed * 0.008) % 1;
                const a = nodes[edges[i][0]], b = nodes[edges[i][1]];
                pos.array[i * 3] = a.x + (b.x - a.x) * p.progress;
                pos.array[i * 3 + 1] = a.y + (b.y - a.y) * p.progress;
                pos.array[i * 3 + 2] = a.z + (b.z - a.z) * p.progress;
            });
            pos.needsUpdate = true;
        }
    });

    const pulsePositions = useMemo(() => new Float32Array(edges.length * 3), [edges]);

    return (
        <group ref={groupRef}>
            {nodes.map((n, i) => (
                <mesh key={i} position={n}>
                    <sphereGeometry args={[0.045, 16, 16]} />
                    <meshBasicMaterial color="#93c5fd" transparent opacity={0.9} />
                </mesh>
            ))}
            <lineSegments ref={linesRef}>
                <bufferGeometry>
                    <bufferAttribute attach="attributes-position" count={edges.length * 2} array={linePositions} itemSize={3} />
                </bufferGeometry>
                <lineBasicMaterial color="#60a5fa" transparent opacity={0.15} />
            </lineSegments>
            <points ref={pulsesRef}>
                <bufferGeometry>
                    <bufferAttribute attach="attributes-position" count={edges.length} array={pulsePositions} itemSize={3} />
                </bufferGeometry>
                <pointsMaterial size={0.06} color="#93c5fd" transparent opacity={0.9}
                    sizeAttenuation blending={THREE.AdditiveBlending} depthWrite={false} />
            </points>
        </group>
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
            <mesh><sphereGeometry args={[0.3, 32, 32]} /><meshBasicMaterial color="#93c5fd" transparent opacity={0.5} /></mesh>
            <mesh scale={1.5}><sphereGeometry args={[0.3, 32, 32]} /><meshBasicMaterial color="#60a5fa" transparent opacity={0.2} side={THREE.BackSide} /></mesh>
            <mesh scale={3}><sphereGeometry args={[0.3, 16, 16]} /><meshBasicMaterial color="#93c5fd" transparent opacity={0.08} side={THREE.BackSide} /></mesh>
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
// SCENE
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
            <NeuralNetwork nodeCount={40} />
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
                pointer-events: none;
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
                color: #0f172a;
                padding-top: 100px;
                background-image: 
                    radial-gradient(circle at 15% 50%, rgba(37, 99, 235, 0.03) 0%, transparent 50%),
                    radial-gradient(circle at 85% 30%, rgba(29, 78, 216, 0.03) 0%, transparent 50%);
            }

            /* ── How It Works — Dark Container ── */
            .iq-how {
                max-width: 1200px;
                margin: 0 auto 100px;
                padding: 0 40px;
            }
            .iq-how-inner {
                background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
                border-radius: 28px;
                padding: 60px 48px;
                position: relative;
                overflow: hidden;
            }
            .iq-how-inner::before {
                content: '';
                position: absolute;
                top: -100px; right: -100px;
                width: 300px; height: 300px;
                background: radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%);
                border-radius: 50%;
                filter: blur(40px);
            }
            .iq-how-inner::after {
                content: '';
                position: absolute;
                bottom: -80px; left: -60px;
                width: 250px; height: 250px;
                background: radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%);
                border-radius: 50%;
                filter: blur(30px);
            }
            .iq-how-title {
                text-align: center;
                font-size: 0.8rem;
                font-weight: 700;
                letter-spacing: 0.2em;
                text-transform: uppercase;
                color: #60a5fa;
                margin-bottom: 16px;
                position: relative;
                z-index: 1;
            }
            .iq-how-heading {
                text-align: center;
                font-size: 2.2rem;
                font-weight: 800;
                background: linear-gradient(135deg, #ffffff 0%, #cbd5e1 100%);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                margin-bottom: 56px;
                letter-spacing: -0.03em;
                position: relative;
                z-index: 1;
            }
            .iq-how-grid {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 24px;
                position: relative;
                z-index: 1;
            }
            .iq-step {
                position: relative;
                background: rgba(255, 255, 255, 0.04);
                border: 1px solid rgba(255, 255, 255, 0.06);
                border-radius: 20px;
                padding: 36px 28px;
                text-align: left;
                transition: all 0.4s ease;
            }
            .iq-step:hover {
                background: rgba(255, 255, 255, 0.07);
                border-color: rgba(59, 130, 246, 0.2);
                transform: translateY(-4px);
            }
            .iq-step-num {
                font-size: 3.5rem;
                font-weight: 900;
                color: transparent;
                -webkit-text-stroke: 1px rgba(255, 255, 255, 0.12);
                margin-bottom: 12px;
                line-height: 1;
                transition: all 0.4s ease;
            }
            .iq-step:hover .iq-step-num {
                -webkit-text-stroke: 1px rgba(96, 165, 250, 0.4);
                color: rgba(59, 130, 246, 0.05);
            }
            .iq-step h4 {
                font-size: 1.2rem;
                font-weight: 700;
                color: #e2e8f0;
                margin-bottom: 10px;
                letter-spacing: -0.01em;
            }
            .iq-step p {
                color: #94a3b8;
                font-size: 0.9rem;
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

            /* ── Assessment Cards — Clean White ── */
            .iq-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
                gap: 28px;
                max-width: 1200px;
                margin: 0 auto;
                padding: 0 40px 80px;
            }

            .iq-card-premium {
                padding: 0 !important;
                border-radius: 20px !important;
                background: #ffffff !important;
                cursor: pointer;
                transition: all 0.4s cubic-bezier(0.4,0,0.2,1) !important;
                display: flex;
                flex-direction: column;
                position: relative;
                text-decoration: none;
                border: 1px solid #e2e8f0 !important;
                box-shadow: 0 4px 20px -4px rgba(0,0,0,0.04) !important;
                overflow: hidden;
            }
            .iq-card-premium:hover {
                transform: translateY(-6px) !important;
                border-color: rgba(37,99,235,0.2) !important;
                box-shadow: 0 20px 40px -10px rgba(37,99,235,0.1) !important;
            }

            .iq-card-inner {
                height: 100%;
                display: flex;
                flex-direction: column;
            }

            /* Card header strip */
            .iq-card-header {
                background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%);
                padding: 24px 28px;
                position: relative;
                overflow: hidden;
            }
            .iq-card-header::after {
                content: '';
                position: absolute;
                top: -30px; right: -30px;
                width: 100px; height: 100px;
                background: rgba(255,255,255,0.08);
                border-radius: 50%;
            }
            .iq-card-number {
                font-size: 0.7rem;
                font-weight: 700;
                letter-spacing: 0.12em;
                text-transform: uppercase;
                color: rgba(255,255,255,0.7);
                margin-bottom: 10px;
            }
            .iq-card-title {
                font-size: 1.3rem;
                font-weight: 800;
                color: #ffffff;
                line-height: 1.3;
                letter-spacing: -0.02em;
                position: relative;
                z-index: 1;
            }

            .iq-card-body {
                padding: 28px;
                flex: 1;
                display: flex;
                flex-direction: column;
                gap: 20px;
            }
            .iq-card-meta {
                display: flex;
                align-items: center;
                gap: 24px;
            }
            .iq-card-meta-item {
                display: flex;
                flex-direction: column;
                gap: 4px;
            }
            .iq-card-meta-val {
                font-size: 1.1rem;
                font-weight: 800;
                color: #0f172a;
                line-height: 1;
            }
            .iq-card-meta-label {
                font-size: 0.75rem;
                color: #64748b;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.05em;
            }
            .iq-card-meta-divider {
                width: 1px;
                height: 32px;
                background: #e2e8f0;
            }
            .iq-card-marks {
                display: flex;
                gap: 12px;
                background: #f8fafc;
                padding: 12px 16px;
                border-radius: 12px;
                border: 1px solid #f1f5f9;
            }
            .iq-card-mark {
                font-size: 0.8rem;
                font-weight: 600;
                display: flex;
                align-items: center;
                gap: 6px;
            }
            .iq-card-mark::before {
                content: '';
                width: 6px; height: 6px;
                border-radius: 50%;
            }
            .iq-card-mark.correct { color: #15803d; }
            .iq-card-mark.correct::before { background: #22c55e; }
            .iq-card-mark.incorrect { color: #b91c1c; }
            .iq-card-mark.incorrect::before { background: #ef4444; }

            /* Status badge */
            .iq-card-status {
                display: inline-flex;
                align-items: center;
                gap: 6px;
                padding: 6px 14px;
                border-radius: 100px;
                font-size: 0.72rem;
                font-weight: 700;
                margin-top: auto;
                align-self: flex-start;
                text-transform: uppercase;
                letter-spacing: 0.05em;
            }
            .iq-card-status.attempted {
                background: #dcfce7;
                color: #15803d;
            }
            .iq-card-status.not-attempted {
                background: #f1f5f9;
                color: #64748b;
            }

            .iq-card-bottom {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 16px 28px;
                border-top: 1px solid #f1f5f9;
                transition: background 0.3s;
            }
            .iq-card-premium:hover .iq-card-bottom { background: #f8fafc; }
            .iq-card-btn {
                font-size: 0.92rem;
                font-weight: 700;
                color: #000;
                letter-spacing: -0.01em;
            }
            .iq-card-chevron {
                width: 34px; height: 34px;
                border-radius: 50%;
                background: #f1f5f9;
                border: none;
                color: #2563eb;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.4s ease;
            }
            .iq-card-premium:hover .iq-card-chevron {
                background: #2563eb;
                color: #fff;
                transform: translateX(4px);
                box-shadow: 0 4px 12px rgba(37,99,235,0.3);
            }

            /* ── Footer CTA (Home Page Style Container) ── */
            .iq-footer-cta-container {
                max-width: 1150px;
                margin: 0 auto 100px;
                padding: 0 40px;
            }
            .iq-footer-cta-card {
                background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
                border-radius: 24px;
                padding: 60px 40px;
                position: relative;
                overflow: hidden;
                text-align: center;
                box-shadow: 0 20px 40px -10px rgba(0,0,0,0.2);
            }
            .iq-footer-cta-card h3 {
                font-size: 2.2rem;
                font-weight: 800;
                margin-bottom: 16px;
                background: linear-gradient(135deg, #ffffff 0%, #cbd5e1 100%);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                letter-spacing: -0.02em;
                position: relative;
                z-index: 2;
            }
            .iq-footer-cta-card p {
                color: #94a3b8;
                font-size: 1.1rem;
                line-height: 1.6;
                margin-bottom: 36px;
                max-width: 600px;
                margin-left: auto;
                margin-right: auto;
                position: relative;
                z-index: 2;
            }
            .iq-footer-btn-modern {
                background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
                color: white;
                padding: 16px 36px;
                border-radius: 12px;
                font-size: 1.05rem;
                font-weight: 700;
                display: inline-flex;
                align-items: center;
                gap: 10px;
                border: none;
                cursor: pointer;
                box-shadow: 0 8px 30px -4px rgba(37, 99, 235, 0.5);
                transition: all 0.3s ease;
                position: relative;
                z-index: 2;
            }
            .iq-footer-btn-modern:hover {
                transform: translateY(-2px);
                box-shadow: 0 12px 40px -6px rgba(37, 99, 235, 0.6);
            }
            .iq-footer-orb-1 {
                position: absolute;
                top: -50px; left: -50px;
                width: 200px; height: 200px;
                background: radial-gradient(circle, rgba(59,130,246,0.3) 0%, transparent 70%);
                border-radius: 50%;
                filter: blur(30px);
            }
            .iq-footer-orb-2 {
                position: absolute;
                bottom: -80px; right: -50px;
                width: 250px; height: 250px;
                background: radial-gradient(circle, rgba(139,92,246,0.2) 0%, transparent 70%);
                border-radius: 50%;
                filter: blur(40px);
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
                .iq-how-grid { grid-template-columns: 1fr; gap: 20px; }
                .iq-how-inner { padding: 40px 28px; }
                .iq-grid { grid-template-columns: 1fr; padding: 0 20px 60px; gap: 20px; }
            }
            @media (max-width: 768px) {
                .iq-title { font-size: 2.4rem; }
                .iq-subtitle { font-size: 0.95rem; }
                .iq-section-hdr h2 { font-size: 1.8rem; }
                .iq-how-heading { font-size: 1.6rem; }
                .iq-how-inner { padding: 32px 20px; border-radius: 20px; }
                .iq-card-top { padding: 24px 24px 20px; }
                .iq-card-bottom { padding: 14px 24px; }
                .iq-footer-cta-card h3 { font-size: 1.6rem; }
                .iq-footer-cta-card { padding: 40px 24px; }
                .iq-footer-cta-container { padding: 0 20px; }
                .iq-how { padding: 0 20px; }
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
                            Logic & Aptitude Practice
                        </div>
                        <h1 className="iq-title">
                            Sharpen Your<br />
                            <em>Problem Solving</em>
                        </h1>
                        <p className="iq-subtitle">
                            Challenge yourself with curated logical reasoning and aptitude tests designed to build your core thinking skills for competitive exams. Timed, scored, and ranked.
                        </p>

                        {iqTests.length > 0 && (
                            <Button style={{ background: 'var(--gradient-primary)' }} className="iq-cta" onClick={() => {
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
                        <div className="iq-how-inner">
                            <div className="iq-how-title">How It Works</div>
                            <h3 className="iq-how-heading">Three steps to test your mind</h3>
                            <div className="iq-how-grid">
                                <div className="iq-step">
                                    <div className="iq-step-num">01</div>
                                    <h4>Pick a Challenge</h4>
                                    <p>Select from our curated logic, quantitative, and aptitude assessments.</p>
                                </div>
                                <div className="iq-step">
                                    <div className="iq-step-num">02</div>
                                    <h4>Beat the Clock</h4>
                                    <p>Answer questions within the time limit. Speed and accuracy both matter.</p>
                                </div>
                                <div className="iq-step">
                                    <div className="iq-step-num">03</div>
                                    <h4>Analyze Performance</h4>
                                    <p>Get deep insights, performance breakdown, and see where you rank among peers.</p>
                                </div>
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
                                    const qCount = test.totalQuestions || test.questions?.length || '—';
                                    const correctM = test.correctMarks || 4;
                                    const incorrectM = test.incorrectMarks !== undefined ? test.incorrectMarks : -1;
                                    return (
                                        <Link href={`/iq-tests/${test._id}`} key={test._id} style={{ textDecoration: 'none' }}>
                                            <Card className="iq-card-premium">
                                                <div className="iq-card-inner">
                                                    <div className="iq-card-header">
                                                        <div className="iq-card-number">Assessment {String(idx + 1).padStart(2, '0')}</div>
                                                        <div className="iq-card-title">{test.title}</div>
                                                    </div>
                                                    <div className="iq-card-body">
                                                        <div className="iq-card-meta">
                                                            <div className="iq-card-meta-item">
                                                                <span className="iq-card-meta-val">{test.duration}m</span>
                                                                <span className="iq-card-meta-label">Duration</span>
                                                            </div>
                                                            <div className="iq-card-meta-divider"></div>
                                                            <div className="iq-card-meta-item">
                                                                <span className="iq-card-meta-val">{qCount}</span>
                                                                <span className="iq-card-meta-label">Questions</span>
                                                            </div>
                                                        </div>
                                                        <div className="iq-card-marks">
                                                            <span className="iq-card-mark correct">Correct: +{correctM}</span>
                                                            <span className="iq-card-mark incorrect">Incorrect: {incorrectM}</span>
                                                        </div>

                                                        <div className={`iq-card-status ${hasAttempted ? 'attempted' : 'not-attempted'}`}>
                                                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: hasAttempted ? '#22c55e' : '#94a3b8' }}></div>
                                                            {hasAttempted ? 'Attempted' : 'Not Attempted'}
                                                        </div>
                                                    </div>
                                                    <div className="iq-card-bottom">
                                                        <span className="iq-card-btn">{hasAttempted ? 'View Result' : 'Start Assessment'}</span>
                                                        <div className="iq-card-chevron">
                                                            <ArrowRight size={16} />
                                                        </div>
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
                        <div className="iq-footer-cta-container">
                            <div className="iq-footer-cta-card">
                                <div className="iq-footer-orb-1"></div>
                                <div className="iq-footer-orb-2"></div>
                                <h3>Ready to Challenge Yourself?</h3>
                                <p>Start your first assessment and discover where you stand.</p>
                                <button style={{ background: 'var(--gradient-primary)' }} className="iq-footer-btn-modern" onClick={() => {
                                    document.getElementById('iq-tests-grid')?.scrollIntoView({ behavior: 'smooth' });
                                }}>
                                    Start an Assessment <ArrowRight size={18} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </>
    );
}
