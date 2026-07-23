import React, { useEffect, useState } from 'react';
import { StyleSheet, TouchableOpacity, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, View } from 'react-native';
import Colors from '@/assets/styles/colors';

export function BetSlipView({setModalVisible, fetchGroups, numberOfPicks, odds, oddsToMultiplier, balance, placeBets, setWager, wager}) {

    const [multiplier, setMultiplier] = useState(1);

    useEffect(() => {
        resetFields();
        setMultiplier(oddsToMultiplier(odds));
      }, []);

      const submitBets = async () => {
        const numericWager = Number(wager);
        const numericBalance = Number(balance);

        if (!Number.isFinite(numericWager) || numericWager <= 0) {
            return;
        }

        if (numericWager <= numericBalance) {
            placeBets();
            setModalVisible(false);
        } else {
            Alert.alert("Insufficient Balance", "You do not have enough currency to place this bet.")
        }
      };

      const resetFields = () => {
        setWager(0);
      };

      const cancelBetSlip = () => {
        setModalVisible(false);
      };

    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalContainer}
      >
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Bet Slip</Text>
          <Text style={styles.modalSubtitle}>Review your picks and place your wager</Text>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.infoLabel}>PICKS</Text>
              <Text style={styles.statValue}>{numberOfPicks}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.infoLabel}>ODDS</Text>
              <Text style={styles.statValue}>{odds}</Text>
            </View>
          </View>

          <View style={styles.riskPayoutRow}>
            <View style={{flex: 1, marginRight: 15}}>
              <Text style={styles.infoLabel}>RISK</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: 100"
                placeholderTextColor="#555"
                keyboardType="numeric"
                value={String(wager)}
                onChangeText={setWager}
              />
            </View>
            <View style={{flex: 1}}>
              <Text style={styles.infoLabel}>PAYOUT</Text>
              <Text style={[styles.input, styles.payoutValue]}>
                {Math.round(Number(wager) * multiplier)}
              </Text>
            </View>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.cancelButton} onPress={cancelBetSlip}>
              <Text style={styles.cancelButtonText}>CANCEL</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.createButton} onPress={submitBets}>
              <Text style={styles.createButtonText}>PLACE BETS</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.85)",
  },
  modalContent: {
    backgroundColor: "#121112",
    width: "90%",
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: "#252B38",
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: Colors.textColor,
    letterSpacing: 0.5,
    marginBottom: 4,
    textAlign: "center",
    textTransform: "uppercase",
  },
  modalSubtitle: {
    fontSize: 13,
    color: "#7A8499",
    textAlign: "center",
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },
  statBox: {
    flex: 1,
    backgroundColor: "#1d1a1c",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#252B38",
    paddingVertical: 12,
    alignItems: "center",
  },
  statValue: {
    fontSize: 18,
    fontWeight: "800",
    color: "#f8f8f8",
    marginTop: 4,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.5,
    color: "#7A8499",
  },
  riskPayoutRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#252B38",
    backgroundColor: "#1d1a1c",
    padding: 14,
    borderRadius: 10,
    color: Colors.textColor,
    fontSize: 18,
    marginTop: 8,
  },
  payoutValue: {
    fontWeight: "800",
    color: "#f8f8f8",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    backgroundColor: "#1d1a1c",
    borderWidth: 1,
    borderColor: "#252B38",
  },
  cancelButtonText: {
    color: "#7A8499",
    fontWeight: "800",
    fontSize: 15,
    letterSpacing: 1,
  },
  createButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    backgroundColor: "#f8f8f8",
  },
  createButtonText: {
    color: "black",
    fontWeight: "800",
    fontSize: 15,
    letterSpacing: 1,
  },
});
