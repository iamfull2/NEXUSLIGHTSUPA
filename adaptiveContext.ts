import { ContextDimensions } from "./types";

/**
 * ADAPTIVE CONTEXT AWARENESS (V37)
 * Analyzes browser environment, time, and user input patterns.
 */

export class AdaptiveContextAwareness {
    
    static analyze(userInput: string, sessionDuration: number): ContextDimensions {
        const now = new Date();
        const hour = now.getHours();
        
        // Temporal
        let timeOfDay = 'day';
        if (hour >= 22 || hour < 5) timeOfDay = 'late_night';
        else if (hour < 12) timeOfDay = 'morning';
        else if (hour >= 18) timeOfDay = 'evening';

        const month = now.getMonth();
        let seasonality = 'generic';
        if (month >= 2 && month <= 4) seasonality = 'spring';
        else if (month >= 5 && month <= 7) seasonality = 'summer';
        else if (month >= 8 && month <= 10) seasonality = 'fall';
        else seasonality = 'winter';

        // Behavioral
        const inputLower = userInput.toLowerCase();
        let urgency = 'medium';
        if (inputLower.includes('asap') || inputLower.includes('urgent') || inputLower.includes('fast')) urgency = 'high';
        if (sessionDuration > 30 * 60 * 1000) urgency = 'low'; // Long session implies relaxed exploration

        const experimentMode = inputLower.includes('test') || inputLower.includes('try') || inputLower.includes('idea');
        
        let budgetSignal = 'moderate';
        if (inputLower.includes('premium') || inputLower.includes('luxury')) budgetSignal = 'unlimited';
        if (inputLower.includes('cheap') || inputLower.includes('free')) budgetSignal = 'tight';

        // Device
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

        return {
            temporal: {
                timeOfDay,
                dayOfWeek: now.getDay() === 0 || now.getDay() === 6 ? 'weekend' : 'weekday',
                seasonality
            },
            userProfile: {
                level: 'expert', // Mocked for demo
                role: 'creative_director'
            },
            behavioral: {
                urgency,
                experimentMode,
                budgetSignal
            },
            device: {
                type: isMobile ? 'mobile' : 'desktop'
            }
        };
    }
}
