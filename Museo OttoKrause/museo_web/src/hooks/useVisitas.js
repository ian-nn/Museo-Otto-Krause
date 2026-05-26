import { useState, useEffect } from 'react';

export const useVisitas = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Lógica para obtener datos
    }, []);

    return { data, loading, error };
};
