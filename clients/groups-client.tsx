import { FIREBASE_AUTH } from '@/.FirebaseConfig';
import { BASE_API_ENDPOINT } from '../constants/api';

export const createGroup = async (groupName, visibility, startingCurrency, password) => {
  const API_ENDPOINT = `${BASE_API_ENDPOINT}/groups`;
  try {
    const user = FIREBASE_AUTH.currentUser;
    if (!user) {
      console.error("No logged-in user.");
      return;
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

    return await response.json();
  } catch (error) {
    console.error("Error creating group:", error);
  }
};

let usersGroupCache = []
export const getUsersGroups = async ( forceRefresh = false ) => {
  try {
    const user = FIREBASE_AUTH.currentUser;
    if (!user) {
      console.error("No logged-in user.");
      return [];
    }

    // Check if the data is already in the cache
    if (usersGroupCache.length > 0 && !forceRefresh) {
      console.log(`Returning cached data for user's groups}`);
      return usersGroupCache;
    }

    const token = await user.getIdToken();
    const response = await fetch(`${BASE_API_ENDPOINT}/users/${user.uid}/groups`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await response.json();
    usersGroupCache = data; // Store the response in the cache
    return data;
  } catch (error) {
    console.error("Error fetching user's groups:", error);
    return [];
  }
};

export const getGroupById = async (groupId) => {
  try {
    const user = FIREBASE_AUTH.currentUser;
    if (!user) {
      console.error("No logged-in user.");
      return [];
    }

    const token = await user.getIdToken();
    const response = await fetch(`${BASE_API_ENDPOINT}/groups/${groupId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    return await response.json();
  } catch (error) {
    console.error("Error fetching group by ID:", error);
    return [];
  }};

let allGroupsCache = [];
export const getAllGroups = async ( limit = 0 , forceRefresh = false ) => {
  try {
    const user = FIREBASE_AUTH.currentUser;
    if (!user) {
      console.error("No logged-in user.");
      return [];
    }

    // Check if the data is already in the cache
    if (allGroupsCache.length > 0 && !forceRefresh) {
      console.log(`Returning cached data for user's groups}`);
      return allGroupsCache;
    }

    const token = await user.getIdToken();
    const response = await fetch(`${BASE_API_ENDPOINT}/groups?limit=${limit}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await response.json();
    allGroupsCache = data; // Store the response in the cache
    return data;
  } catch (error) {
    console.error("Error fetching all groups:", error);
    return [];
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

export const getUsersCurrency = async (groupId) => {
  try {
    const user = FIREBASE_AUTH.currentUser;
    if (!user) {
      console.error("No logged-in user.");
      return [];
    }

    const token = await user.getIdToken();
    const response = await fetch(`${BASE_API_ENDPOINT}/groups/${groupId}/members/${user.uid}/balance`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();
    return data.balance;
  } catch (error) {
    console.error("Error fetching user's currency:", error);
    return [];
  }
};

export const getGroupLeaderboard = async (groupId) => {
  try {
    const user = FIREBASE_AUTH.currentUser;
    if (!user) {
      console.error("No logged-in user.");
      return [];
    }

    const token = await user.getIdToken();
    const response = await fetch(`${BASE_API_ENDPOINT}/groups/${groupId}/leaderboard`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();
    return data.leaderboard;
  } catch (error) {
    console.error("Error fetching group leaderboard:", error);
    return [];
  }
};
