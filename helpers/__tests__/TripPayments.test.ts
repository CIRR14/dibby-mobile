import {
  applyTripPaymentToTrip,
  buildTripPaymentStatus,
  revertTripPaymentFromTrip,
} from "../DibbyLogic";
import {
  DibbyParticipant,
  DibbyPaymentStatus,
  DibbyTrip,
} from "../../constants/DibbyTypes";

const makeParticipant = (
  uid: string,
  name: string,
  owed: number,
): DibbyParticipant => ({
  uid,
  name,
  username: name.toLowerCase(),
  owed,
  amountPaid: 0,
  color: "#999999",
  photoURL: null,
});

const makeTrip = (participants: DibbyParticipant[]): DibbyTrip => ({
  id: "trip-1",
  title: "Trip",
  description: "",
  amount: 0,
  createdBy: participants[0]?.uid || "owner-1",
  dateCreated: {} as any,
  dateUpdated: {} as any,
  perPersonAverage: 0,
  expenses: [],
  participants,
  completed: false,
});

describe("buildTripPaymentStatus", () => {
  it("marks a payment as paid when the paid amount covers the amount", () => {
    expect(buildTripPaymentStatus(100, 100)).toBe(DibbyPaymentStatus.PAID);
  });

  it("marks a payment as partial when the paid amount is below the amount", () => {
    expect(buildTripPaymentStatus(100, 25)).toBe(DibbyPaymentStatus.PARTIAL);
  });
});

describe("applyTripPaymentToTrip", () => {
  it("moves owed from debtor to creditor without changing unrelated participants", () => {
    const debtor = makeParticipant("debtor-1", "Debtor", -500);
    const creditor = makeParticipant("creditor-1", "Creditor", 500);
    const unrelated = makeParticipant("other-1", "Other", 0);
    const trip = makeTrip([debtor, creditor, unrelated]);

    const updatedTrip = applyTripPaymentToTrip(trip, {
      fromUid: debtor.uid,
      toUid: creditor.uid,
      amountPaid: 125,
    });

    expect(
      updatedTrip.participants.find((p) => p.uid === debtor.uid)?.owed,
    ).toBe(-375);
    expect(
      updatedTrip.participants.find((p) => p.uid === creditor.uid)?.owed,
    ).toBe(375);
    expect(
      updatedTrip.participants.find((p) => p.uid === unrelated.uid),
    ).toEqual(unrelated);
  });

  it("rejects non-positive payment amounts", () => {
    const debtor = makeParticipant("debtor-1", "Debtor", -500);
    const creditor = makeParticipant("creditor-1", "Creditor", 500);
    const trip = makeTrip([debtor, creditor]);

    expect(() =>
      applyTripPaymentToTrip(trip, {
        fromUid: debtor.uid,
        toUid: creditor.uid,
        amountPaid: 0,
      }),
    ).toThrow("greater than zero");
  });

  it("rejects identical payer and recipient", () => {
    const participant = makeParticipant("user-1", "User", 100);
    const trip = makeTrip([participant]);

    expect(() =>
      applyTripPaymentToTrip(trip, {
        fromUid: participant.uid,
        toUid: participant.uid,
        amountPaid: 10,
      }),
    ).toThrow("participants must be different");
  });

  it("rejects payments larger than the open debtor/creditor balance", () => {
    const debtor = makeParticipant("debtor-1", "Debtor", -120);
    const creditor = makeParticipant("creditor-1", "Creditor", 120);
    const trip = makeTrip([debtor, creditor]);

    expect(() =>
      applyTripPaymentToTrip(trip, {
        fromUid: debtor.uid,
        toUid: creditor.uid,
        amountPaid: 121,
      }),
    ).toThrow("exceeds the current open balance");
  });

  it("rejects payments when payer is not currently owing", () => {
    const payer = makeParticipant("payer-1", "Payer", 100);
    const recipient = makeParticipant("recipient-1", "Recipient", -100);
    const trip = makeTrip([payer, recipient]);

    expect(() =>
      applyTripPaymentToTrip(trip, {
        fromUid: payer.uid,
        toUid: recipient.uid,
        amountPaid: 50,
      }),
    ).toThrow("does not currently owe");
  });

  it("reverts a recorded payment even when payer no longer owes", () => {
    const payer = makeParticipant("payer-1", "Payer", 10);
    const payee = makeParticipant("payee-1", "Payee", -10);
    const trip = makeTrip([payer, payee]);

    const updatedTrip = revertTripPaymentFromTrip(trip, {
      fromUid: payer.uid,
      toUid: payee.uid,
      amountPaid: 10,
    });

    expect(
      updatedTrip.participants.find((p) => p.uid === payer.uid)?.owed,
    ).toBe(0);
    expect(
      updatedTrip.participants.find((p) => p.uid === payee.uid)?.owed,
    ).toBe(0);
  });
});
