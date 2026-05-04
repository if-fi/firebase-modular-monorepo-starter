export * from "@starter/common";

export type StayStatus = "pending" | "confirmed" | "cancelled" | "expired";

export type StayDoc = {
  stayId: string;
  uid: string;
  petName: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  status: StayStatus;
  createdAt: FirebaseFirestore.Timestamp | FirebaseFirestore.FieldValue;
  updatedAt: FirebaseFirestore.Timestamp | FirebaseFirestore.FieldValue;
  expiresAt: FirebaseFirestore.Timestamp;
};
