type TrackEvent =
  | "trip_create"
  | "expense_create"
  | "sub_trip_create"
  | "settle_share"
  | "traveler_add";

export const track = (
  event: TrackEvent,
  props: Record<string, any> = {},
) => {
  try {
    console.log("[track]", event, props);
  } catch {
    // no-op
  }
};
