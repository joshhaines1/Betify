import { FIREBASE_AUTH } from '@/FirebaseConfig';
import { BASE_API_ENDPOINT } from '../constants/api';

export async function createEvent({ groupId, type, options, lockDate}) {
  const token = await FIREBASE_AUTH.currentUser?.getIdToken();
  if (!token) throw new Error("User not authenticated");

  const res = await fetch(`${BASE_API_ENDPOINT}/events`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ groupId, type, options, lockDate }),
  });


  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || data.message || "Failed to create event");
  }

  return data;
}

export async function updateEvent({ status, results, acceptingWagers, eventId }) {
  const token = await FIREBASE_AUTH.currentUser?.getIdToken();
  if (!token) throw new Error("User not authenticated");

  // Build update body with only provided values
  const updateBody: any = {};
  if (status !== undefined) updateBody.status = status;
  if (results !== undefined) updateBody.results = results;
  if (acceptingWagers !== undefined) updateBody.acceptingWagers = acceptingWagers;

  const res = await fetch(`${BASE_API_ENDPOINT}/events/${eventId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(updateBody),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || data.message || "Failed to update event");
  }

  return data;
}

export async function deleteEvent({ eventId}) {
  const token = await FIREBASE_AUTH.currentUser?.getIdToken();
  if (!token) throw new Error("User not authenticated");

  const res = await fetch(`${BASE_API_ENDPOINT}/events/${eventId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || data.message || "Failed to delete event");
  }

  return data;
}

export async function getEventById({ eventId }) {
  const token = await FIREBASE_AUTH.currentUser?.getIdToken();
  if (!token) throw new Error("User not authenticated");

  console.log("1.  " + eventId);
  const res = await fetch(`${BASE_API_ENDPOINT}/events/${eventId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || data.message || "Failed to get event");
  }

  return data;
}

const cache = {};
async function lockExpiredEvents(events) {
  for (const event of events) {
    if (event.lockDate._seconds * 1000 < Date.now() && event.status === "open") {
      await updateEvent({ eventId: event.id, status: "closed", acceptingWagers: false, results: [] });
      event.status = "closed";
      event.acceptingWagers = false;
    }
  }
}

export async function getEventsByGroupId({ groupId, forceRefresh = false }) {
  const token = await FIREBASE_AUTH.currentUser?.getIdToken();
  if (!token) throw new Error("User not authenticated");

  if (cache[groupId] && !forceRefresh) {
    console.log("Using CACHED data");
    await lockExpiredEvents(cache[groupId]);
    return cache[groupId];
  }

  console.log("Using FRESH data");
  const res = await fetch(`${BASE_API_ENDPOINT}/groups/${groupId}/events`, {
    method: "GET",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || data.message || "Failed to get events");

  await lockExpiredEvents(data);
  cache[groupId] = data;
  return data;
}

export async function clearEventsCache(groupId: string) {
  delete cache[groupId];
}
