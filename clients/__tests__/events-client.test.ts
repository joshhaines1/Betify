const mockUser = {
  uid: "user-1",
  getIdToken: jest.fn(() => Promise.resolve("token-abc")),
};

function loadEventsClient(loggedIn = true) {
  jest.resetModules();
  const { FIREBASE_AUTH } = require("@/FirebaseConfig");
  FIREBASE_AUTH.currentUser = loggedIn ? mockUser : null;
  return require("../events-client");
}

beforeEach(() => {
  global.fetch = jest.fn();
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("createEvent", () => {
  it("POSTs the event payload with the auth token", async () => {
    const eventsClient = loadEventsClient();
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: "e1" }),
    });

    const result = await eventsClient.createEvent({
      groupId: "g1",
      type: "basic",
      options: { team1: "A", team2: "B" },
      lockDate: "2099-01-01",
    });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/events"),
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ Authorization: "Bearer token-abc" }),
      })
    );
    expect(result).toEqual({ id: "e1" });
  });

  it("throws when there is no auth token", async () => {
    const eventsClient = loadEventsClient(false);
    await expect(
      eventsClient.createEvent({ groupId: "g1", type: "basic", options: {}, lockDate: "2099-01-01" })
    ).rejects.toThrow("User not authenticated");
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("surfaces the backend's error message on failure", async () => {
    const eventsClient = loadEventsClient();
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "Invalid odds" }),
    });

    await expect(
      eventsClient.createEvent({ groupId: "g1", type: "basic", options: {}, lockDate: "2099-01-01" })
    ).rejects.toThrow("Invalid odds");
  });
});

describe("updateEvent", () => {
  it("only includes provided fields in the PATCH body", async () => {
    const eventsClient = loadEventsClient();
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ updated: true }),
    });

    await eventsClient.updateEvent({ eventId: "e1", status: "closed" });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/events/e1"),
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ status: "closed" }),
      })
    );
  });
});

describe("deleteEvent", () => {
  it("DELETEs the event by id", async () => {
    const eventsClient = loadEventsClient();
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ deleted: true }),
    });

    await eventsClient.deleteEvent({ eventId: "e1" });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/events/e1"),
      expect.objectContaining({ method: "DELETE" })
    );
  });
});

describe("getEventsByGroupId", () => {
  it("fetches events and caches them by groupId/limit/startAfter", async () => {
    const eventsClient = loadEventsClient();
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ events: [{ id: "e1", status: "open", lockDate: { _seconds: 9999999999 } }] }),
    });

    const first = await eventsClient.getEventsByGroupId({ groupId: "g1" });
    const second = await eventsClient.getEventsByGroupId({ groupId: "g1" });

    expect(first).toEqual(second);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it("bypasses the cache when forceRefresh is true", async () => {
    const eventsClient = loadEventsClient();
    const futureEvent = { id: "e2", status: "open", lockDate: { _seconds: 9999999999 } };
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ events: [] }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ events: [futureEvent] }) });

    await eventsClient.getEventsByGroupId({ groupId: "g1" });
    const refreshed = await eventsClient.getEventsByGroupId({ groupId: "g1", forceRefresh: true });

    expect(refreshed.events).toEqual([futureEvent]);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it("auto-locks events whose lockDate has already passed", async () => {
    const eventsClient = loadEventsClient();
    const pastEvent = {
      id: "e1",
      status: "open",
      lockDate: { _seconds: Math.floor((Date.now() - 60_000) / 1000) },
    };

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ events: [pastEvent] }) }) // GET events
      .mockResolvedValueOnce({ ok: true, json: async () => ({ updated: true }) }); // internal PATCH lock

    const result = await eventsClient.getEventsByGroupId({ groupId: "g1" });

    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(global.fetch).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("/events/e1"),
      expect.objectContaining({ method: "PATCH" })
    );
    expect(result.events[0].status).toBe("closed");
  });
});

describe("getPropsByGroupId", () => {
  it("fetches props and caches them separately from events", async () => {
    const eventsClient = loadEventsClient();
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ events: [{ id: "p1", status: "open", lockDate: { _seconds: 9999999999 } }] }),
    });

    const result = await eventsClient.getPropsByGroupId({ groupId: "g1" });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/groups/g1/props"),
      expect.anything()
    );
    expect(result.events[0].id).toBe("p1");
  });
});
