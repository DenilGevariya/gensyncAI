"use client";
import { 
  FileText, 
  CheckCircle, 
  XCircle, 
  Target,
  Lightbulb,
  Star,
  Calendar
} from "lucide-react";
import React from "react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

const AnalysisView = ({ analysis }) => {
  // Show message if no analysis exists
  if (!analysis) {
    return (
      <div className="text-center py-12">
        <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Resume Analysis Yet</h3>
        <p className="text-gray-500">Upload your first resume to get AI-powered insights.</p>
      </div>
    );
  }

  const getATSScoreColor = (score) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-yellow-500";
    return "text-red-500";
  };

  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-bold gradianet-title">Resume Analysis</h1>
        <Badge variant="outline ">
          Latest Analysis
        </Badge>
      </div>

      {/* Header Card */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl gradianet-title">{analysis.jobTitle}</CardTitle>
              <CardDescription className="text-lg flex items-center gap-2">
                {analysis.companyName} 
                <Calendar className="h-4 w-4" />
                {format(new Date(analysis.createdAt), "MMM dd, yyyy 'at' h:mm a")}
              </CardDescription>
            </div>
            <div className="text-right">
              <div className={`text-3xl font-bold mb-2 ${getATSScoreColor(analysis.atsScore)}`}>
                {analysis.atsScore}%
              </div>
              <Badge variant="outline">ATS Score</Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ATS Score</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getATSScoreColor(analysis.atsScore)}`}>
              {analysis.atsScore}%
            </div>
            <Progress value={analysis.atsScore} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Keywords Matched</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analysis.analysis.keywordMatches?.matched?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              of {((analysis.analysis.keywordMatches?.matched?.length || 0) + 
                   (analysis.analysis.keywordMatches?.missing?.length || 0))} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Strengths</CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analysis.analysis.strengths?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Identified strengths
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Analysis Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700 leading-relaxed">{analysis.analysis.summary}</p>
        </CardContent>
      </Card>

      {/* Strengths and Weaknesses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span>Strengths</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analysis.analysis.strengths?.length > 0 ? (
              <ul className="space-y-3">
                {analysis.analysis.strengths.map((strength, idx) => (
                  <li key={idx} className="flex items-start space-x-2">
                    <div className="h-2 w-2 mt-2 rounded-full bg-green-500 flex-shrink-0" />
                    <span className="text-sm">{strength}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 text-sm">No specific strengths identified</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <XCircle className="h-5 w-5 text-red-500" />
              <span>Areas for Improvement</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analysis.analysis.weaknesses?.length > 0 ? (
              <ul className="space-y-3">
                {analysis.analysis.weaknesses.map((weakness, idx) => (
                  <li key={idx} className="flex items-start space-x-2">
                    <div className="h-2 w-2 mt-2 rounded-full bg-red-500 flex-shrink-0" />
                    <span className="text-sm">{weakness}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 text-sm">No specific weaknesses identified</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Keywords Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Matched Keywords</CardTitle>
            <CardDescription>Keywords found in your resume</CardDescription>
          </CardHeader>
          <CardContent>
            {analysis.analysis.keywordMatches?.matched?.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {analysis.analysis.keywordMatches.matched.map((keyword, idx) => (
                  <Badge key={idx} className="bg-green-100 text-green-800">
                    {keyword}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No matched keywords found</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Missing Keywords</CardTitle>
            <CardDescription>Important keywords to consider adding</CardDescription>
          </CardHeader>
          <CardContent>
            {analysis.analysis.keywordMatches?.missing?.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {analysis.analysis.keywordMatches.missing.map((keyword, idx) => (
                  <Badge key={idx} variant="outline" className="border-red-200 text-red-600">
                    {keyword}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No missing keywords identified</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Suggestions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            <span>Recommendations</span>
          </CardTitle>
          <CardDescription>
            AI-powered suggestions to improve your resume
          </CardDescription>
        </CardHeader>
        <CardContent>
          {analysis.analysis.suggestions?.length > 0 ? (
            <ul className="space-y-4">
              {analysis.analysis.suggestions.map((suggestion, idx) => (
                <li key={idx} className="flex items-start space-x-2">
                  <div className="h-2 w-2 mt-2 rounded-full bg-blue-500 flex-shrink-0" />
                  <span className="text-sm">{suggestion}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 text-sm">No specific suggestions available</p>
          )}
        </CardContent>
      </Card>

      {/* Skills Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Present Skills</CardTitle>
            <CardDescription>Skills found in your resume</CardDescription>
          </CardHeader>
          <CardContent>
            {analysis.analysis.skillsAnalysis?.present?.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {analysis.analysis.skillsAnalysis.present.map((skill, idx) => (
                  <Badge key={idx} variant="secondary">
                    {skill}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No skills identified from resume</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recommended Skills</CardTitle>
            <CardDescription>Skills to consider adding</CardDescription>
          </CardHeader>
          <CardContent>
            {analysis.analysis.skillsAnalysis?.recommended?.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {analysis.analysis.skillsAnalysis.recommended.map((skill, idx) => (
                  <Badge key={idx} variant="outline">
                    {skill}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No skill recommendations available</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AnalysisView;
