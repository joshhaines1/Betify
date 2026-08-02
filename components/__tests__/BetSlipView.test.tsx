import React from "react";
import { Alert } from "react-native";
import { render, fireEvent } from "@testing-library/react-native";
import { oddsToMultiplier } from "@/utils/odds";
import { BetSlipView } from "../BetSlipView";

beforeEach(() => {
  jest.spyOn(Alert, "alert").mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

function renderBetSlip(overrides: Partial<React.ComponentProps<typeof BetSlipView>> = {}) {
  const props = {
    setModalVisible: jest.fn(),
    fetchGroups: jest.fn(),
    numberOfPicks: 1,
    odds: "+150",
    oddsToMultiplier,
    balance: 500,
    placeBets: jest.fn(),
    setWager: jest.fn(),
    wager: 100,
    ...overrides,
  };
  const utils = render(<BetSlipView {...props} />);
  return { ...utils, props };
}

describe("BetSlipView payout calculation", () => {
  it("computes the payout from the wager and the odds multiplier", () => {
    const { getByText } = renderBetSlip({ wager: 100, odds: "+150" });
    // oddsToMultiplier(150) === 2.5 -> round(100 * 2.5) === 250
    expect(getByText("250")).toBeTruthy();
  });

  it("recomputes for negative odds", () => {
    const { getByText } = renderBetSlip({ wager: 100, odds: "-150" });
    // oddsToMultiplier(-150) === 1.67 -> round(100 * 1.67) === 167
    expect(getByText("167")).toBeTruthy();
  });
});

describe("BetSlipView submission", () => {
  it("does nothing when the wager is zero", () => {
    const placeBets = jest.fn();
    const setModalVisible = jest.fn();
    const { getByText } = renderBetSlip({ wager: 0, placeBets, setModalVisible });

    fireEvent.press(getByText("PLACE BETS"));

    expect(placeBets).not.toHaveBeenCalled();
    expect(setModalVisible).not.toHaveBeenCalled();
  });

  it("blocks the bet and alerts when the wager exceeds the balance", () => {
    const placeBets = jest.fn();
    const { getByText } = renderBetSlip({ wager: 600, balance: 500, placeBets });

    fireEvent.press(getByText("PLACE BETS"));

    expect(Alert.alert).toHaveBeenCalledWith(
      "Insufficient Balance",
      "You do not have enough currency to place this bet."
    );
    expect(placeBets).not.toHaveBeenCalled();
  });

  it("places the bet and closes the modal when the wager is valid", () => {
    const placeBets = jest.fn();
    const setModalVisible = jest.fn();
    const { getByText } = renderBetSlip({ wager: 100, balance: 500, placeBets, setModalVisible });

    fireEvent.press(getByText("PLACE BETS"));

    expect(placeBets).toHaveBeenCalled();
    expect(setModalVisible).toHaveBeenCalledWith(false);
  });

  it("allows a wager exactly equal to the balance", () => {
    const placeBets = jest.fn();
    const { getByText } = renderBetSlip({ wager: 500, balance: 500, placeBets });

    fireEvent.press(getByText("PLACE BETS"));

    expect(placeBets).toHaveBeenCalled();
    expect(Alert.alert).not.toHaveBeenCalled();
  });

  it("closes the modal without placing a bet when cancelled", () => {
    const placeBets = jest.fn();
    const setModalVisible = jest.fn();
    const { getByText } = renderBetSlip({ placeBets, setModalVisible });

    fireEvent.press(getByText("CANCEL"));

    expect(setModalVisible).toHaveBeenCalledWith(false);
    expect(placeBets).not.toHaveBeenCalled();
  });
});
