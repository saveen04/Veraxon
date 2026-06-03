import { NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase-admin";

export async function POST(req) {
  try {
    const {
      uid,
      collegeName,
      department,
      year,
      registerNumber,
      staffId,
      subjectHandling,
    } = await req.json();

    if (!uid || !collegeName || !department) {
      return NextResponse.json(
        { error: "UID, College Name and Department are required" },
        { status: 400 },
      );
    }

    const db = getAdminFirestore();
    const userRef = db.collection("users").doc(uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const updateData = {
      collegeName,
      department,
      profileCompleted: true,
    };
    if (year !== undefined) updateData.year = year;
    if (registerNumber !== undefined)
      updateData.registerNumber = registerNumber;
    if (staffId !== undefined) updateData.staffId = staffId;
    if (subjectHandling !== undefined)
      updateData.subjectHandling = subjectHandling;

    await userRef.update(updateData);

    const updatedData = (await userRef.get()).data();

    return NextResponse.json({
      success: true,
      user: {
        id: uid,
        name: updatedData.username || updatedData.name || "",
        email: updatedData.email,
        role: updatedData.role,
        collegeName: updatedData.collegeName,
        department: updatedData.department,
      },
    });
  } catch (error) {
    console.error("Update Profile API Error:", error);
    return NextResponse.json(
      { error: "Internal server error during profile update" },
      { status: 500 },
    );
  }
}
