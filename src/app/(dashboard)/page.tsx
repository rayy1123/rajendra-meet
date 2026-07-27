import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Ringkasan Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardHeader><CardTitle className="text-sm">Total Event</CardTitle></CardHeader><CardContent className="text-2xl font-bold">12</CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm">Total Atlet</CardTitle></CardHeader><CardContent className="text-2xl font-bold">148</CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm">Sekolah/Klub</CardTitle></CardHeader><CardContent className="text-2xl font-bold">24</CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm">Total Heat</CardTitle></CardHeader><CardContent className="text-2xl font-bold">36</CardContent></Card>
      </div>
    </div>
  );
}