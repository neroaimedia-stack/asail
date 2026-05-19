"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type UserRole = "business" | "creator";

const roleDestinations: Record<UserRole, string> = {
  business: "/business/dashboard",
  creator: "/creator/dashboard",
};

function formValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function formValues(formData: FormData, key: string) {
  return formData
    .getAll(key)
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.trim())
    .filter(Boolean);
}

function redirectWithError(pathname: string, message: string): never {
  redirect(`${pathname}?error=${encodeURIComponent(message)}`);
}

async function createBusinessProfile({
  userId,
  fullName,
}: {
  userId: string;
  fullName: string;
}) {
  const supabase = createClient();

  const { error: profileError } = await supabase.from("profiles").upsert({
    id: userId,
    role: "business",
    full_name: fullName,
  });

  if (profileError) {
    throw profileError;
  }
}

async function createCreatorProfile({
  userId,
  fullName,
}: {
  userId: string;
  fullName: string;
}) {
  const supabase = createClient();

  const { error: profileError } = await supabase.from("profiles").upsert({
    id: userId,
    role: "creator",
    full_name: fullName,
  });

  if (profileError) {
    throw profileError;
  }
}

export async function login(formData: FormData) {
  const supabase = createClient();
  const email = formValue(formData, "email");
  const password = formValue(formData, "password");

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirectWithError("/auth/login", error.message);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirectWithError("/auth/login", "Unable to load your account.");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile?.role) {
    redirectWithError("/auth/login", "No profile role found for this account.");
  }

  const role = profile.role as UserRole;
  let destination = roleDestinations[role];

  if (!destination) {
    redirectWithError("/auth/login", "Unsupported account role.");
  }

  if (role === "business") {
    const { data: business } = await supabase
      .from("businesses")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!business) {
      destination = "/business/onboarding";
    }
  }

  if (role === "creator") {
    const { data: creator } = await supabase
      .from("creators")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!creator) {
      destination = "/creator/onboarding";
    }
  }

  revalidatePath("/", "layout");
  redirect(destination);
}

export async function signupBusiness(formData: FormData) {
  const supabase = createClient();
  const fullName = formValue(formData, "fullName");
  const email = formValue(formData, "email");
  const password = formValue(formData, "password");
  const businessName = formValue(formData, "businessName");
  const businessCategory = formValue(formData, "businessCategory");

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        role: "business",
        full_name: fullName,
        business_name: businessName,
        business_category: businessCategory,
      },
    },
  });

  if (error) {
    redirectWithError("/auth/signup/business", error.message);
  }

  if (data.user && data.session) {
    await createBusinessProfile({
      userId: data.user.id,
      fullName,
    });

    revalidatePath("/", "layout");
    redirect("/business/onboarding");
  }

  revalidatePath("/", "layout");
  redirect(
    "/auth/login?message=Check%20your%20email%20to%20confirm%20your%20business%20account.",
  );
}

export async function signupCreator(formData: FormData) {
  const supabase = createClient();
  const fullName = formValue(formData, "fullName");
  const email = formValue(formData, "email");
  const password = formValue(formData, "password");
  const socialHandle = formValue(formData, "socialHandle");
  const contentCategories = formValues(formData, "contentCategories");

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        role: "creator",
        full_name: fullName,
        social_handle: socialHandle,
        content_categories: contentCategories,
      },
    },
  });

  if (error) {
    redirectWithError("/auth/signup/creator", error.message);
  }

  if (data.user && data.session) {
    await createCreatorProfile({
      userId: data.user.id,
      fullName,
    });

    revalidatePath("/", "layout");
    redirect("/creator/onboarding");
  }

  revalidatePath("/", "layout");
  redirect(
    "/auth/login?message=Check%20your%20email%20to%20confirm%20your%20creator%20account.",
  );
}
