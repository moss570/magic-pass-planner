import { loadStripe } from "@stripe/stripe-js";

const STRIPE_PUBLISHABLE_KEY = "pk_test_51TIFOFHGyELqjZIImhG0cCMHqXhuqX4riZiYXgBk3wc6Hs8wu795iEs0dYtRf9LxQTsxeZoC5rZIBMNQwUf5D1Nf00mSuzKng3";

export const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);

export const PRICE_IDS: Record<string, { monthly: string; annual: string }> = {
  "Pre-Trip Planner": {
    monthly: "price_1TIFQjHGyELqjZIIWYcXXufY",
    annual: "price_1TIFRRHGyELqjZIIgxUOhMUF",
  },
  "Magic Pass": {
    monthly: "price_1TIFRwHGyELqjZIIy7UMYR2U",
    annual: "price_1TIFSLHGyELqjZIIZ8Jw8MP2",
  },
  "AP Command Center": {
    monthly: "price_1TIFSwHGyELqjZII9yTjfkYd",
    annual: "price_1TIFTMHGyELqjZIIwZqYxeUt",
  },
  "AP Command Center PLUS": {
    monthly: "price_1TIFTqHGyELqjZII0qpW5oiT",
    annual: "price_1TIFUJHGyELqjZIIs9kh5fxU",
  },
};
