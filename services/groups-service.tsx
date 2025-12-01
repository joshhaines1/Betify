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


export const getUsersGroups = async () => {
  try {
    const user = FIREBASE_AUTH.currentUser;
    if (!user) {
      console.error("No logged-in user.");
      return [];
    }

    const token = await user.getIdToken();
    const response = await fetch(`${BASE_API_ENDPOINT}/users/${user.uid}/groups`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    return await response.json();
  } catch (error) {
    console.error("Error fetching user's groups:", error);
    return [];
  }
};

export const getAllGroups = async (limit = 0) => {
  try {
    const user = FIREBASE_AUTH.currentUser;
    if (!user) {
      console.error("No logged-in user.");
      return [];
    }
    const token = await user.getIdToken();
    const response = await fetch(`${BASE_API_ENDPOINT}/groups?limit=${limit}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    return await response.json();
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
