'use client';

import { useCallback, useRef, useEffect } from 'react';

/**
 * Custom hook for managing mock test state persistence in localStorage.
 * Handles saving/restoring test progress with drift detection and expiry checks.
 * 
 * @param {string} userId - The user's ID
 * @param {string} testId - The test's ID
 * @returns {Object} Persistence utilities
 */
export default function useMockTestPersistence(userId, testId) {
    const debounceTimerRef = useRef(null);

    // Generate the localStorage key
    const getStorageKey = useCallback(() => {
        if (!userId || !testId) return null;
        return `mock_test_${userId}_${testId}`;
    }, [userId, testId]);

    /**
     * Save progress to localStorage with debouncing (500ms)
     * @param {Object} data - Test progress data
     * @param {Object} data.answers - User's answers { questionIndex: optionIndex }
     * @param {number} data.currentQuestion - Current question index
     * @param {number} data.timeRemaining - Time remaining in seconds
     * @param {Array} data.markedForReview - Array of question indices marked for review
     * @param {Array} data.viewedQuestions - Array of viewed question indices
     */
    const saveProgress = useCallback((data) => {
        const key = getStorageKey();
        if (!key) return;

        // Clear existing debounce timer
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        // Debounce the save operation
        debounceTimerRef.current = setTimeout(() => {
            try {
                const progressData = {
                    answers: data.answers || {},
                    currentQuestion: data.currentQuestion || 0,
                    timeRemaining: data.timeRemaining || 0,
                    markedForReview: Array.from(data.markedForReview || []),
                    viewedQuestions: Array.from(data.viewedQuestions || []),
                    timestamp: Date.now(),
                    testId: testId
                };
                localStorage.setItem(key, JSON.stringify(progressData));
            } catch (error) {
                console.error('Failed to save test progress:', error);
            }
        }, 500);
    }, [getStorageKey, testId]);

    /**
     * Restore progress from localStorage with drift detection
     * @returns {Object|null} Restored progress or null if none exists
     * Returns { timeExpired: true, answers } if time has expired after drift correction
     */
    const restoreProgress = useCallback(() => {
        const key = getStorageKey();
        if (!key) return null;

        try {
            const savedData = localStorage.getItem(key);
            if (!savedData) return null;

            const progress = JSON.parse(savedData);

            // Verify it's for the correct test
            if (progress.testId !== testId) {
                localStorage.removeItem(key);
                return null;
            }

            // Drift detection: calculate elapsed time since last save
            const savedTimestamp = progress.timestamp || Date.now();
            const elapsedSeconds = Math.floor((Date.now() - savedTimestamp) / 1000);

            // Adjust time remaining for elapsed time (drift correction)
            let adjustedTimeRemaining = (progress.timeRemaining || 0) - elapsedSeconds;

            // Expiry check: if time has expired, return special object for auto-submit
            if (adjustedTimeRemaining <= 0) {
                return {
                    timeExpired: true,
                    answers: progress.answers || {},
                    currentQuestion: progress.currentQuestion || 0,
                    markedForReview: new Set(progress.markedForReview || []),
                    viewedQuestions: new Set(progress.viewedQuestions || [])
                };
            }

            // Return restored progress with adjusted time
            return {
                timeExpired: false,
                answers: progress.answers || {},
                currentQuestion: progress.currentQuestion || 0,
                timeRemaining: adjustedTimeRemaining,
                markedForReview: new Set(progress.markedForReview || []),
                viewedQuestions: new Set(progress.viewedQuestions || [])
            };
        } catch (error) {
            console.error('Failed to restore test progress:', error);
            return null;
        }
    }, [getStorageKey, testId]);

    /**
     * Clear progress from localStorage (call after successful submission)
     */
    const clearProgress = useCallback(() => {
        const key = getStorageKey();
        if (!key) return;

        // Clear any pending debounce
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
            debounceTimerRef.current = null;
        }

        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.error('Failed to clear test progress:', error);
        }
    }, [getStorageKey]);

    /**
     * Check if saved progress exists (quick check without parsing)
     * @returns {boolean}
     */
    const hasProgress = useCallback(() => {
        const key = getStorageKey();
        if (!key) return false;

        try {
            return localStorage.getItem(key) !== null;
        } catch {
            return false;
        }
    }, [getStorageKey]);

    // Cleanup debounce timer on unmount
    useEffect(() => {
        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, []);

    return {
        saveProgress,
        restoreProgress,
        clearProgress,
        hasProgress
    };
}
