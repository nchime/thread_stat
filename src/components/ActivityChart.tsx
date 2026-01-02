"use client";

import React from "react";
import ReactECharts from "echarts-for-react";

interface ActivityLimit {
    date: string;
    count: number;
    views: number;
    likes: number;
    replies: number;
    reposts: number;
    quotes: number;
}

interface ActivityChartProps {
    data: ActivityLimit[];
    loading?: boolean;
}

export default function ActivityChart({ data, loading }: ActivityChartProps) {
    if (loading) {
        return (
            <div className="h-[400px] w-full flex items-center justify-center bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                <p className="text-gray-500">차트 데이터를 불러오는 중...</p>
            </div>
        );
    }

    if (!data || data.length === 0) {
        return null;
    }

    const sortedData = [...data].sort((a, b) => a.date.localeCompare(b.date));
    const dates = sortedData.map((item) => item.date);

    const option = {
        tooltip: {
            trigger: "axis",
            axisPointer: {
                type: "cross",
            },
        },
        legend: {
            data: ["게시글", "조회수", "좋아요", "답글", "리포스트", "인용"],
            bottom: 0,
        },
        grid: {
            left: "3%",
            right: "4%",
            bottom: "10%",
            containLabel: true,
        },
        xAxis: {
            type: "category",
            boundaryGap: false,
            data: dates,
        },
        yAxis: {
            type: "value",
        },
        series: [
            {
                name: "게시글",
                type: "line",
                smooth: true,
                data: sortedData.map((item) => item.count),
            },
            {
                name: "조회수",
                type: "line",
                smooth: true,
                data: sortedData.map((item) => item.views),
            },
            {
                name: "좋아요",
                type: "line",
                smooth: true,
                data: sortedData.map((item) => item.likes),
            },
            {
                name: "답글",
                type: "line",
                smooth: true,
                data: sortedData.map((item) => item.replies),
            },
            {
                name: "리포스트",
                type: "line",
                smooth: true,
                data: sortedData.map((item) => item.reposts),
            },
            {
                name: "인용",
                type: "line",
                smooth: true,
                data: sortedData.map((item) => item.quotes),
            },
        ],
        color: [
            "#3b82f6", // blue (posts)
            "#ef4444", // red (views)
            "#ec4899", // pink (likes)
            "#10b981", // green (replies)
            "#8b5cf6", // purple (reposts)
            "#f59e0b", // yellow (quotes)
        ],
    };

    return (
        <div className="w-full h-[400px] mt-8 p-4 bg-white dark:bg-gray-800/50 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 flex flex-col">
            <h2 className="text-xl font-semibold mb-4">지표별 추세 차트</h2>
            <div className="flex-1 min-h-0">
                <ReactECharts
                    option={option}
                    style={{ height: "100%", width: "100%" }}
                    theme="my_theme"
                />
            </div>
        </div>
    );
}
