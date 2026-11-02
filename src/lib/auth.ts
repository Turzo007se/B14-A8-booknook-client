import { betterAuth } from "better-auth";
import { APIError } from "better-auth/api";
import { mongodbAdapter } from "@better-auth/mongo-adapter";
import { MongoClient } from "mongodb";
import { jwt } from "better-auth/plugins";
import { sendAuthEmail } from "@/lib/email";

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
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      await sendAuthEmail({
        to: user.email,
        subject: "Verify your new BookNook email address",
        text: `To finish changing your BookNook sign-in email, open this link:\n\n${url}\n\nIf you did not request this change, you can ignore this email.`,
      });
    },
    afterEmailVerification: async (user, request) => {
      // Better Auth verifies the signed token before invoking this callback.
      if (!request) return;
      const token = new URL(request.url).searchParams.get("token");
      const payloadPart = token?.split(".")[1];
      if (!payloadPart) return;
      try {
        const payload = JSON.parse(Buffer.from(payloadPart, "base64url").toString("utf8")) as {
          email?: unknown; updateTo?: unknown; requestType?: unknown;
        };
        if (payload.requestType !== "change-email-verification" || typeof payload.email !== "string"
          || typeof payload.updateTo !== "string" || payload.updateTo.toLowerCase() !== user.email.toLowerCase()) return;
        const oldEmail = payload.email.toLowerCase();
        const newEmail = user.email.toLowerCase();
        if (oldEmail === newEmail) return;
        await database.collection("books").updateMany({ addedBy: oldEmail }, { $set: { addedBy: newEmail } });
        await database.collection("borrows").updateMany({ email: oldEmail }, { $set: { email: newEmail } });
      } catch (error) {
        console.error("Could not update BookNook records after an email change.", error);
        throw error;
      }
    },
  },
  user: {
    changeEmail: {
      enabled: true,
      sendChangeEmailConfirmation: async ({ user, newEmail, url }) => {
        await sendAuthEmail({
          to: user.email,
          subject: "Approve your BookNook email change",
          text: `A request was made to change your BookNook sign-in email to ${newEmail}. Approve it by opening this link:\n\n${url}\n\nIf you did not request this change, ignore this email.`,
        });
      },
    },
    deleteUser: {
      enabled: true,
      beforeDelete: async (user) => {
        const email = user.email;
        const activeBorrowedByUser = await database.collection("borrows").countDocuments({ email, active: true });
        if (activeBorrowedByUser) {
          throw new APIError("BAD_REQUEST", {
            message: "Return the books you borrowed before deleting your account. Books you shared can stay in the collection anonymously.",
          });
        }
      },
      afterDelete: async (user) => {
        await database.collection("books").updateMany(
          { addedBy: user.email },
          { $set: { addedBy: "former-member", addedByName: "Former member" } },
        );
        await database.collection("borrows").deleteMany({ email: user.email });
      },
    },
  },
  socialProviders: process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
    ? { google: { clientId: process.env.GOOGLE_CLIENT_ID, clientSecret: process.env.GOOGLE_CLIENT_SECRET } }
    : {},
  plugins: [jwt()],
  trustedOrigins: [process.env.BETTER_AUTH_URL || "http://localhost:3000"],
});
