import { FIREBASE_AUTH } from '@/FirebaseConfig';
import { BASE_API_ENDPOINT } from '../constants/api';

export const createGroup = async (groupName, visibility, startingCurrency, password) => {
  const API_ENDPOINT = `${BASE_API_ENDPOINT}/groups`;
  try {
    const user = FIREBASE_AUTH.currentUser;
    if (!user) {
      throw new Error("User not authenticated");
    }

    const token = await user.getIdToken();
    const response = await fetch(API_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: groupName,
        visibility,
        startingCurrency,
        password: password || "",
      }),
    });
    if (response.status !== 201) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to create group");
    }
    return await response.json();
  } catch (error) {
    throw new Error("Failed to create group. Please try again later.");
  }
};

export const leaveGroup = async (groupId) => {
  const API_ENDPOINT = `${BASE_API_ENDPOINT}/groups/${groupId}/leave`;
  try {
    const user = FIREBASE_AUTH.currentUser;
    if (!user) {
      throw new Error("User not authenticated");
    }

    const token = await user.getIdToken();

    const response = await fetch(API_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    return await response.json();
  } catch (error) {
    throw new Error("Failed to leave group. Please try again later.");
  }
};

let usersGroupCache: any[] = [];

export const getUsersGroups = async (
  limit: number = 5,
  forceRefresh: boolean = false,
  startAfter: string | null = null
) => {
  try {
    const user = FIREBASE_AUTH.currentUser;
    if (!user) {
      throw new Error("User not authenticated");
    }

    if (usersGroupCache.length > 0 && !forceRefresh && !startAfter) {
      console.log(`Fetching CACHED data for user's groups...`);
      return { groups: usersGroupCache, lastVisible: null, cached: true };
    }


    const token = await user.getIdToken();
    let url = `${BASE_API_ENDPOINT}/users/${user.uid}/groups?limit=${limit}`;
    const isFreshPage = !startAfter || forceRefresh; // <-- key fix

    if (startAfter && !forceRefresh) {
      url += `&startAfter=${startAfter}`;
      console.log(`Fetching next page of data for user's groups...`);
    } else {
      console.log(`Fetching FRESH data for user's groups...`);
    }
    

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      throw new Error(data?.error || "Failed to fetch user's groups");
    }

    const data = await response.json();

    if (isFreshPage) {
      usersGroupCache = data.groups; // Overwrite: this was page 1, forced or not
    } else {
      usersGroupCache = [...usersGroupCache, ...data.groups]; // True continuation
    }

    return {
      groups: data.groups,
      lastVisible: data.lastVisible ?? null,
      cached: false,
    };
  } catch (error) {
    console.log("Error:", error);
    throw new Error("Failed to fetch user's groups");
  }
};

export const getGroupById = async (groupId) => {
  try {
    const user = FIREBASE_AUTH.currentUser;
    if (!user) {
      throw new Error("User not authenticated");
    }

    const token = await user.getIdToken();
    const response = await fetch(`${BASE_API_ENDPOINT}/groups/${groupId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    return await response.json();
  } catch (error) {
    throw new Error("Failed to fetch group by ID");
  }};

let allGroupsCache: any[] = [];

export const getAllGroups = async (
  limit: number = 5,
  forceRefresh: boolean = false,
  startAfter: string | null = null
) => {
  try {
    const user = FIREBASE_AUTH.currentUser;
    if (!user) {
      throw new Error("User not authenticated");
    }

    const isFreshPage = !startAfter || forceRefresh;

    // Only use the cache for the initial page — paginated requests always hit the network
    if (allGroupsCache.length > 0 && !forceRefresh && !startAfter) {
      console.log(`Fetching CACHED data for all groups...`);
      return { groups: allGroupsCache, lastVisible: null, cached: true };
    }

    const token = await user.getIdToken();
    let url = `${BASE_API_ENDPOINT}/groups?limit=${limit}`;
    if (startAfter && !forceRefresh) {
      url += `&startAfter=${startAfter}`;
      console.log(`Fetching next page of data for all groups...`);
    } else {
      console.log(`Fetching FRESH data for all groups...`);
    }

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      throw new Error(data?.error || "Failed to fetch groups");
    }

    const data = await response.json();

    if (isFreshPage) {
      allGroupsCache = data.groups; // Only overwrite cache on a fresh first page
    } else {
      allGroupsCache = [...allGroupsCache, ...data.groups]; // Append new groups to the cache
    }

    return {
      groups: data.groups,
      lastVisible: data.lastVisible ?? null,
      cached: false,
    };

  } catch (error) {
    throw new Error("Failed to fetch all groups");
  }
};

export const joinGroup = async (groupId) => {
    const user = FIREBASE_AUTH.currentUser;
    if (!user) return;

    const token = await user.getIdToken();

    const response = await fetch(`${BASE_API_ENDPOINT}/groups/${groupId}/join`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
    });

    return await response.json();
}

let balanceCache = {};
export const getUsersCurrency = async (groupId, forceRefresh = false) => {
  try {
    const user = FIREBASE_AUTH.currentUser;
    if (!user) {
      throw new Error("User not authenticated");
    }

    if (balanceCache[groupId] && !forceRefresh) {
      return balanceCache[groupId];
    }
    const token = await user.getIdToken();
    const response = await fetch(`${BASE_API_ENDPOINT}/groups/${groupId}/members/${user.uid}/balance`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();
    balanceCache[groupId] = data.balance;
    return data.balance;
  } catch (error) {
    throw new Error("Failed to fetch user's currency");
  }
};

export const addRewardedCurrency = async (groupId, forceRefresh = false) => {
  try {
    const user = FIREBASE_AUTH.currentUser;
    if (!user) {
      throw new Error("User not authenticated");
    }

    const token = await user.getIdToken();
    const response = await fetch(`${BASE_API_ENDPOINT}/groups/${groupId}/rewarded-ad`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();
    balanceCache[groupId] = data.balance; // Update the cache with the new balance
    return data.balance;
  } catch (error) {
    throw new Error("Failed to fetch user's currency");
  }
};

export const clearBalanceCache = (groupId) => {
  console.log("Clearing balance cache for group " + groupId);
  balanceCache[groupId] = null;
}

export const clearGroupsCache = () => {
  console.log("Clearing groups cache");
  usersGroupCache = [];
}

let leaderboardCache = {};
export const getGroupLeaderboard = async (groupId) => {
  try {
    const user = FIREBASE_AUTH.currentUser;
    if (!user) {
      throw new Error("User not authenticated");
    }

    if (leaderboardCache[groupId]) {
      console.log(`Returning cached leaderboard for group ${groupId}`);
      return leaderboardCache[groupId];
    }

    const token = await user.getIdToken();
    const response = await fetch(`${BASE_API_ENDPOINT}/groups/${groupId}/leaderboard`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();
    leaderboardCache[groupId] = data.leaderboard;
    return data.leaderboard;
  } catch (error) {
    throw new Error("Failed to fetch group leaderboard");
  }
};

export const deleteGroup = async (groupId) => {
  try {
    const user = FIREBASE_AUTH.currentUser;
    if (!user) {
      throw new Error("User not authenticated");
    }

    const token = await user.getIdToken();
    const response = await fetch(`${BASE_API_ENDPOINT}/groups/${groupId}/delete`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    return await response.json();
  } catch (error) {
    throw new Error("Failed to delete group");
  }
};

export const addGroupAdmin = async (groupId, userId) => {
  try {
    const user = FIREBASE_AUTH.currentUser;
    if (!user) {
      throw new Error("User not authenticated");
    }

    const token = await user.getIdToken();
    const response = await fetch(`${BASE_API_ENDPOINT}/groups/${groupId}/admin`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ userId }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      throw new Error(data?.message || "Failed to add group admin");
    }

    return await response.json();
  } catch (error) {
    throw new Error("Failed to add group admin. Please try again later.");
  }
};

export const removeGroupAdmin = async (groupId, userId) => {
  try {
    const user = FIREBASE_AUTH.currentUser;
    if (!user) {
      throw new Error("User not authenticated");
    }

    const token = await user.getIdToken();
    const response = await fetch(`${BASE_API_ENDPOINT}/groups/${groupId}/admin`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ userId }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      throw new Error(data?.message || "Failed to remove group admin");
    }

    return await response.json();
  } catch (error) {
    throw new Error("Failed to remove group admin. Please try again later.");
  }
};
