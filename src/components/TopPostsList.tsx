"use client";

import React from "react";
import Image from "next/image";

interface TopPost {
    id: string;
    text?: string;
    media_url?: string;
    media_type?: string;
    permalink: string;
    views: number;
    timestamp: string;
}

interface TopPostsListProps {
    posts: TopPost[];
    loading?: boolean;
}

const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
};

export default function TopPostsList({ posts, loading }: TopPostsListProps) {
    if (loading) {
        return (
            <div className="w-full mt-8 p-6 bg-white dark:bg-gray-800/50 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold mb-4">올해의 인기 게시글 TOP 10</h2>
                <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="animate-pulse flex items-center space-x-4">
                            <div className="h-12 w-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
                            <div className="flex-1 space-y-2">
                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (!posts || posts.length === 0) {
        return null;
    }

    return (
        <div className="w-full mt-8 p-6 bg-white dark:bg-gray-800/50 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold mb-6">올해의 인기 게시글 TOP 10</h2>
            <div className="space-y-4">
                {posts.map((post, index) => (
                    <div
                        key={post.id}
                        className="flex items-start p-4 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors border border-transparent hover:border-gray-200 dark:hover:border-gray-700"
                    >
                        <div className="flex-shrink-0 w-8 text-center font-bold text-lg text-gray-400 mr-4">
                            {index + 1}
                        </div>

                        <div className="flex-shrink-0 w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden relative mr-4">
                            {post.media_url && post.media_type !== "VIDEO" ? (
                                <Image
                                    src={post.media_url}
                                    alt="Media"
                                    fill
                                    className="object-cover"
                                />
                            ) : post.media_type === "VIDEO" ? (
                                <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">Video</div>
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">No Media</div>
                            )}
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                                <p className="text-gray-900 dark:text-gray-100 text-sm line-clamp-2 mb-1">
                                    {post.text || "내용 없음"}
                                </p>
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 whitespace-nowrap ml-2">
                                    {formatNumber(post.views)} views
                                </span>
                            </div>
                            <div className="flex justify-between items-center mt-1">
                                <span className="text-xs text-gray-500">
                                    {new Date(post.timestamp).toLocaleDateString()}
                                </span>
                                <a
                                    href={post.permalink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400"
                                >
                                    View on Threads &rarr;
                                </a>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
