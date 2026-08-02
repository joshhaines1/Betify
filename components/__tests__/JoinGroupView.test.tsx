import React from "react";
import { Alert } from "react-native";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { joinGroup } from "@/clients/groups-client";
import { JoinGroupView } from "../JoinGroupView";

jest.mock("@/clients/groups-client");

beforeEach(() => {
  jest.spyOn(Alert, "alert").mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
  (joinGroup as jest.Mock).mockReset();
});

describe("JoinGroupView", () => {
  it("joins a public group immediately", async () => {
    (joinGroup as jest.Mock).mockResolvedValueOnce({ joined: true });
    const fetchGroups = jest.fn();
    const setModalVisible = jest.fn();

    const { getByText } = render(
      <JoinGroupView
        setModalVisible={setModalVisible}
        fetchGroups={fetchGroups}
        name="Test Group"
        visibility="Public"
        correctPassword=""
        members={["u1"]}
        startingCurrency={1000}
        groupId="g1"
      />
    );

    fireEvent.press(getByText("JOIN"));

    await waitFor(() => expect(joinGroup).toHaveBeenCalledWith("g1"));
    expect(fetchGroups).toHaveBeenCalledWith(true, "all");
    expect(setModalVisible).toHaveBeenCalledWith(false);
  });

  it("blocks joining a private group with the wrong password", async () => {
    const { getByText, getByPlaceholderText } = render(
      <JoinGroupView
        setModalVisible={jest.fn()}
        fetchGroups={jest.fn()}
        name="Private Group"
        visibility="Private"
        correctPassword="secret"
        members={["u1"]}
        startingCurrency={1000}
        groupId="g2"
      />
    );

    fireEvent.changeText(getByPlaceholderText("Enter password"), "wrong");
    fireEvent.press(getByText("JOIN"));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith("Incorrect Password");
    });
    expect(joinGroup).not.toHaveBeenCalled();
  });

  it("joins a private group with the correct password", async () => {
    (joinGroup as jest.Mock).mockResolvedValueOnce({ joined: true });
    const { getByText, getByPlaceholderText } = render(
      <JoinGroupView
        setModalVisible={jest.fn()}
        fetchGroups={jest.fn()}
        name="Private Group"
        visibility="Private"
        correctPassword="secret"
        members={["u1"]}
        startingCurrency={1000}
        groupId="g2"
      />
    );

    fireEvent.changeText(getByPlaceholderText("Enter password"), "secret");
    fireEvent.press(getByText("JOIN"));

    await waitFor(() => expect(joinGroup).toHaveBeenCalledWith("g2"));
  });

  it("shows an error alert when the join request fails", async () => {
    (joinGroup as jest.Mock).mockRejectedValueOnce(new Error("network error"));
    const { getByText } = render(
      <JoinGroupView
        setModalVisible={jest.fn()}
        fetchGroups={jest.fn()}
        name="Test Group"
        visibility="Public"
        correctPassword=""
        members={["u1"]}
        startingCurrency={1000}
        groupId="g1"
      />
    );

    fireEvent.press(getByText("JOIN"));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        "Error",
        "Failed to join group. Please try again later."
      );
    });
  });
});
