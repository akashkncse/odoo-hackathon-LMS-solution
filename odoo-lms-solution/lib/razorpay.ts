import Razorpay from "razorpay";

/**
 * Razorpay key ID (public) — safe to expose to the client.
 * Used when opening the Razorpay checkout modal.
 */
export const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || "";

let _instance: Razorpay | null = null;

/**
 * Lazily create and return a Razorpay server-side instance.
 *
 * The instance is only constructed on the first call, so the build
 * won't crash when env vars are missing (e.g. during `next build`
 * static analysis). If the credentials are absent at runtime, this
 * function throws a descriptive error instead of the SDK's generic one.
 */
export function getRazorpay(): Razorpay {
  if (_instance) return _instance;

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error(
      "Razorpay credentials are not configured. " +
        "Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in your environment.",
    );
  }

  _instance = new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });

  return _instance;
}
