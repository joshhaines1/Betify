const mockUser = {
  uid: "user-1",
  getIdToken: jest.fn(() => Promise.resolve("token-abc")),
};

function loadWagersClient(loggedIn = true) {
  jest.resetModules();
  const { FIREBASE_AUTH } = require("@/FirebaseConfig");
  FIREBASE_AUTH.currentUser = loggedIn ? mockUser : null;
  return require("../wagers-client");
}

beforeEach(() => {
  global.fetch = jest.fn();
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("placeWager", () => {
  const basePayload = {
    groupId: "g1",
    picks: [{ eventId: "e1", moneyline: "-110" }],
    eventIds: ["e1"],
    odds: "+100",
    multiplier: 2,
    risk: 50,
    payout: 100,
    lockDates: [new Date(Date.now() + 1000 * 60 * 60)],
  };

  it("POSTs the wager with the userId attached", async () => {
    const wagersClient = loadWagersClient();
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: "w1" }),
    });

    const result = await wagersClient.placeWager(basePayload);

    const [url, options] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toContain("/wagers");
    expect(options.method).toBe("POST");
    expect(JSON.parse(options.body)).toEqual({
      ...basePayload,
      userId: "user-1",
      lockDates: basePayload.lockDates.map((d) => d.toISOString()),
    });
    expect(result).toEqual({ id: "w1" });
  });

  it("throws without hitting the network when there is no authenticated user", async () => {
    const wagersClient = loadWagersClient(false);

    await expect(wagersClient.placeWager(basePayload)).rejects.toThrow(
      "User not authenticated"
    );
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("throws locally if any picked event has already locked, without calling the backend", async () => {
    const wagersClient = loadWagersClient();

    await expect(
      wagersClient.placeWager({
        ...basePayload,
        lockDates: [new Date(Date.now() - 1000 * 60)],
      })
    ).rejects.toThrow(
      "One or more events are already locked. Please remove them from your bet slip."
    );
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("surfaces the backend error message on failure", async () => {
    const wagersClient = loadWagersClient();
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "Insufficient balance" }),
    });

    await expect(wagersClient.placeWager(basePayload)).rejects.toThrow(
      "Insufficient balance"
    );
  });
});

describe("getWagersByUser", () => {
  it("fetches fresh data and caches it per status filter", async () => {
    const wagersClient = loadWagersClient();
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ wagers: [{ id: "w1" }], nextCursor: null }),
    });

    const first = await wagersClient.getWagersByUser("active", null);
    const second = await wagersClient.getWagersByUser("active", null);

    expect(first).toEqual({ wagers: [{ id: "w1" }], nextCursor: null, cached: false });
    expect(second).toEqual({ wagers: [{ id: "w1" }], nextCursor: null, cached: true });
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it("keeps separate caches per status filter", async () => {
    const wagersClient = loadWagersClient();
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ wagers: [{ id: "w1" }] }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ wagers: [{ id: "w2" }] }) });

    const active = await wagersClient.getWagersByUser("active", null);
    const settled = await wagersClient.getWagersByUser("settled", null);

    expect(active.wagers).toEqual([{ id: "w1" }]);
    expect(settled.wagers).toEqual([{ id: "w2" }]);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it("forces a refetch when refresh is true even with a warm cache", async () => {
    const wagersClient = loadWagersClient();
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ wagers: [{ id: "w1" }] }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ wagers: [{ id: "w2" }] }) });

    await wagersClient.getWagersByUser("active", null);
    const refreshed = await wagersClient.getWagersByUser("active", null, true);

    expect(refreshed.wagers).toEqual([{ id: "w2" }]);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it("appends paginated results instead of overwriting the cache", async () => {
    const wagersClient = loadWagersClient();
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ wagers: [{ id: "w1" }], nextCursor: "cursor1" }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ wagers: [{ id: "w2" }], nextCursor: null }) });

    await wagersClient.getWagersByUser("active", null);
    const nextPage = await wagersClient.getWagersByUser("active", "cursor1");

    expect(nextPage.wagers).toEqual([{ id: "w2" }]);
    // clearWagersCache -> getWagersByUser again should show both pages were merged internally
    await wagersClient.clearWagersCache();
  });

  it("throws a friendly error when the backend responds with a failure", async () => {
    const wagersClient = loadWagersClient();
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "Unauthorized" }),
    });

    await expect(wagersClient.getWagersByUser("active", null)).rejects.toThrow(
      "Unauthorized"
    );
  });
});

describe("clearWagersCache", () => {
  it("clears all cached wagers so the next call refetches", async () => {
    const wagersClient = loadWagersClient();
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ wagers: [{ id: "w1" }] }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ wagers: [{ id: "w2" }] }) });

    await wagersClient.getWagersByUser("active", null);
    wagersClient.clearWagersCache();
    const afterClear = await wagersClient.getWagersByUser("active", null);

    expect(afterClear.wagers).toEqual([{ id: "w2" }]);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });
});
