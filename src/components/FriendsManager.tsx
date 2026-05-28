import { useState, useEffect } from 'react';
import { UserPlus, Users, Check, X, Search, MoreVertical } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { UserFriend, Profile, SharedLibraryAccess } from '../lib/supabase';
import {
  getUserFriends,
  getPendingFriendRequests,
  searchUsers,
  sendFriendRequest,
  acceptFriendRequest,
  removeFriend,
  shareLibraryWith,
  revokeLibraryAccess,
  getFriendsWithLibraryAccess
} from '../lib/games';

interface FriendsManagerProps {
  onClose: () => void;
}

type TabType = 'friends' | 'requests' | 'add';

export default function FriendsManager({ onClose }: FriendsManagerProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('friends');
  const [friends, setFriends] = useState<(UserFriend & { friend: Profile })[]>([]);
  const [pendingRequests, setPendingRequests] = useState<(UserFriend & { friend: Profile })[]>([]);
  const [sharedAccess, setSharedAccess] = useState<(SharedLibraryAccess & { viewer: Profile })[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadFriendsData();
  }, [user]);

  useEffect(() => {
    if (searchQuery.length >= 2) {
      searchForUsers();
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const loadFriendsData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const [friendsData, requestsData, accessData] = await Promise.all([
        getUserFriends(user.id),
        getPendingFriendRequests(user.id),
        getFriendsWithLibraryAccess(user.id)
      ]);

      setFriends(friendsData);
      setPendingRequests(requestsData);
      setSharedAccess(accessData);
    } catch (error) {
      console.error('Error loading friends data:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchForUsers = async () => {
    if (!user || searchQuery.length < 2) return;

    try {
      setSearchLoading(true);
      const results = await searchUsers(searchQuery, user.id);

      // Filter out existing friends
      const friendIds = friends.map(f => f.friend_id);
      const filteredResults = results.filter(u => !friendIds.includes(u.id));

      setSearchResults(filteredResults);
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSendFriendRequest = async (friendId: string) => {
    if (!user || actionLoading) return;

    try {
      setActionLoading(friendId);
      await sendFriendRequest(user.id, friendId);

      // Remove from search results
      setSearchResults(prev => prev.filter(u => u.id !== friendId));
    } catch (error) {
      console.error('Error sending friend request:', error);
      alert('Failed to send friend request');
    } finally {
      setActionLoading(null);
    }
  };

  const handleAcceptFriendRequest = async (requestId: string) => {
    if (!user || actionLoading) return;

    try {
      setActionLoading(requestId);
      await acceptFriendRequest(requestId);
      await loadFriendsData();
    } catch (error) {
      console.error('Error accepting friend request:', error);
      alert('Failed to accept friend request');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemoveFriend = async (friendId: string, friendName: string) => {
    if (!user || actionLoading) return;

    if (!confirm(`Remove ${friendName} as a friend? This will also revoke library access.`)) {
      return;
    }

    try {
      setActionLoading(friendId);
      await removeFriend(user.id, friendId);
      await loadFriendsData();
    } catch (error) {
      console.error('Error removing friend:', error);
      alert('Failed to remove friend');
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleLibraryAccess = async (friendId: string, hasAccess: boolean) => {
    if (!user || actionLoading) return;

    try {
      setActionLoading(friendId);

      if (hasAccess) {
        await revokeLibraryAccess(user.id, friendId);
      } else {
        await shareLibraryWith(user.id, friendId);
      }

      await loadFriendsData();
    } catch (error) {
      console.error('Error toggling library access:', error);
      alert('Failed to update library access');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center space-x-3">
            <Users className="w-6 h-6 text-slate-600" strokeWidth={1.5} />
            <h2 className="text-xl font-display font-light text-slate-900">Friends & Libraries</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 transition"
          >
            <X className="w-5 h-5" strokeWidth={1.5} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setActiveTab('friends')}
            className={`flex-1 px-6 py-3 text-sm font-medium transition ${
              activeTab === 'friends'
                ? 'text-purple-700 border-b-2 border-purple-500 bg-purple-50'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Friends ({friends.length})
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`flex-1 px-6 py-3 text-sm font-medium transition relative ${
              activeTab === 'requests'
                ? 'text-purple-700 border-b-2 border-purple-500 bg-purple-50'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Requests
            {pendingRequests.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {pendingRequests.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('add')}
            className={`flex-1 px-6 py-3 text-sm font-medium transition ${
              activeTab === 'add'
                ? 'text-purple-700 border-b-2 border-purple-500 bg-purple-50'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Add Friends
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'friends' && (
            <div>
              {friends.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" strokeWidth={1.5} />
                  <p className="text-slate-600 font-body">No friends yet</p>
                  <p className="text-sm text-slate-500 mt-2">
                    Add friends to share libraries and plan game nights
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {friends.map((friendship) => {
                    const friend = friendship.friend;
                    const hasLibraryAccess = sharedAccess.some(access => access.viewer_id === friend.id);

                    return (
                      <div key={friendship.id} className="p-4 hover:bg-slate-50 transition">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            {friend.avatar_url ? (
                              <img
                                src={friend.avatar_url}
                                alt={friend.username}
                                className="w-12 h-12 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
                                <span className="text-white font-medium">
                                  {friend.username.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                            <div>
                              <h3 className="font-medium text-slate-900">{friend.username}</h3>
                              <p className="text-sm text-slate-600">{friend.total_games} games</p>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleToggleLibraryAccess(friend.id, hasLibraryAccess)}
                              disabled={actionLoading === friend.id}
                              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${
                                hasLibraryAccess
                                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                              }`}
                            >
                              {hasLibraryAccess ? 'Shared' : 'Share Library'}
                            </button>

                            <div className="relative group">
                              <button className="p-2 bg-parchment-100 text-ink-300 hover:bg-parchment-200 hover:text-ink-500 transition">
                                <MoreVertical className="w-3.5 h-3.5" strokeWidth={1.5} />
                              </button>
                              <div className="absolute right-0 top-full mt-1 bg-cream border border-parchment-300 shadow-lg py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-[101] min-w-[140px]">
                                <button
                                  onClick={() => handleRemoveFriend(friend.id, friend.username)}
                                  disabled={actionLoading === friend.id}
                                  className="w-full px-4 py-2 text-left text-xs font-body text-clay-500 hover:bg-clay-50 flex items-center gap-2 transition"
                                >
                                  Remove Friend
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'requests' && (
            <div>
              {pendingRequests.length === 0 ? (
                <div className="text-center py-12">
                  <UserPlus className="w-12 h-12 text-slate-300 mx-auto mb-4" strokeWidth={1.5} />
                  <p className="text-slate-600 font-body">No pending requests</p>
                  <p className="text-sm text-slate-500 mt-2">
                    Friend requests will appear here
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {pendingRequests.map((request) => {
                    const friend = request.friend;

                    return (
                      <div key={request.id} className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            {friend.avatar_url ? (
                              <img
                                src={friend.avatar_url}
                                alt={friend.username}
                                className="w-12 h-12 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
                                <span className="text-white font-medium">
                                  {friend.username.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                            <div>
                              <h3 className="font-medium text-slate-900">{friend.username}</h3>
                              <p className="text-sm text-slate-600">Wants to be friends</p>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleAcceptFriendRequest(request.id)}
                              disabled={actionLoading === request.id}
                              className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                            >
                              <Check className="w-4 h-4" strokeWidth={1.5} />
                            </button>
                            <button
                              onClick={() => {}} // TODO: Implement decline
                              disabled={actionLoading === request.id}
                              className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                            >
                              <X className="w-4 h-4" strokeWidth={1.5} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'add' && (
            <div className="p-4">
              <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" strokeWidth={1.5} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by username or email..."
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                />
              </div>

              {searchLoading && (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                </div>
              )}

              {searchQuery.length < 2 && !searchLoading && (
                <div className="text-center py-12">
                  <Search className="w-12 h-12 text-slate-300 mx-auto mb-4" strokeWidth={1.5} />
                  <p className="text-slate-600 font-body">Search for friends</p>
                  <p className="text-sm text-slate-500 mt-2">
                    Type at least 2 characters to search
                  </p>
                </div>
              )}

              {searchQuery.length >= 2 && !searchLoading && searchResults.length === 0 && (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" strokeWidth={1.5} />
                  <p className="text-slate-600 font-body">No users found</p>
                  <p className="text-sm text-slate-500 mt-2">
                    Try a different search term
                  </p>
                </div>
              )}

              {searchResults.length > 0 && (
                <div className="divide-y divide-slate-100">
                  {searchResults.map((user) => (
                    <div key={user.id} className="py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {user.avatar_url ? (
                            <img
                              src={user.avatar_url}
                              alt={user.username}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
                              <span className="text-white font-medium">
                                {user.username.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                          <div>
                            <h3 className="font-medium text-slate-900">{user.username}</h3>
                            <p className="text-sm text-slate-600">{user.total_games} games</p>
                          </div>
                        </div>

                        <button
                          onClick={() => handleSendFriendRequest(user.id)}
                          disabled={actionLoading === user.id}
                          className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50"
                        >
                          <UserPlus className="w-4 h-4" strokeWidth={1.5} />
                          <span>Add Friend</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}