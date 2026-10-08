"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import {
  endAdminSession,
  isAdmin,
  passwordMatches,
  startAdminSession,
} from "@/lib/admin-auth";
import { sendAccessEmail } from "@/lib/email";
import {
  getRegistration,
  isStatus,
  replaceAccessCode,
  setRegistrationStatus,
} from "@/lib/registrations";

export type LoginState = { error?: string };

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const password = String(formData.get("password") ?? "");
  if (!passwordMatches(password)) {
    await new Promise((resolve) => setTimeout(resolve, 1000)); // slow down guessing
    return { error: "That password isn't right." };
  }
  await startAdminSession();
  revalidatePath("/admin");
  return {};
}

export async function logout() {
  await endAdminSession();
  revalidatePath("/admin");
}

export async function updateStatus(formData: FormData) {
  if (!(await isAdmin())) throw new Error("Not signed in.");
  const id = String(formData.get("id") ?? "");
  const status = formData.get("status");
  if (!isStatus(status)) throw new Error("Unknown status.");
  const before = await getRegistration(id);
  const updated = await setRegistrationStatus(id, status);
  // Newly granted: email the access code (only if EMAIL_FROM is set).
  if (updated && status === "granted" && before?.status !== "granted") {
    after(() => sendAccessEmail(updated));
  }
  revalidatePath("/admin");
}

/** New access code for a granted member: the old one stops working. */
export async function replaceCode(formData: FormData) {
  if (!(await isAdmin())) throw new Error("Not signed in.");
  const id = String(formData.get("id") ?? "");
  const before = await getRegistration(id);
  const updated = await replaceAccessCode(id);
  if (updated) after(() => sendAccessEmail(updated, { newCode: Boolean(before?.accessCode) }));
  revalidatePath("/admin");
}
