import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield } from "lucide-react";
import AdminCategories from "@/components/admin/AdminCategories";
import AdminModules from "@/components/admin/AdminModules";
import AdminKnowledge from "@/components/admin/AdminKnowledge";
import AdminUsers from "@/components/admin/AdminUsers";
import AdminClassrooms from "@/components/admin/AdminClassrooms";

export default function Admin() {
  return (
    <div className="px-4 py-6">
      <div className="mb-4 flex items-center gap-2">
        <Shield className="h-5 w-5 text-primary" />
        <h1 className="font-display text-2xl font-bold text-foreground">Admin Panel</h1>
      </div>

      <Tabs defaultValue="categories">
        <TabsList className="mb-4 grid w-full grid-cols-5">
          <TabsTrigger value="categories" className="text-xs">Categories</TabsTrigger>
          <TabsTrigger value="modules" className="text-xs">Modules</TabsTrigger>
          <TabsTrigger value="knowledge" className="text-xs">Knowledge</TabsTrigger>
          <TabsTrigger value="users" className="text-xs">Users</TabsTrigger>
          <TabsTrigger value="classrooms" className="text-xs">Classrooms</TabsTrigger>
        </TabsList>

        <TabsContent value="categories"><AdminCategories /></TabsContent>
        <TabsContent value="modules"><AdminModules /></TabsContent>
        <TabsContent value="knowledge"><AdminKnowledge /></TabsContent>
        <TabsContent value="users"><AdminUsers /></TabsContent>
        <TabsContent value="classrooms"><AdminClassrooms /></TabsContent>
      </Tabs>
    </div>
  );
}
