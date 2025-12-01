import { FIREBASE_AUTH } from '@/.FirebaseConfig';
import { BASE_API_ENDPOINT } from '../constants/api';

export async function placeWager({ groupId, userId, picks, eventIds, odds, multiplier, risk, payout}) {
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

export async function getActiveWagers() {
  
}

export async function getSettledWagers() {
  
}
