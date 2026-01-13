'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { API_URL } from '@/lib/api';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Loader from '../components/ui/Loader';
import CourseCardSkeleton from '../components/ui/CourseCardSkeleton';
import { BookOpen, Users, Award, CheckCircle, ClipboardCheck, Users2, Video } from 'lucide-react';

export default function Home() {
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    fetch(`${API_URL}/api/courses`)
      .then(res => res.json())
      .then(data => setCourses(data?.reverse()))
      .catch(err => console.error('Failed to fetch courses', err));
  }, []);

  return (
    <div className="container" style={{ paddingBottom: '120px' }}>
      {/* Hero Section */}
      <header style={{ textAlign: 'center', padding: '100px 0 80px' }}>
        <h1 className="hero-title animate-fade-in" style={{ color: '#0f172a', marginBottom: '24px', letterSpacing: '-0.03em', fontWeight: 800 }}>
          Master Your Future with Seedite
        </h1>

        <p className="animate-fade-in" style={{ fontSize: '1.25rem', color: '#64748b', maxWidth: '600px', margin: '0 auto 40px', lineHeight: '1.6' }}>
          Access premium courses, mock tests, and video solutions tailored for your success.
          Join thousands of students achieving their dreams.
        </p>

        <div className="animate-fade-in" style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginBottom: '80px' }}>
          <Link href="/courses">
            <Button style={{ fontSize: '1.1rem', padding: '16px 32px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.1), 0 2px 4px -1px rgba(37, 99, 235, 0.06)' }}>Explore Courses</Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="outline" style={{ fontSize: '1.1rem', padding: '16px 32px', borderRadius: '12px', background: 'white' }}>Dashboard</Button>
          </Link>
        </div>

        {/* Highlight Banner / Trust Badge - Clean Row */}
        <div className="animate-fade-in" style={{
          maxWidth: 'max-content',
          margin: '0 auto',
          padding: '12px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
          background: '#f8fafc',
          borderRadius: '100px',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{ borderRadius: '50%', overflow: 'hidden', display: 'flex', border: '1px solid #e2e8f0' }}>
            <Image src="/nstlogo.png" alt="NST Logo" width={28} height={28} />
          </div>
          <span style={{ fontSize: '1rem', fontWeight: '500', color: '#475569' }}>
            Course content developed with guidance from the NSAT team of NST.
          </span>
        </div>
      </header>


      {/* Features Section - Clean Grid */}
      <section style={{ marginBottom: '140px' }}>
        <h2 className="section-title">Why Choose Seedite?</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px' }}>
          <div className="modern-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left' }}>
            <div className="icon-box">
              <BookOpen size={28} color="#0f172a" strokeWidth={1.5} />
            </div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '12px', fontWeight: '700', color: '#0f172a' }}>Mock-Based Learning</h3>
            <p style={{ color: '#64748b', lineHeight: '1.7', fontSize: '1rem' }}>
              Topic-wise and full-length NSAT mock tests with detailed video solutions focused on exam-relevant problem solving.            </p>
          </div>

          <div className="modern-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left' }}>
            <div className="icon-box">
              <Award size={28} color="#0f172a" strokeWidth={1.5} />
            </div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '12px', fontWeight: '700', color: '#0f172a' }}>Guided by NSAT Experience</h3>
            <p style={{ color: '#64748b', lineHeight: '1.7', fontSize: '1rem' }}>
              Preparation strategy and content shaped with guidance from NST students and mentors familiar with the NSAT process.            </p>
          </div>

          <div className="modern-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left' }}>
            <div className="icon-box">
              <CheckCircle size={28} color="#0f172a" strokeWidth={1.5} />
            </div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '12px', fontWeight: '700', color: '#0f172a' }}>Concept Clarity</h3>
            <p style={{ color: '#64748b', lineHeight: '1.7', fontSize: '1rem' }}>
              In-depth video explanations that break down each question step by step to build strong problem-solving intuition.            </p>
          </div>
        </div>
      </section>

      {/* Featured Courses - Clean List/Grid */}
      <section style={{ marginBottom: '140px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '48px' }}>
          <h2 className="section-title" style={{ marginBottom: 0, textAlign: 'left' }}>Featured Courses</h2>
          <Link href="/courses">
            <Button variant="outline" style={{ borderRadius: '100px', fontSize: '0.9rem', padding: '10px 24px' }}>View All &rarr;</Button>
          </Link>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '32px' }}>
          {courses.length > 0 ? (
            courses.slice(0, 3).map(course => (
              <div key={course._id} className="modern-card" style={{ padding: '0', overflow: 'hidden', display: 'flex', flexDirection: 'column', border: '1px solid #e2e8f0' }}>
                <div style={{ height: '200px', background: '#f8fafc', position: 'relative', borderBottom: '1px solid #f1f5f9' }}>
                  <img src={course.thumbnail} alt={course.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <h3 style={{ fontSize: '1.25rem', marginBottom: '8px', fontWeight: '700', color: '#0f172a' }}>{course.title}</h3>
                  <p style={{ color: '#64748b', fontSize: '0.95rem', flex: 1, marginBottom: '24px', lineHeight: '1.6' }}>
                    {course.description.substring(0, 80)}...
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
                    <span style={{ fontSize: '1.25rem', fontWeight: '700', color: '#0f172a' }}>₹{course.price}</span>
                    <Link href={`/courses/${course._id}`}>
                      <span style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--primary)', cursor: 'pointer' }}>View Details &rarr;</span>
                    </Link>
                  </div>
                </div>
              </div>
            ))
          ) : (
            Array(3).fill(0).map((_, i) => <CourseCardSkeleton key={i} />)
          )}
        </div>
      </section>

      {/* Instructors Section - Simple & Clean */}
      <section>
        <h2 className="section-title">Meet Our Experts</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '32px' }}>

          <div className="modern-card" style={{ textAlign: 'center', padding: '32px 24px' }}>
            <div
              style={{
                width: '100px',
                height: '100px',
                borderRadius: '50%',
                margin: '0 auto 20px',
                position: 'relative',
                overflow: 'hidden',
                border: '1px solid #e2e8f0'
              }}
            >
              <Image
                src="/ritik.png"
                alt="Logo"
                fill
                style={{ objectFit: 'cover' }}
              />
            </div>

            <h3 style={{ fontSize: '1.1rem', marginBottom: '4px', fontWeight: '700', color: '#0f172a' }}>Ritik Raj</h3>
            <p style={{ color: 'var(--primary)', fontWeight: '600', fontSize: '0.9rem', marginBottom: '12px' }}>Ex-SDE Intern @Physics Wallah</p>
            <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: '1.6' }}>
              Third year Btech student at NST
            </p>
          </div>

          <div className="modern-card" style={{ textAlign: 'center', padding: '32px 24px' }}>
            <div
              style={{
                width: '100px',
                height: '100px',
                borderRadius: '50%',
                margin: '0 auto 20px',
                position: 'relative',
                overflow: 'hidden',
                border: '1px solid #e2e8f0'
              }}
            >
              <Image
                src="/amod.jpg"
                alt="Logo"
                fill
                style={{ objectFit: 'cover' }}
              />
            </div>

            <h3 style={{ fontSize: '1.1rem', marginBottom: '4px', fontWeight: '700', color: '#0f172a' }}>Amod Ranjan</h3>
            <p style={{ color: 'var(--primary)', fontWeight: '600', fontSize: '0.9rem', marginBottom: '12px' }}>3x ICPC Regionalist</p>
            <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: '1.6' }}>
              Third year Btech student at NST
            </p>
          </div>

        </div>
      </section>
    </div>
  );
}
