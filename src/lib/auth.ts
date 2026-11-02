import { betterAuth } from "better-auth";
import { APIError } from "better-auth/api";
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
  user: {
    deleteUser: {
      enabled: true,
      beforeDelete: async (user) => {
        const email = user.email;
        const ownedBooks = await database.collection("books").find({ addedBy: email }).project({ _id: 1 }).toArray();
        const bookIds = ownedBooks.map(book => book._id);
        const activeBorrowedByUser = await database.collection("borrows").countDocuments({ email, active: true });
        const activeLoansOnOwnedBooks = bookIds.length
          ? await database.collection("borrows").countDocuments({ bookId: { $in: bookIds }, active: true })
          : 0;
        if (activeBorrowedByUser || activeLoansOnOwnedBooks) {
          throw new APIError("BAD_REQUEST", {
            message: "Before deleting your account, return books you borrowed and wait for other readers to return books you shared.",
          });
        }
      },
      afterDelete: async (user) => {
        await database.collection("books").deleteMany({ addedBy: user.email });
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
