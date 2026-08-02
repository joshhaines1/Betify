import React from "react";
import { render } from "@testing-library/react-native";
import Leaderboard from "../Leaderboard";

describe("Leaderboard", () => {
  it("sorts entries by balance descending", () => {
    const { getAllByText } = render(
      <Leaderboard
        data={[
          { displayName: "low", balance: 100 },
          { displayName: "high", balance: 5000 },
          { displayName: "mid", balance: 1000 },
        ]}
      />
    );

    const names = getAllByText(/^(low|high|mid)$/).map((n) => n.props.children);
    expect(names).toEqual(["high", "mid", "low"]);
  });

  it("marks the top entry as LEADER", () => {
    const { getByText } = render(
      <Leaderboard
        data={[
          { displayName: "champ", balance: 5000 },
          { displayName: "runnerup", balance: 1000 },
        ]}
      />
    );

    expect(getByText("LEADER")).toBeTruthy();
  });

  it("formats balances under 9999 as plain numbers", () => {
    const { getByText } = render(
      <Leaderboard data={[{ displayName: "player", balance: 500 }]} />
    );
    expect(getByText("500")).toBeTruthy();
  });

  it("formats balances in the thousands with a k suffix", () => {
    const { getByText } = render(
      <Leaderboard data={[{ displayName: "player", balance: 15000 }]} />
    );
    expect(getByText("15.0k")).toBeTruthy();
  });

  it("formats balances in the millions with an M suffix", () => {
    const { getByText } = render(
      <Leaderboard data={[{ displayName: "player", balance: 2500000 }]} />
    );
    expect(getByText("2.5M")).toBeTruthy();
  });

  it("formats balances in the billions with a B suffix", () => {
    const { getByText } = render(
      <Leaderboard data={[{ displayName: "player", balance: 3200000000 }]} />
    );
    expect(getByText("3.2B")).toBeTruthy();
  });

  it("shows the player count in the subheader", () => {
    const { getByText } = render(
      <Leaderboard
        data={[
          { displayName: "a", balance: 1 },
          { displayName: "b", balance: 2 },
        ]}
      />
    );
    expect(getByText("2 players ranked")).toBeTruthy();
  });

  it("renders an empty state with zero players", () => {
    const { getByText } = render(<Leaderboard data={[]} />);
    expect(getByText("0 players ranked")).toBeTruthy();
  });
});
