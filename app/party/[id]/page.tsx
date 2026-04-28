'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface PartyMember {
  id: string;
  userId: string;
  isReady: boolean;
  joinedAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    level: number;
    rp: number;
  };
}

interface Party {
  id: string;
  leaderId: string;
  status: string;
  maxSize: number;
  createdAt: string;
  members: PartyMember[];
}

export default function PartyPage() {
  const params = useParams();
  const router = useRouter();
  const [party, setParty] = useState<Party | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCurrentUserLeader, setIsCurrentUserLeader] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const fetchParty = async () => {
    try {
      const res = await fetch(`/api/party/${params.id}`);
      if (res.status === 401) {
        router.push('/signin');
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setParty(data);
      }
    } catch (error) {
      console.error('Fetch party error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch('/api/auth/session')
      .then(res => res.json())
      .then(session => {
        if (session?.user?.id) {
          setCurrentUserId(session.user.id);
        }
      });

    fetchParty();
    const interval = setInterval(fetchParty, 2000);
    return () => clearInterval(interval);
  }, [params.id]);

  useEffect(() => {
    if (party && currentUserId) {
      setIsCurrentUserLeader(party.leaderId === currentUserId);
    }
  }, [party, currentUserId]);

  const toggleReady = async () => {
    await fetch('/api/party/ready', { method: 'POST' });
    fetchParty();
  };

  const leaveParty = async () => {
    await fetch('/api/party/leave', { method: 'POST' });
    router.push('/');
  };

  const transferLeadership = async (userId: string) => {
    await fetch('/api/party/transfer-leadership', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newLeaderUserId: userId })
    });
    fetchParty();
  };

  const startGame = async () => {
    const res = await fetch('/api/party/start', { method: 'POST' });
    if (res.ok) {
      const data = await res.json();
      router.push(data.redirectUrl);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Загрузка...</div>;
  }

  if (!party) {
    return <div className="flex items-center justify-center min-h-screen">Группа не найдена</div>;
  }

  const allReady = party.members.every(m => m.isReady);
  const isSolo = party.members.length === 1;
  const canStartFull = party.members.length === 5 && allReady;
  const canStartSolo = isSolo && isCurrentUserLeader;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Группа игроков</h1>
        <button
          onClick={leaveParty}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md"
        >
          Выйти из группы
        </button>
      </div>

      <div className="bg-gray-800 rounded-lg p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Участники ({party.members.length}/5)</h2>
          {isCurrentUserLeader && party.members.length < 5 && (
            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md">
              Пригласить друзей
            </button>
          )}
        </div>

        <div className="space-y-3">
          {party.members.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between p-4 bg-gray-700 rounded-lg"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center">
                  {member.user.name?.charAt(0).toUpperCase() || '?'}
                </div>
                <div>
                  <div className="font-semibold flex items-center gap-2">
                    {member.user.name || member.user.email}
                    {member.userId === party.leaderId && (
                      <span className="text-yellow-400 text-sm">👑 Лидер</span>
                    )}
                  </div>
                  <div className="text-sm text-gray-400">
                    Уровень {member.user.level} • {member.user.rp} RP
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className={`px-3 py-1 rounded-full text-sm ${member.isReady ? 'bg-green-600 text-white' : 'bg-gray-600 text-gray-300'}`}>
                  {member.isReady ? '✓ Готов' : 'Ожидает'}
                </div>

                {isCurrentUserLeader && member.userId !== currentUserId && (
                  <button
                    onClick={() => transferLeadership(member.userId)}
                    className="px-3 py-1 bg-gray-600 hover:bg-gray-500 rounded-md text-sm"
                  >
                    Сделать лидером
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-4 justify-center">
        {currentUserId && (
          <button
            onClick={toggleReady}
            className={`px-6 py-3 rounded-lg font-medium ${
              party.members.find(m => m.userId === currentUserId)?.isReady
                ? 'bg-orange-600 hover:bg-orange-700'
                : 'bg-green-600 hover:bg-green-700'
            } text-white`}
          >
            {party.members.find(m => m.userId === currentUserId)?.isReady
              ? 'Отменить готовность'
              : 'Я готов'}
          </button>
        )}

        {isCurrentUserLeader && canStartSolo && (
          <button
            onClick={startGame}
            className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium"
          >
            Начать игру соло
          </button>
        )}

        {isCurrentUserLeader && (
          <button
            onClick={startGame}
            disabled={!canStartFull && !isSolo}
            className={`px-6 py-3 rounded-lg font-medium ${
              canStartFull
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
            }`}
          >
            Начать игру
          </button>
        )}
      </div>

      {party.members.length < 5 && isCurrentUserLeader && !canStartFull && !isSolo && (
        <p className="text-center text-gray-400 mt-4">
          Для запуска игры на 5 человек все участники должны отметиться как готовые
        </p>
      )}
    </div>
  );
}