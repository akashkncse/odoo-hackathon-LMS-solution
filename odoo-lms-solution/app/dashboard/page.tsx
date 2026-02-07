import Link from "next/link";
import { BookOpen, GraduationCap } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold">Welcome to your Dashboard</h1>
      <p className="text-muted-foreground mt-1">
        Start learning something new or continue where you left off.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Link href="/dashboard/courses">
          <Card className="transition-shadow hover:shadow-md">
            <CardHeader>
              <div className="bg-primary/10 text-primary mb-2 flex size-10 items-center justify-center rounded-lg">
                <BookOpen className="size-5" />
              </div>
              <CardTitle>Browse Courses</CardTitle>
              <CardDescription>
                Explore our catalog and find courses that interest you.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <span className="text-primary text-sm font-medium">
                View catalog &rarr;
              </span>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/my-learning">
          <Card className="transition-shadow hover:shadow-md">
            <CardHeader>
              <div className="bg-primary/10 text-primary mb-2 flex size-10 items-center justify-center rounded-lg">
                <GraduationCap className="size-5" />
              </div>
              <CardTitle>My Learning</CardTitle>
              <CardDescription>
                Continue your enrolled courses and track your progress.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <span className="text-primary text-sm font-medium">
                View my courses &rarr;
              </span>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
