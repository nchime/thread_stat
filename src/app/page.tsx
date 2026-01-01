"use client";

import React, { FormEvent, useState, useEffect, useCallback } from "react";
import CalendarHeatmap from "react-calendar-heatmap";
import { Tooltip } from "react-tooltip";

import Image from "next/image";
import ErrorBoundary from "./components/ErrorBoundary";
import TokenPopup from "./components/TokenPopup";

type ActivityValue = {
  date: string;
  count: number;
};

const ColorLegend = ({ metric }: { metric: "count" | "views" }) => {
  if (metric === "views") {
    return (
      <div className="flex items-center justify-end space-x-2 text-sm text-gray-600 dark:text-gray-400">
        <span>Less</span>
        <div className="w-4 h-4 rounded-sm bg-[#ebedf0] dark:bg-[#161b22] border border-gray-300 dark:border-gray-600"></div>
        <div
          className="w-4 h-4 rounded-sm bg-[#ffcdd2] dark:bg-[#480c0e]"
          title="&lt; 100 views"
        ></div>
        <div
          className="w-4 h-4 rounded-sm bg-[#e57373] dark:bg-[#8c1b1f]"
          title="&lt; 500 views"
        ></div>
        <div
          className="w-4 h-4 rounded-sm bg-[#d32f2f] dark:bg-[#cf222e]"
          title="&lt; 1000 views"
        ></div>
        <div
          className="w-4 h-4 rounded-sm bg-[#b71c1c] dark:bg-[#ff6a69]"
          title="1000+ views"
        ></div>
        <span>More</span>
      </div>
    );
  }
  return (
    <div className="flex items-center justify-end space-x-2 text-sm text-gray-600 dark:text-gray-400">
      <span>Less</span>
      <div className="w-4 h-4 rounded-sm bg-[#ebedf0] dark:bg-[#161b22] border border-gray-300 dark:border-gray-600"></div>
      <div
        className="w-4 h-4 rounded-sm bg-[#9be9a8] dark:bg-[#0e4429]"
        title="1 post"
      ></div>
      <div
        className="w-4 h-4 rounded-sm bg-[#40c463] dark:bg-[#006d32]"
        title="2 posts"
      ></div>
      <div
        className="w-4 h-4 rounded-sm bg-[#30a14e] dark:bg-[#26a641]"
        title="3 posts"
      ></div>
      <div
        className="w-4 h-4 rounded-sm bg-[#216e39] dark:bg-[#39d353]"
        title="4+ posts"
      ></div>
      <span>More</span>
    </div>
  );
};

type InsightData = {
  views: number;
  likes: number;
  replies: number;
  reposts: number;
  followers_count: number;
  total_posts?: number; // 추가
};

type Post = {
  id: string;
  text: string;
  timestamp: string;
  media_url?: string;
  media_type?: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM" | "REEL";
  permalink: string;
  views?: number;
};

type Profile = {
  id: string;
  username: string;
  threads_profile_picture_url: string;
};

const formatNumber = (num: number | undefined | null) => {
  if (num === undefined || num === null) {
    return "0";
  }
  return new Intl.NumberFormat().format(num);
};

const formatTime = (timestamp: string) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

const LoadingSpinner = () => (
  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 dark:border-white mx-auto"></div>
);

export default function Home() {
  const [data, setData] = useState<ActivityValue[]>([]);
  const [insights, setInsights] = useState<InsightData | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [year, setYear] = useState(new Date().getFullYear());
  const [showTokenPopup, setShowTokenPopup] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [tokenExists, setTokenExists] = useState(false);
  const [heatmapMetric, setHeatmapMetric] = useState<"count" | "views">(
    "count"
  );

  const fetchProfileData = async () => {
    try {
      const res = await fetch("/api/profile");
      const data = await res.json();
      if (res.ok) {
        setProfile(data);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error("Failed to fetch profile:", error);
    }
  };

  useEffect(() => {
    const initialize = async () => {
      const storedToken = localStorage.getItem("THREADS_ACCESS_TOKEN");
      if (storedToken) {
        try {
          await fetch("/api/token", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ token: storedToken }),
          });
        } catch (error) {
          console.error("Failed to send stored token to backend:", error);
        }
      }

      try {
        const res = await fetch("/api/token/exists");
        const data = await res.json();
        setTokenExists(data.exists);
        if (data.exists) {
          fetchProfileData();
          setShowHeatmap(true);
        }
      } catch (error) {
        console.error("Failed to check token existence:", error);
      }
    };
    initialize();
  }, []);

  const fetchThreadsData = async (
    fetchYear: number,
    metric: "count" | "views"
  ) => {
    const res = await fetch(`/api/threads?year=${fetchYear}&metric=${metric}`);
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || "데이터를 불러오는데 실패했습니다.");
    }
    return res.json();
  };

  const fetchInsightsData = async (fetchYear: number) => {
    const res = await fetch(`/api/insights?year=${fetchYear}`);
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(
        errorData.error || "인사이트 정보를 불러오는데 실패했습니다."
      );
    }
    return res.json();
  };

  const fetchAllData = useCallback(
    async (fetchYear: number, metric: "count" | "views" = "count") => {
      setLoading(true);
      setError(null);

      try {
        const [threadsResult, insightsResult] = await Promise.allSettled([
          fetchThreadsData(fetchYear, metric),
          fetchInsightsData(fetchYear),
        ]);

        if (threadsResult.status === "fulfilled") {
          console.log("Threads data:", threadsResult.value);
          console.log("Data for CalendarHeatmap:", threadsResult.value);
          console.log(
            "CalendarHeatmap startDate:",
            startDate,
            "endDate:",
            endDate
          );
          setData(threadsResult.value);

          // Calculate total posts from threadsResult.value
          const totalPosts = threadsResult.value.reduce(
            (sum: number, item: ActivityValue) => sum + item.count,
            0
          );
        } else {
          console.error("Failed to fetch threads data:", threadsResult.reason);
          if (threadsResult.reason instanceof Error) {
            const errorMessage = threadsResult.reason.message;
            // setError(errorMessage);
            if (
              errorMessage.includes("Session has expired") ||
              errorMessage.includes("Threads Access Token is not configured")
            ) {
              setShowTokenPopup(true);
            }
          } else {
            // setError("An unknown error occurred");
          }
          setData([]);
        }

        if (insightsResult.status === "fulfilled") {
          const totalPostsFromThreads =
            threadsResult.status === "fulfilled"
              ? threadsResult.value.reduce(
                  (sum: number, item: ActivityValue) => sum + item.count,
                  0
                )
              : insights?.total_posts || 0; // fallback to existing or 0

          const newInsights = insightsResult.value.data.reduce(
            (
              acc: InsightData,
              item: {
                name: string;
                values: { value: number }[];
                total_value?: { value: number };
              }
            ) => {
              if (item.total_value) {
                return {
                  ...acc,
                  [item.name]: item.total_value.value,
                };
              } else if (item.values && item.values.length > 0) {
                const totalValue = item.values.reduce(
                  (sum, v) => sum + v.value,
                  0
                );
                return {
                  ...acc,
                  [item.name]: totalValue,
                };
              }
              return acc;
            },
            {} as InsightData
          );

          setInsights({
            ...newInsights,
            total_posts: totalPostsFromThreads,
          });
        } else {
          console.error("Failed to fetch insight data:", insightsResult.reason);
          if (insightsResult.reason instanceof Error) {
            const errorMessage = insightsResult.reason.message;
            if (errorMessage.includes("Invalid parameter")) {
              setInsights({
                views: 0,
                likes: 0,
                replies: 0,
                reposts: 0,
                followers_count: 0,
              });
            } else {
              // setError(errorMessage);
              if (
                errorMessage.includes("Session has expired") ||
                errorMessage.includes("Threads Access Token is not configured")
              ) {
                setShowTokenPopup(true);
              }
              setInsights(null);
            }
          } else {
            // setError("An unknown error occurred");
            setInsights(null);
          }
        }
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const handleLogout = async () => {
    localStorage.removeItem("THREADS_ACCESS_TOKEN");
    try {
      await fetch("/api/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token: "" }),
      });
    } catch (error) {
      console.error("Failed to clear token on backend:", error);
    }
    setData([]);
    setInsights(null);
    setProfile(null);
    setError(null);
    setShowHeatmap(false);
    setSelectedDate(null);
    setPosts([]);
    setShowTokenPopup(true);
    setTokenExists(false);
  };

  const handleSaveToken = async (token: string) => {
    try {
      const res = await fetch("/api/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      });
      if (!res.ok) {
        throw new Error("Failed to save token");
      }
      localStorage.setItem("THREADS_ACCESS_TOKEN", token);
      setShowTokenPopup(false);
      setTokenExists(true);
      fetchProfileData();
      setShowHeatmap(true);
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("An unknown error occurred");
      }
    }
  };

  const fetchPostsForDate = async (date: string) => {
    setLoadingPosts(true);
    setSelectedDate(date);
    try {
      const res = await fetch(`/api/posts?date=${date}`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "게시글을 불러오는데 실패했습니다.");
      }
      const postsData = await res.json();
      setPosts(postsData.data);
    } catch (error) {
      console.error("Failed to fetch posts:", error);
      // if (error instanceof Error) {
      //   setError(error.message);
      // } else {
      //   setError("An unknown error occurred");
      // }
    } finally {
      setLoadingPosts(false);
    }
  };

  const handleFetch = (e: FormEvent) => {
    e.preventDefault();
    setShowHeatmap(true);
    fetchAllData(year, heatmapMetric);
  };

  useEffect(() => {
    if (showHeatmap) {
      fetchAllData(year, heatmapMetric);
    }
    setSelectedDate(null);
    setPosts([]);
  }, [year, showHeatmap, fetchAllData, heatmapMetric]);

  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year, 11, 31);

  console.log("Calculated startDate:", startDate);
  console.log("Calculated endDate:", endDate);

  return (
    <main className="flex min-h-screen flex-col items-center p-4 sm:p-8 md:p-12 lg:p-24">
      {showTokenPopup && (
        <TokenPopup
          onSave={handleSaveToken}
          onClose={() => setShowTokenPopup(false)}
        />
      )}
      <div className="w-full max-w-5xl">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold">Threads 활동 내역</h1>
          <div className="flex items-center space-x-4">
            {profile && (
              <>
                <Image
                  src={profile.threads_profile_picture_url}
                  alt={profile.username}
                  width={40}
                  height={40}
                  className="rounded-full"
                />
                <span className="font-semibold">{profile.username}</span>
              </>
            )}
            {tokenExists && (
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
              >
                세션 아웃
              </button>
            )}
          </div>
        </div>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Threads 포스팅 기록을 Github 잔디처럼 보여줍니다.
        </p>

        <form
          onSubmit={handleFetch}
          className="mb-8 flex flex-col sm:flex-row gap-4 items-end"
        >
          <div className="flex-1 w-full sm:w-auto">
            <label
              htmlFor="metric"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              조회 기준
            </label>
            <select
              id="metric"
              value={heatmapMetric}
              onChange={(e) =>
                setHeatmapMetric(e.target.value as "count" | "views")
              }
              className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="count">게시글 수</option>
              <option value="views">조회수</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto px-8 py-3 font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "조회 중..." : "활동 조회"}
          </button>

          <button
            type="button"
            disabled={loading || !tokenExists}
            onClick={() => {
              window.location.href = `/api/download-csv?year=${year}`;
            }}
            className="w-full sm:w-auto px-8 py-3 font-semibold text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 dark:text-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            CSV 다운로드
          </button>
        </form>

        {error && (
          <div className="mb-4 p-4 text-red-800 bg-red-100 dark:text-red-200 dark:bg-red-900/50 rounded-lg">
            <p>
              <span className="font-semibold">오류:</span> {error}
            </p>
          </div>
        )}

        {showHeatmap ? (
          <div>
            {(loading || insights) && (
              <div className="mb-8 grid grid-cols-2 md:grid-cols-6 gap-4 text-center">
                <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  {loading ? (
                    <LoadingSpinner />
                  ) : (
                    <p className="text-2xl font-bold">
                      {formatNumber(insights?.total_posts)}
                    </p>
                  )}
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    게시글 수
                  </p>
                </div>
                <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  {loading ? (
                    <LoadingSpinner />
                  ) : (
                    <p className="text-2xl font-bold">
                      {formatNumber(insights?.views)}
                    </p>
                  )}
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    조회 수
                  </p>
                </div>
                <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  {loading ? (
                    <LoadingSpinner />
                  ) : (
                    <p className="text-2xl font-bold">
                      {formatNumber(insights?.likes)}
                    </p>
                  )}
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    좋아요 수
                  </p>
                </div>
                <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  {loading ? (
                    <LoadingSpinner />
                  ) : (
                    <p className="text-2xl font-bold">
                      {formatNumber(insights?.replies)}
                    </p>
                  )}
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    답글
                  </p>
                </div>
                <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  {loading ? (
                    <LoadingSpinner />
                  ) : (
                    <p className="text-2xl font-bold">
                      {formatNumber(insights?.reposts)}
                    </p>
                  )}
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    리포스트 수
                  </p>
                </div>
                <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  {loading ? (
                    <LoadingSpinner />
                  ) : (
                    <p className="text-2xl font-bold">
                      {formatNumber(insights?.followers_count)}
                    </p>
                  )}
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    팔로워 수
                  </p>
                </div>
              </div>
            )}
            <div className="bg-white dark:bg-gray-800/50 p-4 sm:p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">{year}년 활동</h2>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setYear(year - 1)}
                    disabled={year <= 2024}
                    className="px-3 py-1 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 dark:text-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    &larr;
                  </button>
                  <button
                    onClick={() => setYear(year + 1)}
                    disabled={year === new Date().getFullYear()}
                    className="px-3 py-1 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 dark:text-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    &rarr;
                  </button>
                  <button
                    onClick={() => setYear(new Date().getFullYear())}
                    className="px-3 py-1 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 dark:text-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
                  >
                    올해
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="h-48 flex items-center justify-center">
                  <p className="text-gray-500 dark:text-gray-400">
                    데이터를 불러오는 중...
                  </p>
                </div>
              ) : (
                <div className="min-h-[200px] w-full">
                  {data.length > 0 ? (
                    <CalendarHeatmap
                      startDate={startDate}
                      endDate={endDate}
                      values={data}
                      onClick={(value) => {
                        if (value) {
                          fetchPostsForDate(value.date);
                        }
                      }}
                      classForValue={(value) => {
                        if (!value) {
                          return "color-empty";
                        }
                        if (heatmapMetric === "views") {
                          // View counts are much higher, so we need a different scale
                          // Scale roughly: 1-10, 11-50, 51-200, 200+
                          if (value.count === 0) return "color-empty";
                          if (value.count < 1000) return "color-scale-red-1";
                          if (value.count < 3000) return "color-scale-red-2";
                          if (value.count < 5000) return "color-scale-red-3";
                          return "color-scale-red-4";
                        }
                        const count = Math.min(value.count, 4);
                        return `color-scale-${count}`;
                      }}
                      showWeekdayLabels={true}
                    />
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400">
                      표시할 데이터가 없습니다.
                    </p>
                  )}
                  <div className="mt-4">
                    <ColorLegend metric={heatmapMetric} />
                  </div>
                </div>
              )}
            </div>
            {selectedDate && (
              <div className="mt-8">
                <h2 className="text-xl font-semibold mb-4">
                  {selectedDate} 게시글
                </h2>
                {loadingPosts ? (
                  <p>게시글을 불러오는 중...</p>
                ) : (
                  <div className="space-y-4">
                    {posts.length > 0 ? (
                      posts.map((post: Post) => (
                        <div
                          key={post.id}
                          className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <p className="text-sm text-gray-400 dark:text-gray-500">
                              {formatTime(post.timestamp)}
                            </p>
                            {post.views !== undefined && (
                              <span className="text-xs font-medium px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-gray-600 dark:text-gray-400">
                                {formatNumber(post.views)} views
                              </span>
                            )}
                          </div>
                          <div className="text-gray-800 dark:text-gray-200">
                            {post.text &&
                              post.text
                                .split("\n")
                                .map((line, index) => (
                                  <p key={index}>{line}</p>
                                ))}
                          </div>
                          {post.media_url && (
                            <div className="mt-2">
                              {post.media_type === "IMAGE" && (
                                <ErrorBoundary
                                  fallback={
                                    <a
                                      href={post.media_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                    >
                                      View Media
                                    </a>
                                  }
                                >
                                  <Image
                                    src={post.media_url}
                                    alt="Post media"
                                    width={500}
                                    height={500}
                                    className="rounded-lg"
                                  />
                                </ErrorBoundary>
                              )}
                              {post.media_type === "VIDEO" && (
                                <video
                                  src={post.media_url}
                                  controls
                                  className="rounded-lg w-full"
                                />
                              )}
                              {post.media_type === "CAROUSEL_ALBUM" && (
                                <p className="text-sm text-gray-500">
                                  Carousel album not supported
                                </p>
                              )}
                              {post.media_type === "REEL" && (
                                <p className="text-sm text-gray-500">
                                  Reel not supported
                                </p>
                              )}
                            </div>
                          )}
                          <a
                            href={post.permalink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:underline mt-2 inline-block"
                          >
                            View on Threads
                          </a>
                        </div>
                      ))
                    ) : (
                      <p>해당 날짜에 게시글이 없습니다.</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center p-10 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
            <p className="text-gray-500 dark:text-gray-400">
              &apos;올해 활동 조회&apos; 버튼을 눌러주세요.
            </p>
          </div>
        )}

        <footer className="text-center mt-8 text-gray-500 dark:text-gray-400 text-sm">
          <p>Powered by Next.js & Gemini</p>
        </footer>
        <Tooltip id="heatmap-tooltip" />
      </div>
    </main>
  );
}
