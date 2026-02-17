"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useEffect, useState } from "react";
import { format } from "date-fns";

export default function PerformanceChart({ assessments }) {
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    if (assessments && assessments.length > 0) {
      const formattedData = assessments.map((assessment) => ({
        date: format(new Date(assessment.createdAt), "MMM dd"),
        score: Math.round(assessment.quizScore), // Round to whole number
        fullDate: format(new Date(assessment.createdAt), "MMM dd, yyyy"),
      }));
      setChartData(formattedData);
    }
  }, [assessments]);

  // Show a message if no data
  if (!assessments || assessments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="gradient-title text-3xl md:text-4xl">
            Performance Trend
          </CardTitle>
          <CardDescription>Your quiz scores over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            <p>No assessment data available yet. Take a quiz to see your performance trend!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="gradient-title text-3xl md:text-4xl">
          Performance Trend
        </CardTitle>
        <CardDescription>Your quiz scores over time</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart 
              data={chartData}
              margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
            >
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="#e5e7eb"
                opacity={0.5}
              />
              <XAxis 
                dataKey="date"
                stroke="#6b7280"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                domain={[0, 100]}
                stroke="#6b7280"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                ticks={[0, 25, 50, 75, 100]}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                }}
                content={({ active, payload }) => {
                  if (active && payload?.length) {
                    return (
                      <div className="bg-background border rounded-lg p-3 shadow-lg">
                        <p className="text-sm font-semibold text-foreground">
                          Score: {payload[0].value}%
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {payload[0].payload.fullDate}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Line
                type="monotone"
                dataKey="score"
                stroke="hsl(var(--primary))"
                strokeWidth={3}
                dot={{ 
                  fill: 'hsl(var(--primary))',
                  strokeWidth: 2,
                  r: 4,
                  stroke: 'hsl(var(--background))'
                }}
                activeDot={{ 
                  r: 6,
                  stroke: 'hsl(var(--primary))',
                  strokeWidth: 2,
                  fill: 'hsl(var(--background))'
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}