import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function Form() {
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

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Profile Created:", form);
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
                placeholder="e.g. astronomy, psycohlogy, European culture"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Hobbies</label>
              <Textarea
                name="interests"
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
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
