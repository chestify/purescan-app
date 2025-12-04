import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"

export default function SettingsPage() {
  return (
    <div className="container py-12">
      <h1 className="text-3xl font-bold mb-8 font-headline">Settings</h1>
      <div className="grid gap-12">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Update your personal information.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" defaultValue="John Doe" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" defaultValue="john.doe@example.com" />
            </div>
            <Button>Save Profile</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Preferences</CardTitle>
            <CardDescription>Customize your product recommendations.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox id="vegan" />
              <label htmlFor="vegan" className="text-sm font-medium leading-none">
                Vegan
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="fragrance-free" />
              <label htmlFor="fragrance-free" className="text-sm font-medium leading-none">
                Fragrance-Free
              </label>
            </div>
             <div className="flex items-center space-x-2">
              <Checkbox id="hormone-safe" />
              <label htmlFor="hormone-safe" className="text-sm font-medium leading-none">
                Hormone-Safe
              </label>
            </div>
             <div className="flex items-center space-x-2">
              <Checkbox id="baby-safe" />
              <label htmlFor="baby-safe" className="text-sm font-medium leading-none">
                Baby-Safe
              </label>
            </div>
             <Button>Save Preferences</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
