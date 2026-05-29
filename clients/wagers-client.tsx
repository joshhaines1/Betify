import { FIREBASE_AUTH } from '@/FirebaseConfig';
import { BASE_API_ENDPOINT } from '../constants/api';
import * as eventsClient from './events-client';

export async function placeWager({ groupId, picks, eventIds, odds, multiplier, risk, payout, lockDates}) {
  const user = FIREBASE_AUTH.currentUser;
    if (!user) {
      console.error("No logged-in user.");
      throw new Error("User not authenticated");
    }
    
  const userId = user.uid;
  const token = await FIREBASE_AUTH.currentUser?.getIdToken();
  if (!token) throw new Error("User not authenticated");

  for (let date of lockDates) {
    if (new Date(date) <= new Date()) {
      // Refetch events to check for any last-minute changes
      throw new Error("One or more events are already locked. Please remove them from your bet slip.");
    }
  }

  const res = await fetch(`${BASE_API_ENDPOINT}/wagers`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ groupId, userId, picks, eventIds, odds, multiplier, risk, payout, lockDates}),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || data.message || "Failed to place wager");
  }

  return data;
}

export async function getWagersByUser(statusFilter, lastVisible, refresh: boolean = false) {
  const user = FIREBASE_AUTH.currentUser;
  if (!user) {
    console.error("No logged-in user.");
    throw new Error("User not authenticated");
  }

  const token = await user.getIdToken();
  if (!token) throw new Error("User not authenticated");

  // Build query params
  const params = new URLSearchParams();

  if (statusFilter) {
    params.append("status", statusFilter);
  }

  if (!refresh && lastVisible) {
    params.append("lastVisible", lastVisible);
  }

  const url = `${BASE_API_ENDPOINT}/users/${user.uid}/wagers?${params.toString()}`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || data.message || "Failed to fetch wagers");
  }

  console.log("Fetched wagers:", data);
  return data;
}
