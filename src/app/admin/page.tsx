
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Tag, Users, FileText, MessageSquare, Gift, Lightbulb, Undo2 } from "lucide-react";
import Link from "next/link";

export default function AdminDashboardPage() {
  const dashboardCards = [
    { title: "Products", href: "/admin/products", icon: Package, description: "Manage your product catalog." },
    { title: "Coupons", href: "/admin/coupons", icon: Tag, description: "Create and manage discount codes." },
    { title: "Orders", href: "/admin/orders", icon: FileText, description: "View and process customer orders." },
    { title: "Return Requests", href: "/admin/returns", icon: Undo2, description: "Manage product return requests." },
    { title: "Feedback", href: "/admin/feedback", icon: MessageSquare, description: "Review user feedback." },
    { title: "Product Requests", href: "/admin/requests", icon: Lightbulb, description: "Manage user product requests." },
    { title: "Gift Claims", href: "/admin/claims", icon: Gift, description: "View and manage gift claims." },
    // { title: "Users", href: "/admin/users", icon: Users, description: "Manage user accounts." },
  ];

  return (
    <div className="space-y-8">
      <div className="pb-6 border-b">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">Welcome to the AtoZdpolify control panel.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {dashboardCards.map((card) => (
          <Link href={card.href} key={card.title} className="group">
            <Card className="h-full hover:shadow-lg transition-shadow border-border hover:border-primary/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">{card.title}</CardTitle>
                <card.icon className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{card.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
      {/* Add more dashboard widgets or summaries here */}
    </div>
  );
}
