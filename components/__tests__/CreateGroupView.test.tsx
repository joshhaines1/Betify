import React from "react";
import { Alert } from "react-native";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import * as groups_service from "@/clients/groups-client";
import { CreateGroupView } from "../CreateGroupView";

jest.mock("@/clients/groups-client");

beforeEach(() => {
  jest.spyOn(Alert, "alert").mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
  (groups_service.createGroup as jest.Mock).mockReset();
});

describe("CreateGroupView", () => {
  it("shows the password field only for private groups", () => {
    const { getByText, queryByPlaceholderText } = render(
      <CreateGroupView setModalVisible={jest.fn()} fetchGroups={jest.fn()} />
    );

    expect(queryByPlaceholderText("Enter a password")).toBeNull();
    fireEvent.press(getByText("PRIVATE"));
    expect(queryByPlaceholderText("Enter a password")).toBeTruthy();
  });

  it("does not submit when the group name is empty", async () => {
    const { getByText } = render(
      <CreateGroupView setModalVisible={jest.fn()} fetchGroups={jest.fn()} />
    );

    fireEvent.press(getByText("CREATE"));

    await waitFor(() => {
      expect(groups_service.createGroup).not.toHaveBeenCalled();
    });
  });

  it("does not submit a private group without a password", async () => {
    const { getByText, getByPlaceholderText } = render(
      <CreateGroupView setModalVisible={jest.fn()} fetchGroups={jest.fn()} />
    );

    fireEvent.changeText(getByPlaceholderText("Enter a name"), "My Group");
    fireEvent.press(getByText("PRIVATE"));
    fireEvent.press(getByText("CREATE"));

    await waitFor(() => {
      expect(groups_service.createGroup).not.toHaveBeenCalled();
    });
  });

  it("creates a public group, refetches groups, and closes the modal", async () => {
    (groups_service.createGroup as jest.Mock).mockResolvedValueOnce({ id: "g1" });
    const fetchGroups = jest.fn();
    const setModalVisible = jest.fn();

    const { getByText, getByPlaceholderText } = render(
      <CreateGroupView setModalVisible={setModalVisible} fetchGroups={fetchGroups} />
    );

    fireEvent.changeText(getByPlaceholderText("Enter a name"), "My Group");
    fireEvent.press(getByText("CREATE"));

    await waitFor(() => {
      expect(groups_service.createGroup).toHaveBeenCalledWith(
        "My Group",
        "Public",
        "1000",
        ""
      );
    });
    expect(fetchGroups).toHaveBeenCalledWith(true);
    expect(setModalVisible).toHaveBeenCalledWith(false);
  });

  it("shows an alert and keeps the modal open when creation fails", async () => {
    (groups_service.createGroup as jest.Mock).mockRejectedValueOnce(new Error("boom"));
    const setModalVisible = jest.fn();

    const { getByText, getByPlaceholderText } = render(
      <CreateGroupView setModalVisible={setModalVisible} fetchGroups={jest.fn()} />
    );

    fireEvent.changeText(getByPlaceholderText("Enter a name"), "My Group");
    fireEvent.press(getByText("CREATE"));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith("Error", "Failed to create group.");
    });
    expect(setModalVisible).not.toHaveBeenCalled();
  });
});
