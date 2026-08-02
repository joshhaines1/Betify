const mockUser = {
  uid: "user-1",
  getIdToken: jest.fn(() => Promise.resolve("token-abc")),
};

/** Fresh module instances per call so in-memory caches never leak across tests. */
function loadGroupsClient(loggedIn = true) {
  jest.resetModules();
  const { FIREBASE_AUTH } = require("@/FirebaseConfig");
  FIREBASE_AUTH.currentUser = loggedIn ? mockUser : null;
  const groupsClient = require("../groups-client");
  const firestore = require("firebase/firestore");
  return { groupsClient, firestore };
}

beforeEach(() => {
  global.fetch = jest.fn();
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("createGroup", () => {
  it("POSTs to /groups with the auth token and request body", async () => {
    const { groupsClient } = loadGroupsClient();
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      status: 201,
      json: async () => ({ id: "g1", name: "Test Group" }),
    });

    const result = await groupsClient.createGroup(
      "Test Group",
      "public",
      1000,
      ""
    );

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/groups"),
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ Authorization: "Bearer token-abc" }),
        body: JSON.stringify({
          name: "Test Group",
          visibility: "public",
          startingCurrency: 1000,
          password: "",
        }),
      })
    );
    expect(result).toEqual({ id: "g1", name: "Test Group" });
  });

  it("throws a friendly error when the backend rejects the request", async () => {
    const { groupsClient } = loadGroupsClient();
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      status: 400,
      json: async () => ({ error: "Name taken" }),
    });

    await expect(
      groupsClient.createGroup("Test Group", "public", 1000, "")
    ).rejects.toThrow("Failed to create group. Please try again later.");
  });

  it("throws when there is no authenticated user", async () => {
    const { groupsClient } = loadGroupsClient(false);

    await expect(
      groupsClient.createGroup("Test Group", "public", 1000, "")
    ).rejects.toThrow("Failed to create group. Please try again later.");
    expect(global.fetch).not.toHaveBeenCalled();
  });
});

describe("getUsersGroups", () => {
  it("fetches fresh data and populates the cache on first call", async () => {
    const { groupsClient } = loadGroupsClient();
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ groups: [{ id: "g1" }], lastVisible: null }),
    });

    const result = await groupsClient.getUsersGroups();

    expect(result).toEqual({ groups: [{ id: "g1" }], lastVisible: null, cached: false });
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it("returns cached data on a second call without hitting the network", async () => {
    const { groupsClient } = loadGroupsClient();
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ groups: [{ id: "g1" }], lastVisible: null }),
    });

    await groupsClient.getUsersGroups();
    const second = await groupsClient.getUsersGroups();

    expect(second).toEqual({ groups: [{ id: "g1" }], lastVisible: null, cached: true });
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it("bypasses the cache when forceRefresh is true", async () => {
    const { groupsClient } = loadGroupsClient();
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ groups: [{ id: "g1" }] }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ groups: [{ id: "g2" }] }) });

    await groupsClient.getUsersGroups();
    const refreshed = await groupsClient.getUsersGroups(5, true);

    expect(refreshed.groups).toEqual([{ id: "g2" }]);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it("throws a friendly error when the response is not ok", async () => {
    const { groupsClient } = loadGroupsClient();
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "boom" }),
    });

    await expect(groupsClient.getUsersGroups()).rejects.toThrow(
      "Failed to fetch user's groups"
    );
  });
});

describe("clearGroupsCache", () => {
  it("clears the users-groups cache so the next call refetches", async () => {
    const { groupsClient } = loadGroupsClient();
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ groups: [{ id: "g1" }] }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ groups: [{ id: "g2" }] }) });

    await groupsClient.getUsersGroups();
    groupsClient.clearGroupsCache();
    const afterClear = await groupsClient.getUsersGroups();

    expect(afterClear.groups).toEqual([{ id: "g2" }]);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });
});

describe("getGroupById", () => {
  it("GETs the group and attaches the bearer token", async () => {
    const { groupsClient } = loadGroupsClient();
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => ({ id: "g1", name: "Test Group" }),
    });

    const result = await groupsClient.getGroupById("g1");

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/groups/g1"),
      expect.objectContaining({
        headers: { Authorization: "Bearer token-abc" },
      })
    );
    expect(result).toEqual({ id: "g1", name: "Test Group" });
  });
});

describe("joinGroup / getGroupByInviteCode / joinGroupByInviteCode", () => {
  it("resolves an invite code via Firestore and joins the resolved group", async () => {
    const { groupsClient, firestore } = loadGroupsClient();
    (firestore.getDoc as jest.Mock).mockResolvedValueOnce({
      exists: () => true,
      data: () => ({ groupId: "g1" }),
    });
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => ({ joined: true, groupId: "g1" }),
    });

    const result = await groupsClient.joinGroupByInviteCode("ABC123");

    expect(firestore.doc).toHaveBeenCalledWith(expect.anything(), "inviteCodes", "ABC123");
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/groups/g1/join"),
      expect.objectContaining({ method: "POST" })
    );
    expect(result).toEqual({ joined: true, groupId: "g1" });
  });

  it("throws when the invite code does not resolve to a group", async () => {
    const { groupsClient, firestore } = loadGroupsClient();
    (firestore.getDoc as jest.Mock).mockResolvedValueOnce({
      exists: () => false,
    });

    await expect(
      groupsClient.joinGroupByInviteCode("BADCODE")
    ).rejects.toThrow("Invalid invite code");
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("getGroupByInviteCode returns null for an invalid code instead of throwing", async () => {
    const { groupsClient, firestore } = loadGroupsClient();
    (firestore.getDoc as jest.Mock).mockResolvedValueOnce({
      exists: () => false,
    });

    const result = await groupsClient.getGroupByInviteCode("BADCODE");
    expect(result).toBeNull();
  });
});

describe("getUsersCurrency / addRewardedCurrency / clearBalanceCache", () => {
  it("caches the balance per group and clears it on demand", async () => {
    const { groupsClient } = loadGroupsClient();
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({ json: async () => ({ balance: 500 }) })
      .mockResolvedValueOnce({ json: async () => ({ balance: 700 }) });

    const first = await groupsClient.getUsersCurrency("g1");
    const cached = await groupsClient.getUsersCurrency("g1");
    expect(first).toBe(500);
    expect(cached).toBe(500);
    expect(global.fetch).toHaveBeenCalledTimes(1);

    groupsClient.clearBalanceCache("g1");
    const afterClear = await groupsClient.getUsersCurrency("g1");
    expect(afterClear).toBe(700);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it("addRewardedCurrency POSTs and refreshes the cached balance", async () => {
    const { groupsClient } = loadGroupsClient();
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => ({ balance: 1200 }),
    });

    const result = await groupsClient.addRewardedCurrency("g1");

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/groups/g1/rewarded-ad"),
      expect.objectContaining({ method: "POST" })
    );
    expect(result).toBe(1200);
  });
});

describe("deleteGroup / addGroupAdmin / removeGroupAdmin", () => {
  it("deleteGroup POSTs to the delete endpoint", async () => {
    const { groupsClient } = loadGroupsClient();
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => ({ deleted: true }),
    });

    const result = await groupsClient.deleteGroup("g1");

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/groups/g1/delete"),
      expect.objectContaining({ method: "POST" })
    );
    expect(result).toEqual({ deleted: true });
  });

  it("addGroupAdmin PUTs the target user id", async () => {
    const { groupsClient } = loadGroupsClient();
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    await groupsClient.addGroupAdmin("g1", "user-2");

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/groups/g1/admin"),
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({ userId: "user-2" }),
      })
    );
  });

  it("removeGroupAdmin surfaces the backend error message", async () => {
    const { groupsClient } = loadGroupsClient();
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: "Cannot remove sole admin" }),
    });

    await expect(
      groupsClient.removeGroupAdmin("g1", "user-2")
    ).rejects.toThrow("Failed to remove group admin. Please try again later.");
  });
});

describe("getGroupLeaderboard", () => {
  it("caches the leaderboard per group after the first fetch", async () => {
    const { groupsClient } = loadGroupsClient();
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => ({ leaderboard: [{ displayName: "josh", balance: 900 }] }),
    });

    const first = await groupsClient.getGroupLeaderboard("g1");
    const second = await groupsClient.getGroupLeaderboard("g1");

    expect(first).toEqual([{ displayName: "josh", balance: 900 }]);
    expect(second).toEqual(first);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});
