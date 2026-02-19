'use client';

import Link from 'next/link';
import { Home, AlertCircle, MoveLeft } from 'lucide-react';
import styles from './not-found.module.css';

export default function NotFound() {
    return (
        <div className={styles.container}>
            {/* Background Effects */}
            <div className={styles.backgroundGradient}></div>
            <div className={styles.orb1}></div>
            <div className={styles.orb2}></div>

            <div className={styles.contentWrapper}>

                {/* Visual 404 Element */}
                <div className={styles.visualContainer}>
                    <h1 className={styles.errorCode}>
                        404
                    </h1>
                    <div className={styles.iconWrapper}>
                        <div className={styles.iconCard}>
                            <AlertCircle size={64} color="white" strokeWidth={1.5} />
                        </div>
                    </div>
                </div>

                {/* Text Content */}
                <div className={styles.messageCard}>
                    <h2 className={styles.title}>
                        Page Not Found
                    </h2>
                    <p className={styles.description}>
                        The page you are looking for might have been moved, renamed, or doesn't exist. Let's get you back on track.
                    </p>

                    {/* Action Buttons */}
                    <div className={styles.buttonGroup}>
                        <Link
                            href="/"
                            className={styles.primaryButton}
                        >
                            <Home size={20} />
                            <span>Return Home</span>
                        </Link>

                        <button
                            onClick={() => window.history.back()}
                            className={styles.secondaryButton}
                        >
                            <MoveLeft size={20} />
                            <span>Go Back</span>
                        </button>
                    </div>
                </div>

                {/* Footer Links */}
                <div className={styles.footer}>
                    <a href="/courses" className={styles.link}>Courses</a>
                    <Link href="/dashboard" className={styles.link}>Dashboard</Link>
                    <a href="mailto:seediteofficial@gmail.com" className={styles.link}>Support</a>
                </div>
            </div>
        </div>
    );
}
