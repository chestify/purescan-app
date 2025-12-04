import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Download, QrCode } from "lucide-react"
import { PRODUCTS_DB } from "@/lib/data"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { SafetyScoreDisplay } from "@/components/SafetyScoreDisplay"

const businessProducts = PRODUCTS_DB.slice(0, 2).map(p => ({
    ...p,
    scans: Math.floor(Math.random() * 500),
    safetyScore: Math.floor(Math.random() * 100),
}));

export default function BusinessDashboardPage() {
  const getBadgeClass = (score: number) => {
    if (score > 80) return 'bg-chart-2/10 text-chart-2 border-chart-2/20 hover:bg-chart-2/20';
    if (score > 50) return 'bg-chart-4/10 text-chart-4 border-chart-4/20 hover:bg-chart-4/20';
    return 'bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20';
  }

  return (
    <div className="container py-12">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold font-headline">Business Dashboard</h1>
        <div className="flex gap-2">
            <Button variant="outline">
                <Download className="mr-2" />
                Download Report
            </Button>
            <Button asChild>
                <Link href="/dashboard/business/products">Manage Products</Link>
            </Button>
        </div>
      </div>
      <div className="grid gap-8">
        <Card>
            <CardHeader>
                <CardTitle>Product Performance</CardTitle>
                <CardDescription>Analytics for your certified products.</CardDescription>
            </CardHeader>
            <CardContent>
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Product Name</TableHead>
                    <TableHead>Total Scans</TableHead>
                    <TableHead>Safety Score</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {businessProducts.map(product => (
                    <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{product.scans}</TableCell>
                    <TableCell>
                        <Badge className={getBadgeClass(product.safetyScore)}>
                            {product.safetyScore}
                        </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                        <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem>View Analytics</DropdownMenuItem>
                            <DropdownMenuItem>
                                <QrCode className="mr-2" />
                                Generate QR Poster
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                        </DropdownMenu>
                    </TableCell>
                    </TableRow>
                ))}
                </TableBody>
            </Table>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Certification Status</CardTitle>
                <CardDescription>Manage your product certification applications.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center text-center gap-4 p-8 bg-muted rounded-lg">
                <p className="text-muted-foreground">You have 2 certified products and 1 pending application.</p>
                <Button>View Applications</Button>
            </CardContent>
        </Card>
      </div>
    </div>
  )
}
