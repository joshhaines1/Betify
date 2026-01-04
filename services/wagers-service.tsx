import { FIREBASE_AUTH } from '@/.FirebaseConfig';
import { BASE_API_ENDPOINT } from '../constants/api';

export async function placeWager({ groupId, picks, eventIds, odds, multiplier, risk, payout}) {
  const user = FIREBASE_AUTH.currentUser;
    if (!user) {
      console.error("No logged-in user.");
      return [];
    }
    
  const userId = user.uid;
  const token = await FIREBASE_AUTH.currentUser?.getIdToken();
  if (!token) throw new Error("User not authenticated");

  const res = await fetch(`${BASE_API_ENDPOINT}/wagers`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ groupId, userId, picks, eventIds, odds, multiplier, risk, payout,}),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || data.message || "Failed to place wager");
  }

  return data;
}

export async function getWagersByUser(statusFilter, lastVisible, refresh = false) {
  const user = FIREBASE_AUTH.currentUser;
    if (!user) {
      console.error("No logged-in user.");
      return [];
    }
  const token = await FIREBASE_AUTH.currentUser?.getIdToken();
  if (!token) throw new Error("User not authenticated");

  const res = await fetch(`${BASE_API_ENDPOINT}/wagers/${user.uid}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      body: JSON.stringify({ status: statusFilter, lastVisible: refresh ? null : lastVisible }),
    },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || data.message || "Failed to fetch wagers");
  }

  return data;
}