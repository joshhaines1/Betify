import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Purchases, {
  PurchasesStoreProduct,
  CustomerInfo,
} from "react-native-purchases";
import Colors from "@/assets/styles/colors";

// ─── Match these to the product IDs you create in App Store Connect ───────────
const PRO_MONTHLY_ID = "pro_monthly";
const PRO_LIFETIME_ID = "pro_lifetime";
const REMOVE_ADS_ID = "remove_ads";

const adIcon = require('@/assets/images/NoAdsIcon.png');

type BillingPeriod = "monthly" | "lifetime";

export default function Shop() {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [purchasingPro, setPurchasingPro] = useState(false);
  const [purchasingRemoveAds, setPurchasingRemoveAds] = useState(false);
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>("monthly");
  const [products, setProducts] = useState<PurchasesStoreProduct[]>([]);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [adsRemoved, setAdsRemoved] = useState(false);
  const [isPro, setIsPro] = useState(false);

  // ── Init RevenueCat & fetch offerings ────────────────────────────────────────
  useEffect(() => {
  const init = async () => {
    try {
      const info = await Purchases.getCustomerInfo();
      setCustomerInfo(info);
      setIsPro(info.entitlements.active["pro"] !== undefined);
      setAdsRemoved(
        info.entitlements.active["remove_ads"] !== undefined ||
          info.entitlements.active["pro"] !== undefined
      );

      // 👇 Fetch directly by product ID instead of offerings
      const fetchedProducts = await Purchases.getProducts([
        PRO_MONTHLY_ID,
        PRO_LIFETIME_ID,
        REMOVE_ADS_ID,
      ]);
      setProducts(fetchedProducts);
    } catch (err) {
      console.error("RevenueCat init error:", err);
    } finally {
      setLoading(false);
    }
  };
  init();
}, []);

  // ── Find a package by product ID ─────────────────────────────────────────────
  const findProduct = (productId: string) =>
  products.find((p) => p.identifier === productId);

// Updated purchase handler — purchase product directly
const handlePurchase = async (productId: string) => {
  const product = findProduct(productId);
  if (!product) {
    Alert.alert("Unavailable", "This product is not available right now.");
    return;
  }
  if (productId === PRO_MONTHLY_ID || productId === PRO_LIFETIME_ID) {
    setPurchasingPro(true);
  } else if (productId === REMOVE_ADS_ID) {
    setPurchasingRemoveAds(true);
  }
  try {
    const { customerInfo: updatedInfo } = await Purchases.purchaseStoreProduct(product);
    setCustomerInfo(updatedInfo);
    setIsPro(updatedInfo.entitlements.active["pro"] !== undefined);
    setAdsRemoved(
      updatedInfo.entitlements.active["remove_ads"] !== undefined ||
        updatedInfo.entitlements.active["pro"] !== undefined
    );
    Alert.alert("Success!", "Your purchase was completed.");
  } catch (err: any) {
    if (!err.userCancelled) {
      Alert.alert("Purchase Failed", err.message);
    }
  } finally {
    setPurchasingPro(false);
    setPurchasingRemoveAds(false);
  }
};

// Updated price helpers
const proPrice = () => {
  const id = billingPeriod === "monthly" ? PRO_MONTHLY_ID : PRO_LIFETIME_ID;
  return findProduct(id)?.priceString ?? (billingPeriod === "monthly" ? "$4.99" : "$14.99");
};

const removeAdsPrice = () =>
  findProduct(REMOVE_ADS_ID)?.priceString ?? "$1.99";

  // ── Restore purchases ────────────────────────────────────────────────────────
  const handleRestore = async () => {
    setPurchasingPro(true);
    setPurchasingRemoveAds(true);
    try {
      const info = await Purchases.restorePurchases();
      setCustomerInfo(info);
      setIsPro(info.entitlements.active["pro"] !== undefined);
      setAdsRemoved(
        info.entitlements.active["remove_ads"] !== undefined ||
          info.entitlements.active["pro"] !== undefined
      );
      Alert.alert("Restored", "Your purchases have been restored.");
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      setPurchasingPro(false);
      setPurchasingRemoveAds(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: 0 }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ── Pro Card ── */}
        <Text style={styles.sectionLabel}>Betify Pro</Text>
        <View style={styles.proCard}>
          <View style={styles.proBadge}>
            <Text style={styles.proBadgeText}>MOST POPULAR</Text>
          </View>

          <Text style={styles.proTitle}>Betify Pro</Text>
          <Text style={styles.proDesc}>Everything you need to dominate your groups</Text>

          {/* Billing toggle */}
          <View style={styles.toggleRow}>
            {(["monthly", "lifetime"] as BillingPeriod[]).map((period) => (
              <TouchableOpacity
                key={period}
                style={[
                  styles.toggleBtn,
                  billingPeriod === period && styles.toggleBtnActive,
                ]}
                onPress={() => setBillingPeriod(period)}
              >
                <Text
                  style={[
                    styles.toggleBtnText,
                    billingPeriod === period && styles.toggleBtnTextActive,
                  ]}
                >
                  {period === "monthly" ? "Monthly" : "Lifetime"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Features */}
          {[
            "Create UNLIMITED Events and Props",
            "Ads Removed FOREVER",
            "Create Advanced Events",
            "Create Single Outcome Events and Props",
          ].map((feature) => (
            <View key={feature} style={styles.featureRow}>
              <View style={styles.checkCircle}>
                <Text style={styles.checkText}>✓</Text>
              </View>
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}

          {/* Price */}
          <View style={styles.priceRow}>
            <Text style={styles.price}>{proPrice()}</Text>
            <Text style={styles.pricePeriod}>
              {billingPeriod === "monthly" ? "/ month" : "One Time Purchase"}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.buyButton, isPro && styles.buyButtonDisabled]}
            onPress={() =>
              handlePurchase(
                billingPeriod === "monthly" ? PRO_MONTHLY_ID : PRO_LIFETIME_ID
              )
            }
            disabled={isPro || purchasingPro || purchasingRemoveAds}
          >
            {purchasingPro ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buyButtonText}>
                {isPro ? "ALREADY PRO" : "START PRO"}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* ── Divider ── */}
        <View style={styles.divider} />

        {/* ── One-Time Purchases ── */}
        <Text style={styles.sectionLabel}>One-Time Purchases</Text>

        <View style={[styles.card, adsRemoved && styles.cardDisabled]}>
          <View style={styles.cardLeft}>
            <View style={styles.iconWrap}>
              <Image
                        source={adIcon}
                        style={styles.logo}
                        resizeMode="contain"
                    /> 
            </View>
            <View>
              <Text style={styles.cardLabel}>Remove Ads</Text>
              <Text style={styles.cardValue}>
                {adsRemoved ? "Already purchased" : "Ad-Free Forever"}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.cardPriceButton, adsRemoved && styles.buyButtonDisabled]}
            onPress={() => handlePurchase(REMOVE_ADS_ID)}
            disabled={adsRemoved || purchasingPro || purchasingRemoveAds}
          >
            <Text style={styles.cardPriceText}>
              {adsRemoved ? "Owned" : purchasingRemoveAds ? (
              <ActivityIndicator color="#fff" />
            ) : removeAdsPrice()}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── Restore ── */}
        <TouchableOpacity onPress={handleRestore} disabled={purchasingPro || purchasingRemoveAds}>
          <Text style={styles.restoreText}>Restore purchases</Text>
        </TouchableOpacity>

        <Text style={styles.legalText}>
          Subscriptions auto-renew unless cancelled at least 24 hours before the end of the
          current period. Manage or cancel anytime in your App Store settings.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 60,
  },
  header: {
    alignItems: "center",
    paddingVertical: 12,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "900",
    color: Colors.textColor,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 13,
    color: "#7A8499",
    textAlign: "center",
    marginBottom: 24,
    letterSpacing: 0.3,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.5,
    color: "#7A8499",
    textTransform: "uppercase",
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  // ── Pro card ────────────────────────────────────────────────────────────────
  proCard: {
    backgroundColor: "#1d1a1c",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ffffff55",
    padding: 20,
    marginBottom: 10,
    shadowColor: "#ffffff",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  proBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#ffffff22",
    borderWidth: 1,
    borderColor: "#ffffff55",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 12,
  },
  proBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 2,
    color: "white",
  },
  proTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#fff",
    marginBottom: 4,
  },
  proDesc: {
    fontSize: 13,
    color: "#7A8499",
    marginBottom: 16,
  },
  toggleRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#252B38",
    backgroundColor: "#121112",
    alignItems: "center",
  },
  toggleBtnActive: {
    borderColor: "#ffffff55",
    backgroundColor: "#ffffff22",
  },
  toggleBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#7A8499",
  },
  toggleBtnTextActive: {
    color: "white",
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  checkCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#ffffff22",
    borderWidth: 1,
    borderColor: "#ffffff55",
    alignItems: "center",
    justifyContent: "center",
  },
  checkText: {
    fontSize: 11,
    fontWeight: "800",
    color: "white",
  },
  featureText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#fff",
  },
  logo: {
    width: '100%',
    height: '100%',
    position: 'relative',
    alignSelf: 'center',
    justifyContent: 'flex-start',
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
    marginTop: 16,
    marginBottom: 14,
  },
  price: {
    fontSize: 32,
    fontWeight: "900",
    color: "#fff",
  },
  pricePeriod: {
    fontSize: 14,
    color: "#7A8499",
  },
  buyButton: {
    backgroundColor: "#ff496b",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  buyButtonDisabled: {
    backgroundColor: "#3a3a3a",
  },
  buyButtonText: {
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 2,
    color: "#fff",
  },
  // ── Divider ─────────────────────────────────────────────────────────────────
  divider: {
    height: 1,
    backgroundColor: "#1a1818",
    marginVertical: 8,
  },
  // ── One-time purchase cards ──────────────────────────────────────────────────
  card: {
    backgroundColor: "#1d1a1c",
    borderRadius: 12,
    marginBottom: 10,
    paddingVertical: 18,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "#252B38",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardDisabled: {
    opacity: 0.6,
  },
  cardLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#252B38",
    alignItems: "center",
    justifyContent: "center",
  },
  iconText: {
    fontSize: 16,
    color: "#7A8499",
    fontWeight: "700",
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.5,
    color: "#7A8499",
    textTransform: "uppercase",
    marginBottom: 3,
  },
  cardValue: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
  },
  cardPriceButton: {
    backgroundColor: "#ff496b",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  cardPriceText: {
    fontSize: 15,
    fontWeight: "900",
    color: "#fff",
  },
  // ── Footer ───────────────────────────────────────────────────────────────────
  restoreText: {
    textAlign: "center",
    fontSize: 13,
    color: "#7A8499",
    textDecorationLine: "underline",
    marginTop: 8,
    marginBottom: 16,
  },
  legalText: {
    fontSize: 11,
    color: "#444",
    textAlign: "center",
    lineHeight: 16,
    paddingHorizontal: 8,
  },
});