"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("admin@example.com");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Set cookie via API
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        // Redirect to the page we came from, or to meetings
        const redirect = searchParams.get("redirect") || "/meetings";
        router.push(redirect);
        router.refresh();
      } else {
        alert("Login error. Please check your email.");
      }
    } catch (error) {
      console.error("[Login] Error:", error);
      alert("Login error");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Login</CardTitle>
          <CardDescription>Enter your email to login</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                required
              />
            </div>
            <div className="text-sm text-gray-500">
              <p className="font-medium mb-1">Available users:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>admin@example.com (Admin)</li>
                <li>alice@example.com (User)</li>
                <li>bob@example.com (User)</li>
              </ul>
            </div>
            <Button type="submit" className="w-full">
              Login
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
