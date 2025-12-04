import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Eye } from "lucide-react"

export default function FavoritesPage() {
  const favorites = [
    { id: '987654321', product: 'Natural Care Body Butter', score: 98, label: 'Green' },
    { id: '123456789', product: 'Daily Moisturizing Lotion', score: 46, label: 'Red' },
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
      <h1 className="text-3xl font-bold mb-8 font-headline">Saved Products</h1>
      <Card>
        <CardHeader>
          <CardTitle>Your Favorites</CardTitle>
          <CardDescription>A list of products you have saved.</CardDescription>
        </CardHeader>
        <CardContent>
           {favorites.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Safety Score</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {favorites.map(fav => (
                <TableRow key={fav.id}>
                  <TableCell className="font-medium">{fav.product}</TableCell>
                  <TableCell>
                     <Badge className={getBadgeClass(fav.label)}>
                      {fav.score} - {fav.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="ghost" size="icon">
                        <Link href={`/product/${fav.id}`}>
                            <Eye />
                            <span className="sr-only">View Product</span>
                        </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
           ) : (
            <div className="text-center py-12 text-muted-foreground">
                <p>You haven't saved any products yet.</p>
            </div>
           )}
        </CardContent>
      </Card>
    </div>
  )
}
