"use client";
import React, { useEffect, useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { LineSquiggle, SparkleIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createRoadmap, generateAIRoadmap } from "@/actions/roadmap";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import useFetch from "@/hooks/use-fetch";

const RoadmapDialouge = () => {
  const [field, setField] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false); // control dialog
  const router = useRouter();

  const handleGenerate = async () => {
    if (!field.trim()) return;
    setLoading(true);
    try {
      const res = await createRoadmap(field); //
      console.log("Roadmap created:", res);
      router.push(`/roadmap/${res.id}`);
      setOpen(false); // ✅ close the dialog
      //   later you can redirect, show toast, or update UI with roadmap
    } catch (err) {
      console.error("Error generating roadmap:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="hidden md:inline-flex items-center gap-2"
        >
          <LineSquiggle className="h-4 w-4" />
          Generate Roadmap
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enter Postion/Skill to Generate Roadmap</DialogTitle>
          <DialogDescription asChild>
            <div className="mt-2">
              <Input
                placeholder="e.g Full Stack Developer"
                value={field}
                onChange={(e) => setField(e.target.value)}
              />
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={handleGenerate} disabled={loading}>
            <SparkleIcon className="h-4 w-4" />
            {loading ? "Generating..." : "Generate"}
          </Button>
          {/* <Button variant={'outline'}>Cancel</Button> */}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RoadmapDialouge;
