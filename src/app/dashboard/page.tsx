import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

export default function DashboardPage() {
  const scanHistory = [
    { id: '1', product: 'Daily Moisturizing Lotion', date: '2024-07-29', score: 46, label: 'Red' },
    { id: '2', product: 'Natural Care Body Butter', date: '2024-07-28', score: 98, label: 'Green' },
    { id: '3', product: 'Scented Shower Gel', date: '2024-07-27', score: 28, label: 'Red' },
  ]

  const getBadgeClass = (label: string) => {
    switch (label) {
      case 'Green':
        return 'bg-chart-2/10 text-chart-2 border-chart-2/20 hover:bg-chart-2/20';
      case 'Yellow':
        return 'bg-chart-4/10 text-chart-4 border-chart-4/20 hover:bg-chart-4/20';
      case 'Red':
        return 'bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20';
      default:
        return '';
    }
  }

  return (
    <div className="container py-12">
      <h1 className="text-3xl font-bold mb-8 font-headline">My Dashboard</h1>
      <Card>
        <CardHeader>
          <CardTitle>Recent Scans</CardTitle>
          <CardDescription>Here is a history of your recent product scans.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Scan Date</TableHead>
                <TableHead className="text-right">Safety Score</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {scanHistory.map(scan => (
                <TableRow key={scan.id}>
                  <TableCell className="font-medium">{scan.product}</TableCell>
                  <TableCell>{scan.date}</TableCell>
                  <TableCell className="text-right">
                    <Badge className={getBadgeClass(scan.label)}>
                      {scan.score} - {scan.label}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
