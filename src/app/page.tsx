'use client';

import { FormEvent, useState } from 'react';
import CalendarHeatmap from 'react-calendar-heatmap';
import { Tooltip } from 'react-tooltip';

type ActivityValue = {
  date: string;
  count: number;
};

const ColorLegend = () => (
  <div className="flex items-center justify-end space-x-2 text-sm text-gray-600 dark:text-gray-400">
    <span>Less</span>
    <div className="w-4 h-4 rounded-sm bg-[#ebedf0] dark:bg-[#161b22] border border-gray-300 dark:border-gray-600"></div>
    <div className="w-4 h-4 rounded-sm bg-[#9be9a8] dark:bg-[#0e4429]"></div>
    <div className="w-4 h-4 rounded-sm bg-[#40c463] dark:bg-[#006d32]"></div>
    <div className="w-4 h-4 rounded-sm bg-[#30a14e] dark:bg-[#26a641]"></div>
    <div className="w-4 h-4 rounded-sm bg-[#216e39] dark:bg-[#39d353]"></div>
    <span>More</span>
  </div>
);

export default function Home() {
  const [data, setData] = useState<ActivityValue[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHeatmap, setShowHeatmap] = useState(false);

  const currentYear = new Date().getFullYear();

  const handleFetch = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setShowHeatmap(true);

    try {
      const res = await fetch(`/api/threads`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || '데이터를 불러오는데 실패했습니다.');
      }
      const activityData = await res.json();
      setData(activityData);
    } catch (err: any) {
      setError(err.message);
      setData([]); // Clear data on error
    } finally {
      setLoading(false);
    }
  };

  const startDate = new Date(currentYear, 0, 1);
  const endDate = new Date(currentYear, 11, 31);

  return (
    <main className="flex min-h-screen flex-col items-center p-4 sm:p-8 md:p-12 lg:p-24">
      <div className="w-full max-w-5xl">
        <h1 className="text-3xl sm:text-4xl font-bold mb-2">
          Threads 활동 내역
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Threads 포스팅 기록을 Github 잔디처럼 보여줍니다.
        </p>

        <form onSubmit={handleFetch} className="mb-8">
          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto px-8 py-3 font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? '조회 중...' : '올해 활동 조회'}
          </button>
        </form>

        {error && (
          <div className="mb-4 p-4 text-red-800 bg-red-100 dark:text-red-200 dark:bg-red-900/50 rounded-lg">
            <p><span className="font-semibold">오류:</span> {error}</p>
          </div>
        )}

        {showHeatmap ? (
          <div className="bg-white dark:bg-gray-800/50 p-4 sm:p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">{currentYear}년 활동</h2>
            </div>

            {loading ? (
              <div className="h-48 flex items-center justify-center">
                <p className="text-gray-500 dark:text-gray-400">데이터를 불러오는 중...</p>
              </div>
            ) : (
              <div>
                <CalendarHeatmap
                  startDate={startDate}
                  endDate={endDate}
                  values={data}
                  classForValue={(value) => {
                    if (!value) {
                      return 'color-empty';
                    }
                    const count = Math.min(value.count, 4);
                    return `color-scale-${count}`;
                  }}
                  tooltipDataAttrs={(value: ActivityValue) => {
                    if (!value || !value.date) {
                      return { 'data-tooltip-id': 'heatmap-tooltip', 'data-tooltip-content': 'No activity' };
                    }
                    const postText = value.count === 1 ? 'post' : 'posts';
                    return {
                      'data-tooltip-id': 'heatmap-tooltip',
                      'data-tooltip-content': `${value.date}: ${value.count} ${postText}`,
                    };
                  }}
                  showWeekdayLabels={true}
                />
                <div className="mt-4">
                  <ColorLegend />
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center p-10 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
            <p className="text-gray-500 dark:text-gray-400">'올해 활동 조회' 버튼을 눌러주세요.</p>
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