// Test component to verify shared UI package integration
import { Button } from "@kstorybridge/ui";
import { Card, CardHeader, CardTitle, CardContent } from "@kstorybridge/ui";
import { cn } from "@kstorybridge/utils";

export default function SharedUITest() {
  return (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle>Shared UI Test</CardTitle>
      </CardHeader>
      <CardContent>
        <p className={cn("text-sm text-gray-600 mb-4")}>
          This component uses shared UI components from @kstorybridge/ui and utilities from @kstorybridge/utils.
        </p>
        <Button variant="outline" size="sm">
          Test Button
        </Button>
      </CardContent>
    </Card>
  );
}