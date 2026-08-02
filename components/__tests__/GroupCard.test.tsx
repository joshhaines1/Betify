import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { router } from "expo-router";
import { GroupCard } from "../GroupCard";

afterEach(() => {
  jest.clearAllMocks();
});

describe("GroupCard member count formatting", () => {
  it("shows the raw count under 1000", () => {
    const { getByText } = render(
      <GroupCard
        name="Test Group"
        members={Array(42).fill("uid")}
        adminName="josh"
        admins={[]}
        visibility="Public"
        password=""
        startingCurrency={1000}
        groupId="g1"
        fetchGroups={jest.fn()}
        joined={true}
      />
    );
    expect(getByText("42")).toBeTruthy();
  });

  it("formats thousands with a K suffix", () => {
    const { getByText } = render(
      <GroupCard
        name="Test Group"
        members={Array(2500).fill("uid")}
        adminName="josh"
        admins={[]}
        visibility="Public"
        password=""
        startingCurrency={1000}
        groupId="g1"
        fetchGroups={jest.fn()}
        joined={true}
      />
    );
    expect(getByText("2.5K")).toBeTruthy();
  });

  it("formats millions with an M suffix", () => {
    const { getByText } = render(
      <GroupCard
        name="Test Group"
        members={Array(1500000).fill("uid")}
        adminName="josh"
        admins={[]}
        visibility="Public"
        password=""
        startingCurrency={1000}
        groupId="g1"
        fetchGroups={jest.fn()}
        joined={true}
      />
    );
    expect(getByText("1.5M")).toBeTruthy();
  });

  it("uses singular MEMBER label for exactly one member", () => {
    const { getByText } = render(
      <GroupCard
        name="Solo Group"
        members={["uid1"]}
        adminName="josh"
        admins={[]}
        visibility="Public"
        password=""
        startingCurrency={1000}
        groupId="g1"
        fetchGroups={jest.fn()}
        joined={true}
      />
    );
    expect(getByText("MEMBER")).toBeTruthy();
  });
});

describe("GroupCard press behavior", () => {
  it("navigates to the group screen when already joined", () => {
    const { getByText } = render(
      <GroupCard
        name="Test Group"
        members={["uid1"]}
        adminName="josh"
        admins={["uid1"]}
        visibility="Public"
        password=""
        startingCurrency={1000}
        groupId="g1"
        fetchGroups={jest.fn()}
        joined={true}
      />
    );

    fireEvent.press(getByText("Test Group"));

    expect(router.navigate).toHaveBeenCalledWith({
      pathname: "/group",
      params: { name: "Test Group", groupId: "g1", admins: ["uid1"] },
    });
  });

  it("does not navigate when the group hasn't been joined yet", () => {
    const { getByText } = render(
      <GroupCard
        name="Unjoined Group"
        members={["uid1"]}
        adminName="josh"
        admins={[]}
        visibility="Private"
        password="secret"
        startingCurrency={1000}
        groupId="g2"
        fetchGroups={jest.fn()}
        joined={false}
      />
    );

    fireEvent.press(getByText("Unjoined Group"));

    expect(router.navigate).not.toHaveBeenCalled();
  });
});
