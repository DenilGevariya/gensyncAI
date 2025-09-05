import { getUserResumeAnalyses } from "@/actions/analyzeresume";
import React from "react";
import AnalysisView from "./_components/analysis-view";

const ResumeAnalysisDashboard = async () => {
  const analysis = await getUserResumeAnalyses(); // Single analysis, not array

  return (
    <div className="container mx-auto px-4 py-8">
      <AnalysisView analysis={analysis} />
    </div>
  );
};

export default ResumeAnalysisDashboard;
