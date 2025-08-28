import { db } from "@/lib/prisma";
import RoadmapCanvas from "../_components/Roadmapcanvas";

export default async function RoadmapPage({ params }) {
  const roadmap = await db.roadmap.findUnique({
    where: { id: params.roadmapid },
  });

  if (!roadmap) {
    return (
      <div className="p-8 text-center text-red-500">Roadmap not found</div>
    );
  }

  // parse roadmapData from Prisma (stored as JSON)
  const data = roadmap.roadmapData;
  const { roadmapTitle, description, duration, initialNodes, initialEdges } =
    data;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 h-screen">
      {/* Left column: Info (scrollable) */}
      <div className="p-6 space-y-4 overflow-y-auto md:col-span-1 border-r">
        <h1 className="text-3xl font-bold">{roadmapTitle}</h1>
        <p className="text-gray-600">{description}</p>
        <span className="inline-block mt-2 px-4 py-1 bg-blue-100 text-blue-600 rounded-full text-sm">
          Duration: {duration}
        </span>
      </div>

      {/* Right column: Canvas */}
      <div className="md:col-span-2 flex-1 overflow-hidden">
        <RoadmapCanvas nodes={initialNodes} edges={initialEdges} />
      </div>
    </div>
  );
}
