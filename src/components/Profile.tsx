import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Trophy, Zap, Target, Crown, Star, Gem, Camera, CheckCircle2, XCircle, UserPlus, UserMinus, Users, Edit2, Check, X, Github, ExternalLink } from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { AchievementPanel } from './AchievementPanel';

interface Profile {
  id: string;
  username: string;
  avatar_url?: string;
  username_changes: number;
  last_username_change?: string;
  github_id?: string;
  github_username?: string;
  github_avatar_url?: string;
  github_connected_at?: string;
  xp?: number;
}

interface UserStats {
  avg_wpm: number;
  avg_accuracy: number;
  total_attempts: number;
}

const levels = [
  { name: 'novice', icon: Zap, threshold: 0, color: 'text-gray-500' },
  { name: 'intermediate', icon: Target, threshold: 100, color: 'text-blue-500' },
  { name: 'advanced', icon: Trophy, threshold: 500, color: 'text-purple-500' },
  { name: 'expert', icon: Crown, threshold: 2500, color: 'text-orange-500' },
  { name: 'master', icon: Star, threshold: 5000, color: 'text-yellow-500' },
  { name: 'legend', icon: Gem, threshold: 12500, color: 'text-pink-500' }
];

const getLevelFromXP = (xp: number) => {
  let currentLevel = levels[0];
  for (let i = levels.length - 1; i >= 0; i--) {
    if (xp >= levels[i].threshold) {
      currentLevel = levels[i];
      break;
    }
  }
  return currentLevel;
};

const calculateXp = (totalAttempts: number, avgWpm: number, avgAccuracy: number): number => {
  if (!totalAttempts) return 0;
  const baseXpPerAttempt = 5;
  const performanceMultiplier = avgWpm && avgAccuracy 
    ? (avgWpm * (avgAccuracy / 100)) / 50
    : 1;
  return Math.round(totalAttempts * baseXpPerAttempt * Math.max(0.5, Math.min(3, performanceMultiplier)));
};

export const Profile: React.FC = () => {
  const { username: profileUsername } = useParams<{ username: string }>();
  const isOwnProfile = !profileUsername;
  
  // Own profile state
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  
  // Other user profile state
  const [otherUserProfile, setOtherUserProfile] = useState<Profile | null>(null);
  const [otherUserStats, setOtherUserStats] = useState<UserStats | null>(null);
  
  // UI state
  const [loading, setLoading] = useState(true);
  const [newUsername, setNewUsername] = useState('');
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  
  // GitHub connection state
  const [isConnectingGithub, setIsConnectingGithub] = useState(false);
  
  // Friend system state
  const [friendshipStatus, setFriendshipStatus] = useState<'none' | 'pending_sent' | 'pending_received' | 'friends' | 'blocked'>('none');
  const [friendsList, setFriendsList] = useState<Profile[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<Profile[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<Profile[]>([]);
  
  // Delete account modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  const toast = useToast();

  const canSaveUsername = usernameStatus === 'available' && newUsername !== profile?.username && newUsername.length >= 3;

  const checkUsernameAvailability = async (username: string) => {
    if (!username || username === profile?.username || username.length < 3) {
      setUsernameStatus('idle');
      return;
    }

    setUsernameStatus('checking');
    
    try {
      const { data } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username.toLowerCase())
        .maybeSingle();
      
      setUsernameStatus(data ? 'taken' : 'available');
    } catch (error) {
      setUsernameStatus('idle');
    }
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewUsername(value);
    
    // Debounce username checking
    setTimeout(() => checkUsernameAvailability(value), 500);
  };

  const handleUpdateUsername = async () => {
    if (!canSaveUsername) return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      // Check if user can change username (2 per month limit)
      const { data: canChangeData } = await supabase
        .rpc('can_change_username', { user_id: user.id });
      
      if (!canChangeData) {
        toast({ variant: 'error', title: 'username change limit reached (2 per month)' });
        return;
      }
      
      const { data: result } = await supabase
        .rpc('update_username_with_limits', {
          user_id: user.id,
          new_username: newUsername
        });
      
      if (result?.success) {
        setProfile(prev => prev ? { ...prev, username: newUsername } : null);
        toast({ variant: 'success', title: 'username updated successfully' });
        
        // Exit edit mode after successful update
        setIsEditingUsername(false);
        setUsernameStatus('idle');
      } else {
        toast({ variant: 'error', title: result?.message || 'failed to update username' });
      }
    } catch (error) {
      toast({ variant: 'error', title: 'failed to update username' });
    }
  };

  const handleConnectGithub = async () => {
    try {
      setIsConnectingGithub(true);
      
      console.log('🔗 Getting current user session...');
      
      // Try multiple ways to get the current user
      const { data: { session, user }, error: sessionError } = await supabase.auth.getSession();
      const { data: { user: directUser }, error: userError } = await supabase.auth.getUser();
      
      console.log('👤 Session check result:', { 
        session: !!session, 
        sessionUser: !!user,
        directUser: !!directUser, 
        sessionError, 
        userError,
        profileExists: !!profile 
      });
      
      // Use direct user if session user is not available
      const currentUser = user || directUser;
      
      if (sessionError && userError) {
        console.error('❌ Both session and user checks failed:', { sessionError, userError });
        toast({ variant: 'error', title: 'authentication error - please sign in again' });
        return;
      }
      
      if (!currentUser) {
        console.error('❌ No user found in session or direct check');
        toast({ variant: 'error', title: 'please sign in first' });
        return;
      }
      
      // Try to get a fresh session token
      let accessToken = session?.access_token;
      if (!accessToken && directUser) {
        // If we have a user but no session, try to refresh
        const { data: refreshedSession } = await supabase.auth.refreshSession();
        accessToken = refreshedSession.session?.access_token;
        console.log('🔄 Refreshed session:', !!refreshedSession.session);
      }
      
      if (!accessToken) {
        console.error('❌ No access token available');
        toast({ variant: 'error', title: 'session expired - please refresh the page' });
        return;
      }
      
      console.log('✅ Valid session found, starting GitHub OAuth flow...');
      
      // Call our server-side endpoint to initiate OAuth
      const response = await fetch('/api/auth/github?action=start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          current_user_id: currentUser.id,
          access_token: accessToken
        })
      });
      
      console.log('🔍 API response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API error response:', errorText);
        try {
          const errorJson = JSON.parse(errorText);
          throw new Error(errorJson.error || 'failed to start oauth');
        } catch {
          throw new Error(`API error: ${response.status} ${response.statusText}`);
        }
      }
      
      const result = await response.json();
      console.log('✅ OAuth URL received:', result.oauth_url);
      
      // Redirect to GitHub OAuth - this will preserve your session
      window.location.href = result.oauth_url;
      
    } catch (error) {
      console.error('❌ GitHub connect error:', error);
      toast({ variant: 'error', title: 'failed to start github connection: ' + error.message });
      setIsConnectingGithub(false);
    }
  };

  const handleDisconnectGithub = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      // Find the GitHub identity to unlink
      const githubIdentity = user.identities?.find(identity => identity.provider === 'github');
      
      if (githubIdentity) {
        // Unlink the GitHub identity
        const { error: unlinkError } = await supabase.auth.unlinkIdentity(githubIdentity);
        
        if (unlinkError) {
          console.error('Error unlinking GitHub identity:', unlinkError);
          toast({ variant: 'error', title: 'failed to unlink github account: ' + unlinkError.message });
          return;
        }
      }
      
      // Update profile to remove GitHub data
      const { error } = await supabase
        .from('profiles')
        .update({ 
          github_id: null, 
          github_username: null, 
          github_avatar_url: null,
          github_connected_at: null 
        })
        .eq('id', user.id);
      
      if (!error) {
        setProfile(prev => prev ? { 
          ...prev, 
          github_id: undefined,
          github_username: undefined, 
          github_avatar_url: undefined,
          github_connected_at: undefined 
        } : null);
        toast({ variant: 'success', title: 'github account disconnected' });
      } else {
        toast({ variant: 'error', title: 'failed to update profile after disconnect' });
      }
    } catch (error) {
      console.error('Error disconnecting GitHub:', error);
      toast({ variant: 'error', title: 'failed to disconnect github account' });
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
      toast({ variant: 'error', title: 'file too large (max 5MB)' });
      return;
    }
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target?.result as string;
      
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        
        const { error } = await supabase
          .from('profiles')
          .update({ avatar_url: base64 })
          .eq('id', user.id);
        
        if (!error) {
          setProfile(prev => prev ? { ...prev, avatar_url: base64 } : null);
          toast({ variant: 'success', title: 'avatar updated successfully' });
        }
      } catch (error) {
        toast({ variant: 'error', title: 'failed to update avatar' });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/daily';
  };

  const handleDeleteAccount = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Delete user data in correct order (child tables first)
      await supabase.from('user_stats').delete().eq('user_id', user.id);
      await supabase.from('friendships').delete().or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);
      await supabase.from('attempts').delete().eq('user_id', user.id);
      await supabase.from('profiles').delete().eq('id', user.id);

      // Call API to delete auth user (if available)
      try {
        await fetch('/api/delete-user', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: user.id })
        });
      } catch (e) {
        // API deletion failed, but profile data is gone
      }

      toast({ variant: 'success', title: 'account deleted successfully' });
      await supabase.auth.signOut();
      window.location.href = '/daily';
    } catch (error) {
      toast({ variant: 'error', title: 'failed to delete account' });
    } finally {
      setShowDeleteModal(false);
    }
  };

  // Friend system functions
  const checkFriendshipStatus = async (userId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || isOwnProfile) return;

      // Check if friendship exists
      const { data: friendship } = await supabase
        .from('friendships')
        .select('status, user1_id, user2_id')
        .or(`and(user1_id.eq.${user.id},user2_id.eq.${userId}),and(user1_id.eq.${userId},user2_id.eq.${user.id})`)
        .maybeSingle();

      if (friendship) {
        if (friendship.status === 'friends') {
          setFriendshipStatus('friends');
        } else if (friendship.status === 'pending') {
          // Check if current user sent the request or received it
          if (friendship.user1_id === user.id) {
            setFriendshipStatus('pending_sent');
          } else {
            setFriendshipStatus('pending_received');
          }
        } else {
          setFriendshipStatus(friendship.status as 'blocked');
        }
      } else {
        setFriendshipStatus('none');
      }
    } catch (error) {
      console.error('Error checking friendship status:', error);
    }
  };

  const handleAddFriend = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !otherUserProfile) return;

      const { error } = await supabase
        .from('friendships')
        .insert({
          user1_id: user.id,
          user2_id: otherUserProfile.id,
          status: 'pending',
          created_at: new Date().toISOString()
        });

      if (error) {
        toast({ variant: 'error', title: 'failed to send friend request' });
      } else {
        setFriendshipStatus('pending_sent');
        toast({ variant: 'success', title: 'friend request sent' });
      }
    } catch (error) {
      toast({ variant: 'error', title: 'failed to send friend request' });
    }
  };

  const handleUnsendRequest = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !otherUserProfile) return;

      const { error } = await supabase
        .from('friendships')
        .delete()
        .eq('user1_id', user.id)
        .eq('user2_id', otherUserProfile.id);

      if (error) {
        toast({ variant: 'error', title: 'failed to unsend request' });
      } else {
        setFriendshipStatus('none');
        toast({ variant: 'success', title: 'friend request cancelled' });
      }
    } catch (error) {
      toast({ variant: 'error', title: 'failed to unsend request' });
    }
  };

  const handleAcceptRequest = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !otherUserProfile) return;

      const { error } = await supabase
        .from('friendships')
        .update({ status: 'friends' })
        .or(`and(user1_id.eq.${otherUserProfile.id},user2_id.eq.${user.id}),and(user1_id.eq.${user.id},user2_id.eq.${otherUserProfile.id})`);

      if (error) {
        toast({ variant: 'error', title: 'failed to accept request' });
      } else {
        setFriendshipStatus('friends');
        toast({ variant: 'success', title: 'friend request accepted' });
        loadFriendsList(); // Refresh friends list
      }
    } catch (error) {
      toast({ variant: 'error', title: 'failed to accept request' });
    }
  };

  const handleDeclineRequest = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !otherUserProfile) return;

      const { error } = await supabase
        .from('friendships')
        .delete()
        .or(`and(user1_id.eq.${otherUserProfile.id},user2_id.eq.${user.id}),and(user1_id.eq.${user.id},user2_id.eq.${otherUserProfile.id})`);

      if (error) {
        toast({ variant: 'error', title: 'failed to decline request' });
      } else {
        setFriendshipStatus('none');
        toast({ variant: 'success', title: 'friend request declined' });
      }
    } catch (error) {
      toast({ variant: 'error', title: 'failed to decline request' });
    }
  };

  const handleRemoveFriend = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !otherUserProfile) return;

      const { error } = await supabase
        .from('friendships')
        .delete()
        .or(`and(user1_id.eq.${user.id},user2_id.eq.${otherUserProfile.id}),and(user1_id.eq.${otherUserProfile.id},user2_id.eq.${user.id})`);

      if (error) {
        toast({ variant: 'error', title: 'failed to remove friend' });
      } else {
        setFriendshipStatus('none');
        toast({ variant: 'success', title: 'friend removed' });
        loadFriendsList(); // Refresh friends list
      }
    } catch (error) {
      toast({ variant: 'error', title: 'failed to remove friend' });
    }
  };

  const loadFriendsList = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load confirmed friends
      const { data: friendships } = await supabase
        .from('friendships')
        .select(`
          user1_id,
          user2_id,
          user2:profiles!friendships_user2_id_fkey(id, username, avatar_url),
          user1:profiles!friendships_user1_id_fkey(id, username, avatar_url)
        `)
        .eq('status', 'friends')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);

      if (friendships) {
        const friends: Profile[] = friendships.map((friendship: any) => {
          // Get the profile that isn't the current user
          return friendship.user1_id === user.id 
            ? friendship.user2 
            : friendship.user1;
        }).filter(Boolean);
        setFriendsList(friends);
      }

      // Load outgoing requests (requests sent by current user)
      const { data: outgoing } = await supabase
        .from('friendships')
        .select(`
          user2_id,
          user2:profiles!friendships_user2_id_fkey(id, username, avatar_url)
        `)
        .eq('status', 'pending')
        .eq('user1_id', user.id);

      if (outgoing) {
        const outgoingProfiles: Profile[] = outgoing.map((req: any) => req.user2).filter(Boolean);
        setOutgoingRequests(outgoingProfiles);
      }

      // Load incoming requests (requests received by current user)
      const { data: incoming } = await supabase
        .from('friendships')
        .select(`
          user1_id,
          user1:profiles!friendships_user1_id_fkey(id, username, avatar_url)
        `)
        .eq('status', 'pending')
        .eq('user2_id', user.id);

      if (incoming) {
        const incomingProfiles: Profile[] = incoming.map((req: any) => req.user1).filter(Boolean);
        setIncomingRequests(incomingProfiles);
      }
    } catch (error) {
      console.error('Error loading friends data:', error);
    }
  };

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        
        if (isOwnProfile) {
          // Load own profile
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;
          
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .maybeSingle();
          
          
          const { data: statsData, error: statsError } = await supabase
            .from('user_stats')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle();
          
          
          if (profileData) {
            setProfile(profileData);
            setNewUsername(profileData.username);
            
            // Auto-connect GitHub if user signed up with GitHub OAuth and no github_id set
            if (!profileData.github_id && user.app_metadata?.provider === 'github') {
              const githubId = user.user_metadata?.provider_id;
              const githubUsername = user.user_metadata?.user_name || user.user_metadata?.preferred_username;
              const githubAvatarUrl = user.user_metadata?.avatar_url;
              
              if (githubId && githubUsername) {
                // Auto-update the profile with GitHub OAuth data
                const { error } = await supabase
                  .from('profiles')
                  .update({ 
                    github_id: githubId,
                    github_username: githubUsername,
                    github_avatar_url: githubAvatarUrl,
                    github_connected_at: new Date().toISOString()
                  })
                  .eq('id', user.id);
                
                if (!error) {
                  setProfile(prev => prev ? { 
                    ...prev, 
                    github_id: githubId,
                    github_username: githubUsername,
                    github_avatar_url: githubAvatarUrl,
                    github_connected_at: new Date().toISOString()
                  } : null);
                }
              }
            }
            
            // Check for GitHub OAuth results
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.get('github_connected') === 'success') {
              console.log('✅ GitHub OAuth successful! Refreshing profile data...');
              toast({ variant: 'success', title: 'github account connected successfully!' });
              
              // Refresh the page to show updated profile
              setTimeout(() => {
                window.location.href = '/profile';
              }, 1000);
              
            } else if (urlParams.has('github_error')) {
              const error = urlParams.get('github_error');
              const existingUser = urlParams.get('existing_user');
              
              console.error('❌ GitHub OAuth failed:', error);
              
              let errorMessage = 'failed to connect github account';
              switch (error) {
                case 'already_linked':
                  errorMessage = existingUser 
                    ? `this github account is already linked to user: ${existingUser}` 
                    : 'this github account is already linked to another user';
                  break;
                case 'access_denied':
                  errorMessage = 'github authorization was cancelled';
                  break;
                case 'invalid_state':
                case 'missing_parameters':
                  errorMessage = 'invalid oauth request - please try again';
                  break;
                case 'token_exchange_failed':
                case 'failed_to_fetch_user':
                  errorMessage = 'failed to get github account info';
                  break;
                case 'update_failed':
                  errorMessage = 'failed to save github connection';
                  break;
                default:
                  errorMessage = `github connection error: ${error}`;
              }
              
              toast({ variant: 'error', title: errorMessage });
              
              // Clean up URL
              window.history.replaceState({}, document.title, window.location.pathname);
            }
          }
          if (statsData) {
            setUserStats(statsData);
          } else {
            // If no user_stats, calculate from attempts table directly
            const { data: attempts, error: attemptsError } = await supabase
              .from('attempts')
              .select('wpm, accuracy')
              .eq('user_id', user.id);
            
            
            if (attempts && attempts.length > 0) {
              const totalAttempts = attempts.length;
              const avgWpm = attempts.reduce((sum, a) => sum + a.wpm, 0) / totalAttempts;
              const avgAccuracy = attempts.reduce((sum, a) => sum + a.accuracy, 0) / totalAttempts;
              
              
              setUserStats({
                total_attempts: totalAttempts,
                avg_wpm: avgWpm,
                avg_accuracy: avgAccuracy
              });
            }
          }
        } else {
          // Load other user's profile
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('username', profileUsername)
            .maybeSingle();
          
          
          if (profileData) {
            setOtherUserProfile(profileData);
            
            
            // First try user_stats table
            const { data: statsData, error: statsError } = await supabase
              .from('user_stats')
              .select('*')
              .eq('user_id', profileData.id)
              .maybeSingle();
            
            
            if (statsData) {
              setOtherUserStats(statsData);
            } else {
              // If no user_stats, calculate from attempts table directly
              const { data: attempts, error: attemptsError } = await supabase
                .from('attempts')
                .select('wpm, accuracy')
                .eq('user_id', profileData.id);
              
              
              if (attempts && attempts.length > 0) {
                const totalAttempts = attempts.length;
                const avgWpm = attempts.reduce((sum, a) => sum + a.wpm, 0) / totalAttempts;
                const avgAccuracy = attempts.reduce((sum, a) => sum + a.accuracy, 0) / totalAttempts;
                
                
                setOtherUserStats({
                  total_attempts: totalAttempts,
                  avg_wpm: avgWpm,
                  avg_accuracy: avgAccuracy
                });
              }
            }
          }
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadProfile();
    
    // Load friends list for own profile, or check friendship status for other profiles
    if (isOwnProfile) {
      loadFriendsList();
    } else if (otherUserProfile) {
      checkFriendshipStatus(otherUserProfile.id);
    }
  }, [isOwnProfile, profileUsername, otherUserProfile?.id]);

  // For other users viewing, use their data; for own profile use user's data
  const displayProfile = isOwnProfile ? profile : otherUserProfile;
  const displayStats = isOwnProfile ? userStats : otherUserStats;
  
  // Use XP from profile database instead of calculating it
  // For other users, use their profile data; for own profile, use current user data
  const totalXp = displayProfile?.xp || 0;
  
  const level = getLevelFromXP(totalXp);
  const nextLevel = levels.find(l => l.threshold > totalXp);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-8 p-4">
        <div className="bg-white/90 dark:bg-zinc-900/60 backdrop-blur-sm rounded-2xl border border-zinc-300 dark:border-zinc-800 p-6 shadow-lg text-center">
          <div className="text-lg text-zinc-600 dark:text-zinc-400">loading profile...</div>
        </div>
      </div>
    );
  }

  // Handle case where other user profile doesn't exist
  if (!isOwnProfile && !otherUserProfile) {
    return (
      <div className="max-w-4xl mx-auto space-y-8 p-4">
        <div className="bg-white/90 dark:bg-zinc-900/60 backdrop-blur-sm rounded-2xl border border-zinc-300 dark:border-zinc-800 p-6 shadow-lg text-center">
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-white mb-2">user not found</h1>
          <p className="text-zinc-600 dark:text-zinc-400">the user you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-4">
      {/* Profile Header */}
      <div className="bg-white/90 dark:bg-zinc-900/60 backdrop-blur-sm rounded-2xl border border-zinc-300 dark:border-zinc-800 p-6 shadow-lg">
        <div className="flex items-start gap-6">
          {/* Avatar */}
          <div className="relative">
            <img
              src={displayProfile?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(displayProfile?.username || 'anonymous')}`}
              className="w-24 h-24 rounded-full border-2 border-zinc-300 dark:border-zinc-700"
              alt="avatar"
            />
            {/* Only show avatar upload button for own profile */}
            {isOwnProfile && (
              <>
                <input
                  type="file"
                  id="avatar-upload"
                  className="hidden"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                />
                <button
                  onClick={() => document.getElementById('avatar-upload')?.click()}
                  className="absolute -bottom-2 -right-2 w-8 h-8 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center text-sm transition-colors"
                  title="change avatar"
                >
                  <Camera size={14} />
                </button>
              </>
            )}
          </div>

          {/* Profile Info */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              {/* Username editing - only for own profile */}
              {isOwnProfile ? (
                <div className="flex items-center gap-2">
                  {isEditingUsername ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={newUsername}
                        onChange={(e) => {
                          setNewUsername(e.target.value);
                          setTimeout(() => checkUsernameAvailability(e.target.value), 500);
                        }}
                        className={`text-3xl font-bold bg-white dark:bg-zinc-800 border rounded-md px-2 py-1 focus:outline-none focus:ring-2 ${
                          usernameStatus === 'checking' 
                            ? 'border-yellow-300 dark:border-yellow-600 focus:ring-yellow-500' 
                            : usernameStatus === 'available' 
                              ? 'border-green-300 dark:border-green-600 focus:ring-green-500' 
                              : newUsername && newUsername !== profile?.username
                                ? 'border-red-300 dark:border-red-600 focus:ring-red-500'
                                : 'border-zinc-300 dark:border-zinc-700 focus:ring-blue-500'
                        } text-zinc-900 dark:text-white`}
                        placeholder="enter username"
                        maxLength={20}
                      />
                      <button
                        onClick={handleUpdateUsername}
                        disabled={!canSaveUsername}
                        className="p-1 text-green-600 hover:text-green-700 disabled:opacity-50"
                      >
                        <Check size={20} />
                      </button>
                      <button
                        onClick={() => {
                          setIsEditingUsername(false);
                          setNewUsername(profile?.username || '');
                          setUsernameStatus('idle');
                        }}
                        className="p-1 text-red-600 hover:text-red-700"
                      >
                        <X size={20} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">
                        {displayProfile?.username || 'loading...'}
                      </h1>
                      <button
                        onClick={() => setIsEditingUsername(true)}
                        className="p-1 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                      >
                        <Edit2 size={16} />
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">
                  {displayProfile?.username || 'loading...'}
                </h1>
              )}
              
              {level && (
                <div className="flex items-center gap-2">
                  <level.icon size={24} className={level.color} />
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">{level.name}</span>
                </div>
              )}
            </div>
            
            {/* Username validation feedback - only show when editing */}
            {isOwnProfile && isEditingUsername && newUsername && newUsername !== profile?.username && (
              <div className={`text-xs mb-2 ${
                usernameStatus === 'checking' 
                  ? 'text-yellow-600 dark:text-yellow-400' 
                  : usernameStatus === 'available' 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-red-600 dark:text-red-400'
              }`}>
                {usernameStatus === 'checking' ? 'checking...' : 
                 usernameStatus === 'available' ? 'username available' : 
                 'username already taken'}
              </div>
            )}
            
            {/* GitHub Connection */}
            <div className="mb-4">
              <div className="flex items-center gap-3 mb-2">
                <Github size={18} className="text-zinc-600 dark:text-zinc-400" />
                {displayProfile?.github_username ? (
                  <div className="flex items-center gap-2">
                    <a
                      href={`https://github.com/${displayProfile.github_username}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors flex items-center gap-1"
                    >
                      {displayProfile.github_username}
                      <ExternalLink size={12} />
                    </a>
                    {isOwnProfile && (
                      <button
                        onClick={handleDisconnectGithub}
                        className="px-2 py-1 text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 border border-red-200 dark:border-red-800 rounded transition-colors"
                        title="disconnect github account"
                      >
                        disconnect
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    {isOwnProfile ? (
                      <button
                        onClick={handleConnectGithub}
                        disabled={isConnectingGithub}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Github size={14} />
                        {isConnectingGithub ? 'connecting...' : 'connect with github'}
                      </button>
                    ) : (
                      <span className="text-sm text-zinc-500 dark:text-zinc-400">no github connected</span>
                    )}
                  </div>
                )}
              </div>
              {displayProfile?.github_connected_at && isOwnProfile && (
                <div className="text-xs text-zinc-500 dark:text-zinc-400 ml-6">
                  connected {new Date(displayProfile.github_connected_at).toLocaleDateString()}
                </div>
              )}
            </div>
            
            {/* XP Progress - Only show progress details for own profile */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-1">
                <Zap size={16} className="text-zinc-600 dark:text-zinc-400" />
                <span className="text-sm text-zinc-600 dark:text-zinc-400">
                  {totalXp.toLocaleString()} xp
                </span>
                {/* Only show progress to next level for own profile */}
                {isOwnProfile && nextLevel && (
                  <span className="text-xs text-zinc-500 dark:text-zinc-500">
                    • {(nextLevel.threshold - totalXp).toLocaleString()} to {nextLevel.name}
                  </span>
                )}
              </div>
              {/* Only show progress bar for own profile */}
              {isOwnProfile && nextLevel && (
                <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(100, ((totalXp - level.threshold) / (nextLevel.threshold - level.threshold)) * 100)}%`
                    }}
                  />
                </div>
              )}
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-zinc-100 dark:bg-zinc-800 rounded-lg p-3">
                <div className="text-lg font-semibold text-zinc-900 dark:text-white">
                  {displayStats?.avg_wpm ? Math.round(displayStats.avg_wpm) : '0'}
                </div>
                <div className="text-xs text-zinc-600 dark:text-zinc-400">avg wpm</div>
              </div>
              <div className="bg-zinc-100 dark:bg-zinc-800 rounded-lg p-3">
                <div className="text-lg font-semibold text-zinc-900 dark:text-white">
                  {displayStats?.avg_accuracy ? Math.round(displayStats.avg_accuracy) : '0'}%
                </div>
                <div className="text-xs text-zinc-600 dark:text-zinc-400">avg accuracy</div>
              </div>
              <div className="bg-zinc-100 dark:bg-zinc-800 rounded-lg p-3">
                <div className="text-lg font-semibold text-zinc-900 dark:text-white">
                  {displayStats?.total_attempts || 0}
                </div>
                <div className="text-xs text-zinc-600 dark:text-zinc-400">attempts</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Friend Actions - Only for other users' profiles */}
        {!isOwnProfile && (
          <div className="mt-6 flex justify-end">
            {friendshipStatus === 'none' && (
              <button
                onClick={handleAddFriend}
                className="flex items-center gap-2 px-6 py-3 bg-white/90 dark:bg-zinc-800/90 hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 rounded-xl transition-all duration-200 text-sm font-medium shadow-sm hover:shadow-md backdrop-blur-sm"
              >
                <UserPlus size={16} />
                add friend
              </button>
            )}
            {friendshipStatus === 'pending_sent' && (
              <button
                onClick={handleUnsendRequest}
                className="flex items-center gap-2 px-6 py-3 bg-yellow-50 dark:bg-yellow-900/20 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 text-yellow-600 dark:text-yellow-400 rounded-xl transition-all duration-200 text-sm font-medium shadow-sm hover:shadow-md backdrop-blur-sm"
              >
                <X size={16} />
                cancel request
              </button>
            )}
            {friendshipStatus === 'pending_received' && (
              <div className="flex gap-3">
                <button
                  onClick={handleAcceptRequest}
                  className="flex items-center gap-2 px-6 py-3 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 rounded-xl transition-all duration-200 text-sm font-medium shadow-sm hover:shadow-md backdrop-blur-sm"
                >
                  <Check size={16} />
                  accept
                </button>
                <button
                  onClick={handleDeclineRequest}
                  className="flex items-center gap-2 px-6 py-3 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-xl transition-all duration-200 text-sm font-medium shadow-sm hover:shadow-md backdrop-blur-sm"
                >
                  <X size={16} />
                  decline
                </button>
              </div>
            )}
            {friendshipStatus === 'friends' && (
              <button
                onClick={handleRemoveFriend}
                className="flex items-center gap-2 px-6 py-3 bg-zinc-50 dark:bg-zinc-800/90 hover:bg-red-50 dark:hover:bg-red-900/20 border border-zinc-200 dark:border-zinc-700 hover:border-red-200 dark:hover:border-red-800 text-zinc-600 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400 rounded-xl transition-all duration-200 text-sm font-medium shadow-sm hover:shadow-md backdrop-blur-sm"
              >
                <UserMinus size={16} />
                remove friend
              </button>
            )}
          </div>
        )}
      </div>

      {/* Achievements Section */}
      <div className="bg-white/90 dark:bg-zinc-900/60 backdrop-blur-sm rounded-2xl border border-zinc-300 dark:border-zinc-800 p-6 shadow-lg">
        <AchievementPanel 
          userId={displayProfile?.id}
          currentWpm={displayStats?.avg_wpm || 0}
          showProgress={true}
          maxDisplay={12}
        />
      </div>

      {/* Friends & Requests - Only show for own profile */}
      {isOwnProfile && (
        <div className="bg-white/90 dark:bg-zinc-900/60 backdrop-blur-sm rounded-2xl border border-zinc-300 dark:border-zinc-800 p-6 shadow-lg">
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
              <Users size={20} />
              friends
            </h2>
          </div>
          
          <div className="space-y-6">
              {/* Friends Section */}
              <div>
                <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3 flex items-center gap-2">
                  <Users size={16} />
                  friends ({friendsList.length})
                </h3>
                <div className="space-y-2">
                  {friendsList.length === 0 ? (
                    <p className="text-zinc-600 dark:text-zinc-400 text-sm text-center py-3 bg-zinc-50 dark:bg-zinc-800/30 rounded-lg">
                      no friends yet
                    </p>
                  ) : (
                    friendsList.map((friend) => (
                      <div key={friend.id} className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-800/30 rounded-lg">
                        <img
                          src={friend.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(friend.username)}`}
                          className="w-10 h-10 rounded-full"
                          alt="avatar"
                        />
                        <div className="flex-1">
                          <a
                            href={`/profile/${friend.username}`}
                            className="font-medium text-zinc-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                            onClick={(e) => {
                              e.preventDefault();
                              window.location.href = `/profile/${friend.username}`;
                            }}
                          >
                            {friend.username}
                          </a>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Outgoing Requests Section */}
              {outgoingRequests.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3 flex items-center gap-2">
                    <UserPlus size={16} />
                    pending requests ({outgoingRequests.length})
                  </h3>
                  <div className="space-y-2">
                    {outgoingRequests.map((user) => (
                      <div key={user.id} className="flex items-center gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                        <img
                          src={user.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.username)}`}
                          className="w-10 h-10 rounded-full"
                          alt="avatar"
                        />
                        <div className="flex-1">
                          <a
                            href={`/profile/${user.username}`}
                            className="font-medium text-zinc-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                            onClick={(e) => {
                              e.preventDefault();
                              window.location.href = `/profile/${user.username}`;
                            }}
                          >
                            {user.username}
                          </a>
                          <p className="text-xs text-yellow-600 dark:text-yellow-400">request sent</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Incoming Requests Section */}
              {incomingRequests.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3 flex items-center gap-2">
                    <UserPlus size={16} />
                    friend requests ({incomingRequests.length})
                  </h3>
                  <div className="space-y-2">
                    {incomingRequests.map((user) => (
                      <div key={user.id} className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <img
                          src={user.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.username)}`}
                          className="w-10 h-10 rounded-full"
                          alt="avatar"
                        />
                        <div className="flex-1">
                          <a
                            href={`/profile/${user.username}`}
                            className="font-medium text-zinc-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                            onClick={(e) => {
                              e.preventDefault();
                              window.location.href = `/profile/${user.username}`;
                            }}
                          >
                            {user.username}
                          </a>
                          <p className="text-xs text-blue-600 dark:text-blue-400">wants to be friends</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={async () => {
                              try {
                                const { data: { user: currentUser } } = await supabase.auth.getUser();
                                if (!currentUser) return;

                                const { error } = await supabase
                                  .from('friendships')
                                  .update({ status: 'friends' })
                                  .eq('user1_id', user.id)
                                  .eq('user2_id', currentUser.id);

                                if (error) {
                                  toast({ variant: 'error', title: 'failed to accept request' });
                                } else {
                                  toast({ variant: 'success', title: 'friend request accepted' });
                                  loadFriendsList(); // Refresh the lists
                                }
                              } catch (error) {
                                toast({ variant: 'error', title: 'failed to accept request' });
                              }
                            }}
                            className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-xs font-medium"
                          >
                            accept
                          </button>
                          <button
                            onClick={async () => {
                              try {
                                const { data: { user: currentUser } } = await supabase.auth.getUser();
                                if (!currentUser) return;

                                const { error } = await supabase
                                  .from('friendships')
                                  .delete()
                                  .eq('user1_id', user.id)
                                  .eq('user2_id', currentUser.id);

                                if (error) {
                                  toast({ variant: 'error', title: 'failed to decline request' });
                                } else {
                                  toast({ variant: 'success', title: 'friend request declined' });
                                  loadFriendsList(); // Refresh the lists
                                }
                              } catch (error) {
                                toast({ variant: 'error', title: 'failed to decline request' });
                              }
                            }}
                            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-xs font-medium"
                          >
                            decline
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            {/* Empty State */}
            {friendsList.length === 0 && outgoingRequests.length === 0 && incomingRequests.length === 0 && (
              <p className="text-zinc-600 dark:text-zinc-400 text-sm text-center py-6">
                start building your network! visit other users' profiles and add them as friends.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Account Settings - Only show for own profile */}
      {isOwnProfile && (
        <div className="bg-white/90 dark:bg-zinc-900/60 backdrop-blur-sm rounded-2xl border border-zinc-300 dark:border-zinc-800 p-6 shadow-lg">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-4">account</h2>
          
          {/* Username change limit info */}
          {profile && (
            <div className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
              {profile.username_changes >= 2 && (
                <div className="text-amber-600 dark:text-amber-400">
                  username change limit reached (2 per month)
                </div>
              )}
              {profile.username_changes < 2 && (
                <div>
                  {2 - profile.username_changes} username change{2 - profile.username_changes !== 1 ? 's' : ''} remaining this month
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-between items-center">
            <button
              onClick={() => setShowDeleteModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-xl transition-all duration-200 text-sm font-medium shadow-sm hover:shadow-md backdrop-blur-sm"
            >
              delete account
            </button>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-6 py-2 bg-zinc-50 dark:bg-zinc-800/90 hover:bg-zinc-100 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 rounded-xl transition-all duration-200 text-sm font-medium shadow-sm hover:shadow-md backdrop-blur-sm"
            >
              sign out
            </button>
          </div>
        </div>
      )}

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm rounded-2xl border border-zinc-300 dark:border-zinc-800 p-6 shadow-2xl max-w-md w-full">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">
              delete account
            </h3>
            <p className="text-zinc-600 dark:text-zinc-400 text-sm mb-6">
              are you sure you want to permanently delete your account? this action cannot be undone and will remove all your data including stats, friends, and profile information.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg transition-colors text-sm font-medium"
              >
                cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm font-medium"
              >
                delete permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};