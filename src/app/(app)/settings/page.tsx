"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function SettingsPage() {
  const [presentation, setPresentation] = useState(false);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your preferences and account settings</p>
      </div>

      <section className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Currency & Region</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div>
              <div className="text-sm mb-2">Base Currency</div>
              <Select defaultValue="USD">
                <SelectTrigger>
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD - US Dollar</SelectItem>
                  <SelectItem value="EUR">EUR - Euro</SelectItem>
                  <SelectItem value="BRL">BRL - Real</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <div className="text-sm mb-2">Time Zone</div>
              <Select defaultValue="EST">
                <SelectTrigger>
                  <SelectValue placeholder="Select time zone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EST">Eastern Time (EST)</SelectItem>
                  <SelectItem value="UTC">UTC</SelectItem>
                  <SelectItem value="BRT">Brasília (BRT)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Privacy</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div>
              <div className="font-medium">Presentation Mode</div>
              <div className="text-sm text-muted-foreground">Blur sensitive amounts for privacy</div>
            </div>
            <Button variant={presentation ? "default" : "outline"} onClick={() => setPresentation((v) => !v)}>
              {presentation ? "On" : "Off"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <Button variant="outline">Manage Categories</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Data & Export</CardTitle>
          </CardHeader>
          <CardContent>
            <Button variant="outline">Export All Data</Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

