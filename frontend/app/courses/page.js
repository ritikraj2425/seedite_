'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';

export default function Courses() {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('http://localhost:5000/api/courses')
            .then(res => res.json())
            .then(data => {
                setCourses(data);
                setLoading(false);
            })
            .catch(err => {
                console.error('Failed to fetch courses', err);
                setLoading(false);
            });
    }, []);

    if (loading) return <div className="container" style={{ paddingTop: '40px', textAlign: 'center' }}>Loading courses...</div>;

    return (
        <div className="container" style={{ paddingTop: '40px' }}>
            <h1 style={{ marginBottom: '32px' }}>Explore All Courses</h1>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
                {courses.map(course => (
                    <Card key={course._id} style={{ display: 'flex', flexDirection: 'column' }}>
                        <div style={{ height: '180px', background: '#334155', borderRadius: '8px', marginBottom: '16px', overflow: 'hidden' }}>
                            <img src={course.thumbnail} alt={course.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                        <h3 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>{course.title}</h3>
                        <p style={{ color: '#94a3b8', fontSize: '0.9rem', flex: 1, marginBottom: '16px' }}>
                            {course.description.substring(0, 100)}...
                        </p>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>₹{course.price}</span>
                            <Link href={`/courses/${course._id}`}>
                                <Button variant="outline">View Details</Button>
                            </Link>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}
