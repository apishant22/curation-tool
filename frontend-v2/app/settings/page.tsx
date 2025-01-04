"use client";

import React, { useState, useEffect } from "react";
import Container from "@/components/global/Container";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, Trash2 } from "lucide-react";

interface Member {
  email: string;
}

const SettingsPage = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Fetch members
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const response = await fetch("/api/members");
        const data = await response.json();
        setMembers(data);
      } catch (err) {
        setError("Failed to load members");
        throw err;
      }
    };
    fetchMembers();
  }, []);

  // Add member
  const handleAddMember = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newEmail }),
      });

      if (!response.ok) throw new Error("Failed to add member");

      const newMember = await response.json();
      setMembers([...members, newMember]);
      setNewEmail("");
      setSuccess("Member added successfully");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Failed to add member");
      setTimeout(() => setError(""), 3000);
      throw err;
    }
  };

  // Delete member
  const handleDeleteMember = async (email: string) => {
    try {
      const response = await fetch(
        `/api/members/${encodeURIComponent(email)}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) throw new Error("Failed to delete member");

      setMembers(members.filter((member) => member.email !== email));
      setSuccess("Member removed successfully");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Failed to delete member");
      setTimeout(() => setError(""), 3000);
      throw err;
    }
  };

  return (
    <div className="pt-36">
      <Container>
        <Card className="w-full max-w-2xl mx-auto border dark:border-gray-800">
          <CardHeader>
            <CardTitle className="dark:text-white">Member Management</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Add Member Form */}
            <form onSubmit={handleAddMember} className="flex gap-4 mb-6">
              <Input
                type="email"
                placeholder="Enter email address"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                required
                className="flex-1 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder-gray-400"
              />
              <Button type="submit" className="dark:hover:bg-gray-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Member
              </Button>
            </form>

            {/* Status Messages */}
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {success && (
              <Alert className="mb-4">
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            {/* Members List */}
            <div className="space-y-2">
              {members.map((member) => (
                <div
                  key={member.email}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg transition-colors">
                  <span className="text-sm dark:text-gray-200">
                    {member.email}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteMember(member.email)}
                    className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-gray-700">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </Container>
    </div>
  );
};

export default SettingsPage;
