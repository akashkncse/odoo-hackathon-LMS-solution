import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Trophy } from "lucide-react";

export default function PointsPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">My Points</h1>
        <p className="text-muted-foreground mt-1">
          Track your points and achievements.
        </p>
      </div>

      <Card>
        <CardContent className="py-12 text-center">
          <div className="bg-muted mx-auto mb-4 flex size-16 items-center justify-center rounded-full">
            <Trophy className="text-muted-foreground size-8" />
          </div>
          <CardTitle className="text-lg">Coming Soon</CardTitle>
          <CardDescription className="mt-2">
            Complete quizzes and courses to earn points and unlock badges.
          </CardDescription>
        </CardContent>
      </Card>
    </div>
  );
}
