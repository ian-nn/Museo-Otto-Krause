import { useState, useEffect } from 'react';

export const useVitrinas = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Lógica para obtener datos
    }, []);

    return { data, loading, error };
};
