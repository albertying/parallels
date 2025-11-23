import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

const API_BASE = "http://localhost:3000";

interface Profile {
  id: string;
  name: string;
  age: number;
  major: string;
  interests: string;
  hobbies: string;
  bio: string;
  createdAt: string;
}

export default function ProfilePage() {
  const { id } = useParams<{ id: string }>();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const load = async () => {
      try {
        const res = await fetch(`${API_BASE}/profile/${id}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();

        setProfile({
          id: data.id,
          name: data.name,
          age: data.age,
          major: data.major,
          interests: data.interests,
          hobbies: data.hobbies,
          bio: data.bio,
          createdAt: data.createdAt,
        });
      } catch (err: any) {
        setError(err.message || "Failed to fetch profile");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  if (loading) {
    return (
      <div className="p-6 max-w-3xl mx-auto space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">{profile.name}</CardTitle>
        </CardHeader>

        <CardContent className="space-y-3 text-sm leading-relaxed">
          <p>
            <strong>ID:</strong> {profile.id}
          </p>
          <p>
            <strong>Age:</strong> {profile.age}
          </p>
          <p>
            <strong>Major:</strong> {profile.major}
          </p>
          <p>
            <strong>Interests:</strong> {profile.interests}
          </p>
          <p>
            <strong>Hobbies:</strong> {profile.hobbies}
          </p>
          <p>
            <strong>Bio:</strong> {profile.bio}
          </p>

          <p className="text-xs text-muted-foreground">
            Created At: {new Date(profile.createdAt).toLocaleString()}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
