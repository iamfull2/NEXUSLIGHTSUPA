
import { useState } from 'react';
import { PerfectCutoutEngine } from '../perfectCutout';

export const useImageGeneration = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const removeBackground = async (imageUrl: string): Promise<string> => {
        setLoading(true);
        setError(null);
        try {
            const result = await PerfectCutoutEngine.process(imageUrl);
            setLoading(false);
            return result;
        } catch (err: any) {
            setLoading(false);
            setError(err.message || "Failed to remove background");
            throw err;
        }
    };

    return { removeBackground, loading, error };
};
