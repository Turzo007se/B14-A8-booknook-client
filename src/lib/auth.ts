import { betterAuth } from "better-auth";
import { mongodbAdapter } from "@better-auth/mongo-adapter";
import { MongoClient } from "mongodb";
import { jwt } from "better-auth/plugins";

if (process.env.NODE_ENV === "production" && !process.env.MONGODB_URI) {
  throw new Error("MONGODB_URI must be set in production.");
}
if (process.env.NODE_ENV === "production" && !process.env.BETTER_AUTH_SECRET) {
  throw new Error("BETTER_AUTH_SECRET must be set in production.");
}
const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/booknook";
const client = new MongoClient(uri);
const database = client.db(process.env.MONGODB_DATABASE || "booknook");

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  secret: process.env.BETTER_AUTH_SECRET || "dev-only-secret-change-before-deploy-123456",
  database: mongodbAdapter(database),
  emailAndPassword: { enabled: true },
  socialProviders: process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
    ? { google: { clientId: process.env.GOOGLE_CLIENT_ID, clientSecret: process.env.GOOGLE_CLIENT_SECRET } }
    : {},
  plugins: [jwt()],
  trustedOrigins: [process.env.BETTER_AUTH_URL || "http://localhost:3000"],
});
