from firebase_functions import firestore_fn
from firebase_admin import initialize_app, firestore

# Initialize Firebase Admin SDK
initialize_app()
db = firestore.client()

@firestore_fn.on_document_updated(document="events/{eventId}")
def settle_event(event: firestore_fn.Event[firestore_fn.Change]) -> None:
    print("Starting settle_event function...")

    before = event.data.before
    after = event.data.after

    if not before or not after:
        print("'before' or 'after' snapshot is null.")
        return

    before_status = before.get("status")
    after_status = after.get("status")

    # Only proceed if status changed to "settled"
    if before_status == "settled" or after_status != "settled":
        print("Event was already settled or status didn't change to 'settled'.")
        return

    outcome = after.get("result")
    if not outcome:
        print("No result found on settled event.")
        return

    settled_event_id = event.params.get("eventId")
    print(f"Settled Event ID: {settled_event_id} with outcome: {outcome}")

    # Fetch all bets
    bets = db.collection("wagers").where("eventIds", "array_contains", settled_event_id).get()


    batch = db.batch()

    for bet_doc in bets:
        bet = bet_doc.to_dict()
        picks = bet.get("picks", [])

        if not picks:
            print(f"Skipping bet {bet_doc.id} — no picks.")
            continue

        # Find pick for this event
        matching_pick = next((pick for pick in picks if pick.get("eventId") == settled_event_id), None)

        if not matching_pick:
            print(f"Skipping bet {bet_doc.id} — no matching pick for this event.")
            continue

        betType = after.get("type")
        selected_outcome = matching_pick.get(settled_event_id)
        if (betType != "MSO" and selected_outcome != outcome) or (betType == "MSO" and selected_outcome not in outcome):
            print(f"Bet {bet_doc.id} lost — pick outcome {selected_outcome} != {outcome}")

            # Mark bet as settled (lost)
            batch.update(bet_doc.reference, {
                "status": "settled",
                "payout": 0
            })

            # Optionally deduct balance here if desired
            # user_ref = db.collection("users").document(bet["userId"])
            # batch.update(user_ref, {
            #     "balance": firestore.Increment(-bet.get("risk", 0))
            # })

            continue  # No need to check other picks — one wrong loses parlay

        print(f"Bet {bet_doc.id} has a correct pick for this event. Checking remaining picks...")

        # Now check if all picks are correct and all their events are settled
        all_picks_correct = True

        for pick in picks:
            pick_event_id = pick.get("eventId")
            expected_outcome = pick.get(pick_event_id)

            if not pick_event_id or not expected_outcome:
                print(f"Incomplete pick data in bet {bet_doc.id}, skipping pick.")
                all_picks_correct = False
                break

            event_doc = db.collection("events").document(pick_event_id).get()
            if not event_doc.exists:
                print(f"Event {pick_event_id} not found.")
                all_picks_correct = False
                break

            event_data = event_doc.to_dict()
            if event_data.get("status") != "settled":
                print(f"Event {pick_event_id} not yet settled.")
                all_picks_correct = False
                break

            '''
            if (betType != "MSO" and event_data.get("result") != expected_outcome) or (betType == "MSO" and event_data.get("result") not in expected_outcome):
                print(f"Pick for event {pick_event_id} was incorrect.")
                all_picks_correct = False
                break
            '''

        if all_picks_correct:
            print(f"Bet {bet_doc.id} is a winner.")

            amount = bet.get("risk", 0)
            multiplier = bet.get("multiplier", 1)
            winnings = int(amount) * multiplier

            #user_ref = db.collection("users").document(bet["userId"])
            group_ref = db.collection("groups").document(bet["groupId"])
            user_ref = group_ref.collection("members").document(bet["userId"])

            batch.update(user_ref, {
                "balance": firestore.Increment(int(winnings))
            })

            batch.update(bet_doc.reference, {
                "status": "settled"
            })

        else:
            print(f"Bet {bet_doc.id} not fully settled or correct — waiting on other events.")

    batch.commit()
    print("Finished processing all bets.")
