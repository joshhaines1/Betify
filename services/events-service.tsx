import { FIREBASE_AUTH } from '@/.FirebaseConfig';
import { BASE_API_ENDPOINT } from '../constants/api';

export async function createEvent({ groupId, type, options}) {
  const token = await FIREBASE_AUTH.currentUser?.getIdToken();
  if (!token) throw new Error("User not authenticated");

  const res = await fetch(`${BASE_API_ENDPOINT}/events`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ groupId, type, options }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || data.message || "Failed to create event");
  }

  return data;
}

export async function updateEvent({ status, results, acceptingWagers, eventId}) {
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

export async function getEventsByGroupId({ groupId }) {
  const token = await FIREBASE_AUTH.currentUser?.getIdToken();
  if (!token) throw new Error("User not authenticated");

  const res = await fetch(`${BASE_API_ENDPOINT}/groups/${groupId}/events`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json();
  console.log(data);

  if (!res.ok) {
    throw new Error(data.error || data.message || "Failed to get events");
  }

  return data;
}

