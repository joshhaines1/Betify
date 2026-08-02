import { Alert } from "react-native";
import {
  validOdds,
  validOverUnder,
  validSpread,
  validInt,
  validDate,
} from "../DataValidation";

describe("DataValidation", () => {
  beforeEach(() => {
    jest.spyOn(Alert, "alert").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("validOdds", () => {
    it("accepts the boundary values -100 and +100", () => {
      expect(validOdds("-100")).toBe(true);
      expect(validOdds("100")).toBe(true);
    });

    it("accepts odds further from the boundary", () => {
      expect(validOdds("+150")).toBe(true);
      expect(validOdds("-250")).toBe(true);
    });

    it("rejects odds inside (-100, 100)", () => {
      expect(validOdds("-99")).toBe(false);
      expect(validOdds("99")).toBe(false);
      expect(validOdds("0")).toBe(false);
      expect(Alert.alert).toHaveBeenCalledWith(
        "Invalid Odds",
        expect.any(String)
      );
    });

    it("rejects non-numeric input", () => {
      expect(validOdds("abc")).toBe(false);
      expect(validOdds("")).toBe(false);
    });
  });

  describe("validOverUnder", () => {
    it("accepts integer and decimal numeric strings", () => {
      expect(validOverUnder("45")).toBe(true);
      expect(validOverUnder("45.5")).toBe(true);
    });

    it("rejects non-numeric input", () => {
      expect(validOverUnder("abc")).toBe(false);
      expect(Alert.alert).toHaveBeenCalledWith(
        "Invalid Over / Under",
        expect.any(String)
      );
    });
  });

  describe("validSpread", () => {
    it("accepts a positive spread with differing moneylines", () => {
      expect(validSpread("3.5", "-150", "130")).toBe(true);
    });

    it("rejects a negative spread", () => {
      expect(validSpread("-3.5", "-150", "130")).toBe(false);
      expect(Alert.alert).toHaveBeenCalledWith(
        "Invalid Spread",
        expect.any(String)
      );
    });

    it("rejects non-numeric spread", () => {
      expect(validSpread("abc", "-150", "130")).toBe(false);
    });

    it("rejects equal moneyline odds", () => {
      expect(validSpread("3.5", "-150", "-150")).toBe(false);
      expect(Alert.alert).toHaveBeenCalledWith(
        "Invalid Spread",
        "Moneyline odds must be different to have a spread."
      );
    });

    it("treats numerically-equal moneylines of different types as equal (loose ==)", () => {
      // Documents the current loose-equality behavior of the `==` check.
      expect(validSpread("3.5", "150", 150)).toBe(false);
    });
  });

  describe("validInt", () => {
    it("accepts positive integers, including numeric strings", () => {
      expect(validInt(5)).toBe(true);
      expect(validInt("5")).toBe(true);
    });

    it("rejects zero and negative numbers", () => {
      expect(validInt(0)).toBe(false);
      expect(validInt(-5)).toBe(false);
    });

    it("rejects decimals and non-numeric input", () => {
      expect(validInt(4.5)).toBe(false);
      expect(validInt("abc")).toBe(false);
      expect(Alert.alert).toHaveBeenCalledWith(
        "Invalid Input",
        expect.any(String)
      );
    });
  });

  describe("validDate", () => {
    it("accepts a date in the future", () => {
      const future = new Date(Date.now() + 1000 * 60 * 60);
      expect(validDate(future)).toBe(true);
    });

    it("rejects a date in the past", () => {
      const past = new Date(Date.now() - 1000 * 60 * 60);
      expect(validDate(past)).toBe(false);
      expect(Alert.alert).toHaveBeenCalledWith(
        "Invalid Date",
        "The lock date must be in the future."
      );
    });

    it("rejects the current moment (not strictly in the future)", () => {
      const now = new Date();
      expect(validDate(now)).toBe(false);
    });
  });
});
