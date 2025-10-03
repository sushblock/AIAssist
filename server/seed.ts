import { db } from "./db";
import {
  organizations,
  users,
  matters,
  hearings,
  parties,
  courtAlerts,
  timeEntries,
  expenses,
} from "@shared/schema";

function cleanData(data: Record<string, any>) {
  const cleaned: any = {};
  for (const [key, value] of Object.entries(data)) {
    cleaned[key] = value === undefined ? null : value;
  }
  return cleaned;
}

(async function seed() {
  try {
    if (!process.env.DATABASE_URL) {
      console.error("DATABASE_URL is not set. Set it and re-run the script.");
      process.exit(1);
    }

    const existingOrgs = await db.select().from(organizations).limit(1);
    if (existingOrgs.length > 0) {
      console.log("Database already seeded");
      process.exit(0);
    }

    console.log("Seeding database...");

    const [org] = await db.insert(organizations).values(cleanData({
      name: "Kumar & Associates",
      type: "chambers",
      bcisafeMode: true,
      state: "Delhi",
      gstNumber: "07AAAAA0000A1Z5",
      settings: {},
    })).returning();

    const [user] = await db.insert(users).values(cleanData({
      orgId: org.id,
      username: "adv.kumar",
      email: "kumar@example.com",
      name: "Adv. Kumar",
      role: "owner",
      barCouncilId: "D/1234/2015",
      phone: "+91 98765 43210",
      settings: {},
    })).returning();

    const [matter1] = await db.insert(matters).values(cleanData({
      orgId: org.id,
      caseNo: "CS 234/2024",
      filingNo: "12345/2024",
      title: "Sharma vs. Verma & Ors.",
      court: "Delhi High Court",
      forum: "Civil Side",
      judge: "Justice Mehta",
      subject: "Contract Dispute",
      stage: "Arguments",
      status: "active",
      priority: "high",
      leadCounselId: user.id,
      cnrNumber: "DLHC010123452024",
      tags: ["commercial", "contract"],
      nextHearingDate: new Date("2025-01-14T10:00:00Z"),
      filingDate: new Date("2024-01-15"),
      metadata: {},
    })).returning();

    const [matter2] = await db.insert(matters).values(cleanData({
      orgId: org.id,
      caseNo: "W.P.(C) 7890/2024",
      filingNo: "78901/2024",
      title: "Kumar vs. Union of India",
      court: "Delhi High Court",
      forum: "Constitutional Bench",
      judge: "Justice Patel",
      subject: "Service Matter",
      stage: "Notice Stage",
      status: "active",
      priority: "medium",
      leadCounselId: user.id,
      cnrNumber: "DLHC010789012024",
      tags: ["service", "government"],
      nextHearingDate: new Date("2025-01-28T11:30:00Z"),
      filingDate: new Date("2024-02-01"),
      metadata: {},
    })).returning();

    await db.insert(hearings).values(cleanData({
      orgId: org.id,
      matterId: matter1.id,
      date: new Date("2025-01-14T10:00:00Z"),
      time: "10:00 AM",
      court: "Delhi High Court",
      judge: "Justice Mehta",
      bench: "Court No. 5",
      purpose: "Arguments on IA 4567/2024",
      result: "",
      nextDate: null,
      notes: "",
      status: "scheduled",
      metadata: {},
    }));

    await db.insert(parties).values(cleanData({
      orgId: org.id,
      matterId: matter1.id,
      name: "Mr. Manoj Sharma",
      role: "petitioner",
      type: "client",
      email: "manoj.s@example.com",
      phone: "+91 98765 43210",
      address: "123 Main Street, Delhi",
      state: "Delhi",
      panNumber: "ABCDE1234F",
      aadharNumber: null,
      metadata: {},
    }));

    await db.insert(courtAlerts).values(cleanData({
      orgId: org.id,
      matterId: matter1.id,
      type: "deadline_approaching",
      title: "Filing Deadline",
      message: "Reply affidavit due in 3 days for CS 234/2024",
      urgency: "high",
      source: "ai_detected",
      actionRequired: true,
      dueDate: new Date("2025-01-17"),
      resolvedAt: null,
      metadata: {},
    }));

    await db.insert(timeEntries).values([
      cleanData({
        orgId: org.id,
        matterId: matter1.id,
        userId: user.id,
        description: "Drafted petition and reviewed legal precedents",
        duration: 180,
        rate: "5000",
        isBillable: true,
        startTime: new Date("2024-12-15T10:00:00Z"),
        endTime: new Date("2024-12-15T13:00:00Z"),
        metadata: {},
      }),
      cleanData({
        orgId: org.id,
        matterId: matter1.id,
        userId: user.id,
        description: "Court appearance and arguments",
        duration: 120,
        rate: "8000",
        isBillable: true,
        startTime: new Date("2024-12-20T11:00:00Z"),
        endTime: new Date("2024-12-20T13:00:00Z"),
        metadata: {},
      })
    ]);

    await db.insert(expenses).values([
      cleanData({
        orgId: org.id,
        matterId: matter1.id,
        userId: user.id,
        category: "Court Fees",
        description: "Filing fees for petition",
        amount: "2500",
        tax: "0",
        receipt: null,
        date: new Date("2024-12-10"),
        isBillable: true,
        metadata: {},
      }),
      cleanData({
        orgId: org.id,
        matterId: matter1.id,
        userId: user.id,
        category: "Travel",
        description: "Travel to court for hearing",
        amount: "1500",
        tax: "0",
        receipt: null,
        date: new Date("2024-12-20"),
        isBillable: true,
        metadata: {},
      })
    ]);

    console.log("Database seeded successfully");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
})();
