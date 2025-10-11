'use client';

import { useState } from 'react';

type TokenPopupProps = {
  onSave: (token: string) => void;
  onClose: () => void;
};

export default function TokenPopup({ onSave, onClose }: TokenPopupProps) {
  const [token, setToken] = useState('');

  const handleSave = () => {
    if (token) {
      onSave(token);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Threads Access Token 만료</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          세션이 만료되었습니다. 새로운 Threads Access Token을 입력해주세요.
        </p>
        <input
          type="text"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md mb-4"
          placeholder="새로운 토큰을 입력하세요"
        />
        <div className="flex justify-end space-x-2">
          <button onClick={onClose} className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 dark:text-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600">
            취소
          </button>
          <button onClick={handleSave} className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700">
            저장
          </button>
        </div>
      </div>
    </div>
  );
}
