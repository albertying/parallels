// Updated Network component using localStorage for id
// If an id exists in localStorage, use it automatically; otherwise show enter-id UI.

import React, { useState, useEffect } from "react";
import Graph from "./Graph";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useNavigate } from "react-router-dom";

export default function Network() {
  const [id, setId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null as string | null);
  const [original, setOriginal] = useState(null as any);
  const [similar, setSimilar] = useState([] as any[]);
  const navigate = useNavigate();

  const apiBase = "http://localhost:3000";

  // 👉 Only READ from localStorage, do NOT write to it
  useEffect(() => {
    const savedId = localStorage.getItem("profileId");
    if (savedId) {
      setId(savedId);
    }
  }, []);

  const findSimilar = async () => {
    if (!id) return setError("Enter an id");

    localStorage.setItem("id", id); // Save id

    setError(null);
    setLoading(true);
    try {
      const res = await fetch(
        `${apiBase}/similar/${encodeURIComponent(id)}?limit=8`,
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = await res.json();

      setOriginal(body.originalProfile || { id, name: id });
      const s = (body.similarProfiles || body.similar || []).map((p: any) => ({
        id: String(p._id || p.id || p),
        name: p.name || p.label || String(p._id || p.id),
        score: p.score,
      }));
      setSimilar(s);
    } catch (e: any) {
      setError(e.message || "Failed");
    } finally {
      setLoading(false);
    }
  };

  const nodes = original
    ? [
        { id: original.id, label: original.name, group: 1 },
        ...similar.map((s) => ({ id: s.id, label: s.name, group: 2 })),
      ]
    : [];

  const links = original
    ? similar.map((s) => ({
        source: original.id,
        target: s.id,
        value: s.score ?? 1,
      }))
    : [];

  const hasStoredId = Boolean(localStorage.getItem("id"));

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold">Network — Find Similar Profiles</h1>

      {/* Only show ID input if no stored ID and no loaded results */}
      {!hasStoredId && !original && (
        <Card className="p-4">
          <CardHeader>
            <CardTitle className="text-lg">Enter ID</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2 items-center">
              <Input
                placeholder="Enter profile id"
                value={id}
                onChange={(e) => setId(e.target.value)}
              />
              <Button onClick={findSimilar} disabled={loading}>
                {loading ? "Searching..." : "Continue"}
              </Button>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Auto-load graph if ID exists */}
      {hasStoredId && !original && (
        <div>
          <p className="text-sm text-gray-600">Using stored ID: {id}</p>
          <Button onClick={findSimilar} disabled={loading} className="mt-2">
            {loading ? "Loading..." : "Load Network"}
          </Button>
        </div>
      )}

      {original && (
        <Card className="p-4 space-y-4">
          <CardHeader>
            <CardTitle>
              Original: {original.name} ({original.id})
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="w-full overflow-hidden rounded-xl shadow">
              <Graph
                dataNodes={nodes as any}
                dataLinks={links as any}
                width={860}
                height={420}
              />
            </div>

            <div className="mt-6">
              <h2 className="font-semibold mb-2">Similar Profiles</h2>
              <ul className="space-y-1 text-sm">
                {similar.map((s) => (
                  <li
                    key={s.id}
                    onClick={() => navigate(`/profile/${s.id}`)}
                    className="cursor-pointer hover:underline text-blue-600"
                  >
                    {s.name} — score: {s.score ?? "n/a"}
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
