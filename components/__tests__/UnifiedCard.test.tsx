import React from "react";
import { Alert } from "react-native";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { updateEvent } from "@/clients/events-client";
import { UnifiedCard } from "../UnifiedCard";

jest.mock("@/clients/events-client");

function pressAlertButton(text: string) {
  const alertMock = Alert.alert as jest.Mock;
  const lastCall = alertMock.mock.calls[alertMock.mock.calls.length - 1];
  const buttons = lastCall[2] as Array<{ text: string; onPress?: () => void }>;
  buttons.find((b) => b.text === text)?.onPress?.();
}

const futureLockDate = { _seconds: Math.floor(Date.now() / 1000) + 100000 };

const baseProps = {
  eventId: "e1",
  groupName: "Test Group",
  lockDate: futureLockDate,
  isAdmin: false,
  acceptingWagers: true,
  betSlip: [] as Map<string, string>[],
  setBetSlip: jest.fn(),
  setBetSlipOdds: jest.fn(),
  onEventSettled: jest.fn(),
};

beforeEach(() => {
  jest.spyOn(Alert, "alert").mockImplementation(() => {});
  (updateEvent as jest.Mock).mockResolvedValue({});
});

afterEach(() => {
  jest.restoreAllMocks();
  (updateEvent as jest.Mock).mockReset();
});

describe("basic card betting", () => {
  it("adds a pick to the bet slip when an odds button is pressed", () => {
    const setBetSlip = jest.fn();
    const setBetSlipOdds = jest.fn();
    const { getByText } = render(
      <UnifiedCard
        {...baseProps}
        type="basic"
        team1="Lakers"
        team2="Celtics"
        moneylineOdds1="-110"
        moneylineOdds2="+120"
        setBetSlip={setBetSlip}
        setBetSlipOdds={setBetSlipOdds}
      />
    );

    fireEvent.press(getByText("-110"));

    expect(setBetSlip).toHaveBeenCalled();
    const nextSlip = setBetSlip.mock.calls[0][0]([]);
    expect(nextSlip).toHaveLength(1);
    expect(nextSlip[0].get("e1")).toBe("moneyline1");
    expect(nextSlip[0].get("name")).toBe("Lakers");

    expect(setBetSlipOdds).toHaveBeenCalled();
    const nextOdds = setBetSlipOdds.mock.calls[0][0](new Map());
    expect(nextOdds.get("e1")).toBe("-110");
  });

  it("removes the pick when the same odds button is pressed again", () => {
    const existingMap = new Map([["e1", "moneyline1"]]);
    const setBetSlip = jest.fn();
    const { getByText } = render(
      <UnifiedCard
        {...baseProps}
        type="basic"
        team1="Lakers"
        team2="Celtics"
        moneylineOdds1="-110"
        moneylineOdds2="+120"
        betSlip={[existingMap]}
        setBetSlip={setBetSlip}
      />
    );

    fireEvent.press(getByText("-110"));

    const nextSlip = setBetSlip.mock.calls[0][0]([existingMap]);
    expect(nextSlip).toHaveLength(0);
  });

  it("does not modify the bet slip once the event is closed", () => {
    const setBetSlip = jest.fn();
    const { getByText } = render(
      <UnifiedCard
        {...baseProps}
        type="basic"
        team1="Lakers"
        team2="Celtics"
        moneylineOdds1="-110"
        moneylineOdds2="+120"
        acceptingWagers={false}
        setBetSlip={setBetSlip}
      />
    );

    fireEvent.press(getByText("-110"));

    expect(setBetSlip).not.toHaveBeenCalled();
  });
});

describe("admin settle flow (basic card)", () => {
  it("settles the event with the selected pick when confirmed", async () => {
    const onEventSettled = jest.fn();
    const existingMap = new Map([
      ["e1", "moneyline1"],
      ["eventId", "e1"],
    ]);

    const { getByText } = render(
      <UnifiedCard
        {...baseProps}
        type="basic"
        team1="Lakers"
        team2="Celtics"
        moneylineOdds1="-110"
        moneylineOdds2="+120"
        isAdmin={true}
        betSlip={[existingMap]}
        onEventSettled={onEventSettled}
      />
    );

    fireEvent.press(getByText("SETTLE"));
    pressAlertButton("Yes");

    await waitFor(() =>
      expect(updateEvent).toHaveBeenCalledWith({
        eventId: "e1",
        status: "settled",
        results: ["moneyline1"],
        acceptingWagers: false,
      })
    );
    expect(onEventSettled).toHaveBeenCalledWith("e1", true);
  });

  it("does nothing when the settle button is a locked no-op (closed, nothing selected)", () => {
    const { getByText } = render(
      <UnifiedCard
        {...baseProps}
        type="basic"
        team1="Lakers"
        team2="Celtics"
        moneylineOdds1="-110"
        moneylineOdds2="+120"
        isAdmin={true}
        acceptingWagers={false}
      />
    );

    fireEvent.press(getByText("LOCKED"));

    expect(Alert.alert).not.toHaveBeenCalled();
    expect(updateEvent).not.toHaveBeenCalled();
  });
});

describe("admin push flow (prop card)", () => {
  it("settles with a push/tie when confirmed", async () => {
    const onEventSettled = jest.fn();
    const { getByText } = render(
      <UnifiedCard
        {...baseProps}
        type="prop"
        name="Player Points"
        description="Over/Under 20.5"
        overUnder="20.5"
        overOdds="-110"
        underOdds="-110"
        isAdmin={true}
        acceptingWagers={false}
        onEventSettled={onEventSettled}
      />
    );

    fireEvent.press(getByText("PUSH"));
    pressAlertButton("Yes");

    await waitFor(() =>
      expect(updateEvent).toHaveBeenCalledWith({
        eventId: "e1",
        status: "settled",
        results: ["push"],
        acceptingWagers: false,
      })
    );
    expect(onEventSettled).toHaveBeenCalledWith("e1", true);
  });
});

describe("single outcome settle/lock", () => {
  const singleOutcomeProps = {
    type: "single outcome",
    name: "Will it rain",
    description: "Weather prop",
    comparisonType: "Yes/No",
    odds: "+150",
    isAdmin: true,
  };

  it("settles as a hit", async () => {
    const onEventSettled = jest.fn();
    const { getByText } = render(
      <UnifiedCard {...baseProps} {...singleOutcomeProps} onEventSettled={onEventSettled} />
    );

    fireEvent.press(getByText("SETTLE"));
    pressAlertButton("HIT");

    await waitFor(() =>
      expect(updateEvent).toHaveBeenCalledWith({
        eventId: "e1",
        status: "settled",
        results: ["hit"],
        acceptingWagers: false,
      })
    );
    expect(onEventSettled).toHaveBeenCalledWith("e1", true);
  });

  it("settles as a miss with empty results", async () => {
    const { getByText } = render(<UnifiedCard {...baseProps} {...singleOutcomeProps} />);

    fireEvent.press(getByText("SETTLE"));
    pressAlertButton("MISS");

    await waitFor(() =>
      expect(updateEvent).toHaveBeenCalledWith({
        eventId: "e1",
        status: "settled",
        results: [],
        acceptingWagers: false,
      })
    );
  });

  it("locks the event when confirmed", async () => {
    const { getByText } = render(<UnifiedCard {...baseProps} {...singleOutcomeProps} />);

    fireEvent.press(getByText("LOCK"));
    pressAlertButton("Yes");

    await waitFor(() =>
      expect(updateEvent).toHaveBeenCalledWith({
        eventId: "e1",
        status: "closed",
        results: [],
        acceptingWagers: false,
      })
    );
  });
});

describe("event card spread labels and selection", () => {
  const eventProps = {
    type: "event",
    team1: "Lakers",
    team2: "Celtics",
    moneylineOdds1: "-200",
    moneylineOdds2: "+170",
    spread: "4.5",
    spreadOdds1: "-110",
    spreadOdds2: "-110",
    overUnder: "220.5",
    overOdds: "-105",
    underOdds: "-115",
  };

  it("gives the favorite a negative spread and the underdog a positive one", () => {
    const { getByText } = render(<UnifiedCard {...baseProps} {...eventProps} />);
    expect(getByText("-4.5")).toBeTruthy();
    expect(getByText("+4.5")).toBeTruthy();
  });

  it("adds a moneyline pick under an event-scoped key", () => {
    const setBetSlip = jest.fn();
    const { getByText } = render(
      <UnifiedCard {...baseProps} {...eventProps} setBetSlip={setBetSlip} />
    );

    fireEvent.press(getByText("-200"));

    const nextSlip = setBetSlip.mock.calls[0][0]([]);
    expect(nextSlip[0].get("e1-moneyline")).toBe("moneyline1");
  });
});
