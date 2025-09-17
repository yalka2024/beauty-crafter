import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function CancellationManagementLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Skeleton */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Skeleton className="h-8 w-8 rounded" />
              <div>
                <Skeleton className="h-6 w-48 mb-2" />
                <Skeleton className="h-4 w-64" />
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-6 w-20" />
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Tabs Skeleton */}
        <div className="space-y-6">
          <Skeleton className="h-10 w-full max-w-md" />

          {/* Stats Cards Skeleton */}
          <div className="grid md:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16 mb-2" />
                  <Skeleton className="h-3 w-20" />
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Content Cards Skeleton */}
          <div className="grid lg:grid-cols-2 gap-6">
            {Array.from({ length: 2 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-32 mb-2" />
                  <Skeleton className="h-4 w-48" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Array.from({ length: 4 }).map((_, j) => (
                      <div key={j} className="flex justify-between items-center">
                        <Skeleton className="h-4 w-24" />
                        <div className="flex items-center space-x-2">
                          <Skeleton className="h-2 w-16 rounded-full" />
                          <Skeleton className="h-4 w-8" />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
