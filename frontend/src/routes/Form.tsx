import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "react-router-dom";

export default function Form() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    age: "",
    major: "",
    interests: "",
    hobbies: "",
    bio: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("http://localhost:3000/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        throw new Error("Failed to create profile");
      }

      const data = await response.json();
      console.log("Profile Created:", data);

      if (data.profile.id) {
        localStorage.setItem("profileId", data.profile.id);
        console.log("Stored profile ID:", data.profile.id);
      }

      alert("Profile created successfully!");
    } catch (error) {
      console.error("Error creating profile:", error);
      alert("Failed to create profile. Please try again.");
    }
  };

  return (
    <div className="w-full min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardContent>
          <h1 className="text-3xl font-semibold mb-6 text-center">
            Create Your Profile
          </h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <Input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Your name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Age</label>
              <Input
                type="number"
                name="age"
                value={form.age}
                onChange={handleChange}
                placeholder="Your age"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Major</label>
              <Input
                name="major"
                value={form.major}
                onChange={handleChange}
                placeholder="Your major"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Interests
              </label>
              <Textarea
                name="interests"
                value={form.interests}
                onChange={handleChange}
                placeholder="e.g. astronomy, psychology, European culture"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Hobbies</label>
              <Textarea
                name="hobbies"
                value={form.hobbies}
                onChange={handleChange}
                placeholder="e.g. hiking, music, gaming"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Bio</label>
              <Textarea
                name="bio"
                value={form.bio}
                onChange={handleChange}
                placeholder="Tell others about yourself"
              />
            </div>

            <Button type="submit">Create Profile</Button>
            <Button
              type="button"
              className="ml-5"
              onClick={() => navigate("/network")}
            >
              Go to Network
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
