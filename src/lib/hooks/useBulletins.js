import { useState, useEffect, useCallback } from 'react';

export default function useBulletins(limit = null) {
  const [buletins, setBuletins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchBuletins = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/buletin");
      if (!res.ok) throw new Error("Gagal mengambil buletin");
      const data = await res.json();
      let result = Array.isArray(data) ? data : [];
      if (limit && result.length > limit) result = result.slice(0, limit);
      setBuletins(result);
    } catch (err) {
      setError(err.message);
      setBuletins([]);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchBuletins();
  }, [fetchBuletins]);

  return { buletins, loading, error, refetch: fetchBuletins };
} 