/**
 * Creates a repeatable two-week LiftWOD demo dataset in the linked project.
 * The range is Bangkok today - 7 days through today + 6 days.
 *
 * Run: npm run demo:seed
 */
import { createHash } from "node:crypto";
import {
  DEMO_PASSWORD,
  PROTECTED_ADMIN_EMAIL,
  clearScopedDemoData,
  createAdminClient,
  listAllAuthUsers,
  type AdminClient,
} from "./demo-shared.ts";

type DemoUser = {
  key: string;
  email: string;
  fullName: string;
  nickname: string;
  role: "member" | "coach";
  approved: boolean;
  language: "th" | "en";
};

type UserWithId = DemoUser & { id: string };

const ATHLETE_NAMES = [
  ["Mali Srisuk", "Mali"],
  ["Niran Chaiyaporn", "Niran"],
  ["Pimchanok Dee", "Pim"],
  ["Aran Kittikul", "Aran"],
  ["Kanya Boonmee", "Kanya"],
  ["Somchai Rattanakorn", "Somchai"],
  ["Nicha Wongsa", "Nicha"],
  ["Thanawat Prasert", "Than"],
  ["Siriporn Kaew", "Siri"],
  ["Krit Sombat", "Krit"],
  ["Ploy Chantarangsu", "Ploy"],
  ["Anan Saelim", "Anan"],
  ["Mayuree Inthanon", "May"],
  ["Chaiwat Sukjai", "Chai"],
  ["Fern Nakarin", "Fern"],
  ["Patiphan Kham", "Pat"],
  ["Jintana Roj", "Jin"],
  ["Warin Phrom", "Warin"],
  ["Dao Saetang", "Dao"],
  ["Ben Carter", "Ben"],
  ["Emma Wilson", "Emma"],
  ["Lucas Martin", "Lucas"],
  ["Sofia Garcia", "Sofia"],
  ["Daniel Kim", "Daniel"],
  ["Aom Pending", "Aom"],
] as const;

const ATHLETES: DemoUser[] = ATHLETE_NAMES.map(([fullName, nickname], index) => ({
  key: `athlete${String(index + 1).padStart(2, "0")}`,
  email: `athlete${String(index + 1).padStart(2, "0")}@demo.liftwod`,
  fullName,
  nickname,
  role: "member",
  approved: index !== 24,
  language: index % 3 === 0 ? "en" : "th",
}));

const COACHES: DemoUser[] = [
  {
    key: "coach01",
    email: "coach01@demo.liftwod",
    fullName: "Ananda Suksan",
    nickname: "Coach Ananda",
    role: "coach",
    approved: true,
    language: "th",
  },
  {
    key: "coach02",
    email: "coach02@demo.liftwod",
    fullName: "Benjawan Kiet",
    nickname: "Coach Bee",
    role: "coach",
    approved: true,
    language: "th",
  },
  {
    key: "coach03",
    email: "coach03@demo.liftwod",
    fullName: "Michael Turner",
    nickname: "Coach Mike",
    role: "coach",
    approved: true,
    language: "en",
  },
];

const DEMO_USERS = [...ATHLETES, ...COACHES];

function stableUuid(label: string) {
  const hex = createHash("sha256")
    .update(`liftwod-demo:${label}`)
    .digest("hex")
    .split("");
  hex[12] = "4";
  hex[16] = ((Number.parseInt(hex[16], 16) & 3) | 8).toString(16);
  const value = hex.join("");
  return `${value.slice(0, 8)}-${value.slice(8, 12)}-${value.slice(12, 16)}-${value.slice(16, 20)}-${value.slice(20, 32)}`;
}

function bangkokToday() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function addDays(date: string, days: number) {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

function bkkIso(date: string, time: string) {
  return new Date(`${date}T${time}:00+07:00`).toISOString();
}

function addMinutes(iso: string, minutes: number) {
  return new Date(new Date(iso).getTime() + minutes * 60_000).toISOString();
}

async function checked<T extends { error: unknown }>(
  operation: PromiseLike<T>,
  label: string,
): Promise<T> {
  const result = await operation;
  if (result.error) {
    const detail =
      result.error instanceof Error
        ? result.error.message
        : JSON.stringify(result.error);
    throw new Error(`${label}: ${detail}`);
  }
  return result;
}

async function insertRows(
  client: AdminClient,
  table: string,
  rows: Record<string, unknown>[],
) {
  if (rows.length === 0) return;
  await checked(client.from(table).insert(rows), `insert ${table}`);
}

async function ensureDemoUsers(client: AdminClient, adminId: string) {
  const authUsers = await listAllAuthUsers(client);
  const byEmail = new Map(authUsers.map((user) => [user.email, user]));
  const users: UserWithId[] = [];

  for (const demo of DEMO_USERS) {
    let authUser = byEmail.get(demo.email);
    if (!authUser) {
      const { data, error } = await client.auth.admin.createUser({
        email: demo.email,
        password: DEMO_PASSWORD,
        email_confirm: true,
        user_metadata: {
          full_name: demo.fullName,
          preferred_language: demo.language,
        },
      });
      if (error) throw error;
      authUser = data.user;
      console.log(`created ${demo.email}`);
    } else {
      const { error } = await client.auth.admin.updateUserById(authUser.id, {
        password: DEMO_PASSWORD,
        user_metadata: {
          full_name: demo.fullName,
          preferred_language: demo.language,
        },
      });
      if (error) throw error;
      console.log(`reset   ${demo.email}`);
    }

    users.push({ ...demo, id: authUser.id });
  }

  await clearScopedDemoData(client, { deleteUsers: false });

  for (const [index, user] of users.entries()) {
    const createdDaysAgo = user.approved ? 90 - ((index * 7) % 88) : 0;
    await checked(
      client
        .from("profiles")
        .update({
          role: user.role,
          full_name: user.fullName,
          nickname: user.nickname,
          email: user.email,
          phone: `+66 8${String(10000000 + index).slice(-8)}`,
          preferred_language: user.language,
          approved_at: user.approved ? new Date().toISOString() : null,
          approved_by: user.approved ? adminId : null,
          is_active: true,
          created_at: addDays(bangkokToday(), -createdDaysAgo),
        })
        .eq("id", user.id),
      `update profile ${user.email}`,
    );
  }

  return users;
}

function rotate<T>(values: T[], start: number, count: number) {
  return Array.from({ length: Math.min(count, values.length) }, (_, index) =>
    values[(start + index) % values.length],
  );
}

async function main() {
  const client = createAdminClient();
  const today = bangkokToday();

  const { data: admin } = await checked(
    client
      .from("profiles")
      .select("id, email, role")
      .eq("email", PROTECTED_ADMIN_EMAIL)
      .single(),
    "find protected admin",
  );
  if (!admin || admin.role !== "admin") {
    throw new Error(`Protected admin ${PROTECTED_ADMIN_EMAIL} is missing`);
  }

  console.log(`Seeding ${addDays(today, -7)} through ${addDays(today, 6)}...`);
  const users = await ensureDemoUsers(client, admin.id);
  const athletes = users.filter((user) => user.role === "member");
  const coaches = users.filter((user) => user.role === "coach");
  const approvedUsers = users.filter((user) => user.approved);
  const userByKey = new Map(users.map((user) => [user.key, user]));

  const [{ data: locations }, { data: plans }, { data: exercises }, { data: benchmarks }] =
    await Promise.all([
      checked(client.from("locations").select("id, name").eq("is_active", true), "load locations"),
      checked(client.from("membership_plans").select("*").eq("is_active", true), "load plans"),
      checked(client.from("exercises").select("id, name_en"), "load exercises"),
      checked(client.from("benchmarks").select("id, name, score_type"), "load benchmarks"),
    ]);

  const location = locations?.[0];
  if (!location) throw new Error("No active location found");
  const locationId = location.id;
  const planByType = new Map((plans ?? []).map((plan) => [plan.plan_type, plan]));
  const exerciseByName = new Map(
    (exercises ?? []).map((exercise) => [exercise.name_en, exercise]),
  );
  const benchmarkByName = new Map(
    (benchmarks ?? []).map((benchmark) => [benchmark.name, benchmark]),
  );

  const memberships: Record<string, unknown>[] = [];
  const payments: Record<string, unknown>[] = [];
  const membershipByUser = new Map<string, string>();

  for (const [index, user] of users.entries()) {
    if (!user.approved || user.key === "athlete23") continue;

    const isExpired = user.key === "athlete22";
    const isExpiring = user.key === "athlete21";
    const isVisitPack = user.key === "athlete20";
    const isWeekly = user.key === "athlete19";
    const planType = isVisitPack
      ? "visit_pack"
      : isWeekly
        ? "weekly_limited"
        : "unlimited";
    const plan = planByType.get(planType);
    if (!plan) throw new Error(`Missing ${planType} membership plan`);

    const id = stableUuid(`membership:${user.email}`);
    const startDate = addDays(today, isExpired ? -35 : -20 - (index % 12));
    const endDate =
      planType === "visit_pack"
        ? null
        : addDays(today, isExpired ? -1 : isExpiring ? 5 : 25 + (index % 18));
    memberships.push({
      id,
      member_id: user.id,
      plan_id: plan.id,
      start_date: startDate,
      end_date: endDate,
      visits_remaining: isVisitPack ? 4 : null,
      note: isExpired
        ? "Expired membership example"
        : isExpiring
          ? "Renewal due soon"
          : "Membership in good standing",
      created_by: admin.id,
      created_at: bkkIso(startDate, "10:00"),
    });
    membershipByUser.set(user.id, id);
    payments.push({
      id: stableUuid(`payment:${user.email}`),
      membership_id: id,
      amount_thb: plan.price_thb,
      paid_on: startDate,
      method: ["promptpay", "transfer", "cash"][index % 3],
      note: "Initial membership payment",
      recorded_by: admin.id,
      created_at: bkkIso(startDate, "10:05"),
    });
  }

  await insertRows(client, "memberships", memberships);
  await insertRows(client, "payments", payments);

  const holdUser = userByKey.get("athlete24");
  const holdMembership = holdUser && membershipByUser.get(holdUser.id);
  if (holdUser && holdMembership) {
    await insertRows(client, "holds", [
      {
        id: stableUuid("hold:athlete24"),
        membership_id: holdMembership,
        starts_on: addDays(today, 2),
        ends_on: addDays(today, 5),
        reason: "Traveling outside Chiang Rai",
        created_by: admin.id,
      },
    ]);
  }

  const recipes = [
    { title: "Fran Friday", benchmark: "Fran", score: "time", exercises: ["Thruster", "Pull-up"] },
    { title: "Squat & Shuttle", lift: "Back Squat", score: "rounds_reps", exercises: ["Air Squat", "Run"] },
    { title: "Deadlift Engine", lift: "Deadlift", score: "calories", exercises: ["Deadlift", "Assault Bike"] },
    { title: "Pressing Power", lift: "Strict Press", score: "reps", exercises: ["Strict Press", "Push-up"] },
    { title: "Cindy", benchmark: "Cindy", score: "rounds_reps", exercises: ["Pull-up", "Push-up", "Air Squat"] },
    { title: "Clean Sprint", lift: "Clean & Jerk", score: "time", exercises: ["Clean & Jerk", "Burpee"] },
    { title: "Front Squat & Row", lift: "Front Squat", score: "distance", exercises: ["Front Squat", "Row (Erg)"] },
    { title: "Fran Test Day", benchmark: "Fran", score: "time", exercises: ["Thruster", "Pull-up"] },
    { title: "Back Squat Builder", lift: "Back Squat", score: "rounds_reps", exercises: ["Box Jump", "Goblet Squat"] },
    { title: "Posterior Chain", lift: "Deadlift", score: "calories", exercises: ["Kettlebell Swing", "Ski Erg"] },
    { title: "Helen", benchmark: "Helen", score: "time", exercises: ["Run", "Kettlebell Swing", "Pull-up"] },
    { title: "Press & Pull", lift: "Strict Press", score: "reps", exercises: ["Strict Press", "Ring Row"] },
    { title: "Grace", benchmark: "Grace", score: "time", exercises: ["Clean & Jerk"] },
    { title: "Clean Carry", lift: "Clean & Jerk", score: "distance", exercises: ["Farmer Carry", "Clean"] },
  ] as const;

  const workouts: Record<string, unknown>[] = [];
  const components: Record<string, unknown>[] = [];
  const componentExercises: Record<string, unknown>[] = [];
  const workoutByDate = new Map<string, string>();
  const scoredComponentsByDate = new Map<
    string,
    { id: string; score: string; kind: "strength" | "metcon" }[]
  >();

  for (const [recipeIndex, recipe] of recipes.entries()) {
    const offset = recipeIndex - 7;
    const date = addDays(today, offset);
    const workoutId = stableUuid(`workout:${date}`);
    const coach = coaches[recipeIndex % coaches.length];
    const benchmark = "benchmark" in recipe
      ? benchmarkByName.get(recipe.benchmark)
      : null;
    if ("benchmark" in recipe && !benchmark) {
      throw new Error(`Missing benchmark ${recipe.benchmark}`);
    }

    workouts.push({
      id: workoutId,
      title: recipe.title,
      benchmark_id: benchmark?.id ?? null,
      scheduled_on: date,
      location_id: locationId,
      published: true,
      reveal_at: null,
      coach_notes:
        "Choose a sustainable pace. Scaling: reduce load, reps, or range of motion as needed.",
      created_by: coach.id,
      updated_by: coach.id,
      is_baseline: false,
      created_at: bkkIso(addDays(date, -2), "14:00"),
    });
    workoutByDate.set(date, workoutId);

    const warmupId = stableUuid(`component:${date}:warmup`);
    components.push({
      id: warmupId,
      workout_id: workoutId,
      position: 0,
      kind: "warmup",
      title: "Warm-up",
      description: "2 rounds: 200 m easy jog, 10 air squats, 10 pass-throughs, 30 sec plank.",
      score_type: "none",
    });

    const scored: { id: string; score: string; kind: "strength" | "metcon" }[] = [];
    if ("lift" in recipe) {
      const lift = exerciseByName.get(recipe.lift);
      if (!lift) throw new Error(`Missing exercise ${recipe.lift}`);
      const strengthId = stableUuid(`component:${date}:strength`);
      components.push({
        id: strengthId,
        workout_id: workoutId,
        position: 1,
        kind: "strength",
        title: recipe.lift,
        description: "Build to a technically sound heavy set of 3. Record the heaviest successful set.",
        score_type: "load",
      });
      componentExercises.push({
        component_id: strengthId,
        exercise_id: lift.id,
        position: 0,
      });
      scored.push({ id: strengthId, score: "load", kind: "strength" });
    }

    const metconId = stableUuid(`component:${date}:metcon`);
    components.push({
      id: metconId,
      workout_id: workoutId,
      position: 2,
      kind: "metcon",
      title: "Conditioning",
      description:
        recipe.score === "time"
          ? "Complete the programmed work for time. Cap: 15 minutes."
          : recipe.score === "rounds_reps"
            ? "AMRAP 15 minutes. Record completed rounds and additional reps."
            : recipe.score === "calories"
              ? "12-minute effort. Record total calories."
              : recipe.score === "distance"
                ? "12-minute effort. Record total distance in metres."
                : "Complete 5 quality rounds. Record total reps.",
      score_type: recipe.score,
    });
    scored.push({ id: metconId, score: recipe.score, kind: "metcon" });
    for (const [position, name] of recipe.exercises.entries()) {
      const exercise = exerciseByName.get(name);
      if (!exercise) throw new Error(`Missing exercise ${name}`);
      componentExercises.push({
        component_id: metconId,
        exercise_id: exercise.id,
        position,
      });
    }
    scoredComponentsByDate.set(date, scored);
  }

  await insertRows(client, "workouts", workouts);
  await insertRows(client, "workout_components", components);
  await insertRows(client, "workout_component_exercises", componentExercises);

  const sessionSlots = [
    { key: "morning", name: "Morning WOD", time: "06:30", duration: 60, capacity: 12 },
    { key: "lunch", name: "Lunch Express", time: "12:00", duration: 45, capacity: 10 },
    { key: "evening", name: "Evening WOD", time: "19:30", duration: 60, capacity: 10 },
  ] as const;
  const sessions: Record<string, unknown>[] = [];
  const sessionMeta: {
    id: string;
    date: string;
    offset: number;
    slot: (typeof sessionSlots)[number];
    startsAt: string;
    coachId: string;
  }[] = [];

  for (let offset = -7; offset <= 6; offset += 1) {
    const date = addDays(today, offset);
    for (const [slotIndex, slot] of sessionSlots.entries()) {
      const id = stableUuid(`session:${date}:${slot.key}`);
      const startsAt = bkkIso(date, slot.time);
      const coach = coaches[(offset + 7 + slotIndex) % coaches.length];
      sessions.push({
        id,
        location_id: locationId,
        template_id: null,
        session_date: date,
        starts_at: startsAt,
        ends_at: addMinutes(startsAt, slot.duration),
        name: slot.name,
        capacity: slot.capacity,
        coach_id: coach.id,
        status: "scheduled",
        workout_id: workoutByDate.get(date),
      });
      sessionMeta.push({ id, date, offset, slot, startsAt, coachId: coach.id });
    }
  }
  await insertRows(client, "class_sessions", sessions);

  const historicalPool = [
    ...athletes.slice(0, 17),
    athletes[19],
    athletes[20],
    athletes[21],
    athletes[23],
    ...coaches,
  ].filter(Boolean);
  const currentPool = [
    ...athletes.slice(4, 17),
    athletes[19],
    athletes[20],
    athletes[23],
    coaches[1],
  ].filter(Boolean);
  const futurePool = [
    ...athletes.slice(0, 21),
    athletes[23],
    ...coaches,
  ].filter(Boolean);

  const bookings: Record<string, unknown>[] = [];
  const attendance: Record<string, unknown>[] = [];
  const attendanceMembersByDate = new Map<string, Map<string, string>>();

  function addBooking(
    session: (typeof sessionMeta)[number],
    user: UserWithId,
    status: "booked" | "waitlisted" | "cancelled" | "late_cancelled",
    order: number,
  ) {
    const id = stableUuid(`booking:${session.id}:${user.id}:${status}`);
    bookings.push({
      id,
      session_id: session.id,
      member_id: user.id,
      status,
      booked_at: addMinutes(session.startsAt, -1440 + order),
      cancelled_at: status.includes("cancelled") ? addMinutes(session.startsAt, -180) : null,
      cancelled_by: status.includes("cancelled") ? user.id : null,
      created_at: addMinutes(session.startsAt, -1440 + order),
    });
    return id;
  }

  function addAttendance(
    session: (typeof sessionMeta)[number],
    user: UserWithId,
    bookingId: string | null,
    order: number,
  ) {
    const membershipId = membershipByUser.get(user.id);
    if (!membershipId) return;
    attendance.push({
      id: stableUuid(`attendance:${session.id}:${user.id}`),
      session_id: session.id,
      member_id: user.id,
      location_id: locationId,
      booking_id: bookingId,
      membership_id: membershipId,
      checked_in_at: addMinutes(session.startsAt, 2 + order),
      checked_in_by: order % 3 === 0 ? session.coachId : null,
    });
    const byMember = attendanceMembersByDate.get(session.date) ?? new Map();
    if (!byMember.has(user.id)) byMember.set(user.id, session.id);
    attendanceMembersByDate.set(session.date, byMember);
  }

  for (const [sessionIndex, session] of sessionMeta.entries()) {
    let booked: UserWithId[] = [];
    let waitlisted: UserWithId[] = [];
    let checkedIn: UserWithId[] = [];

    if (session.offset < 0) {
      booked = rotate(historicalPool, sessionIndex * 3, 7 + (sessionIndex % 4));
      checkedIn = booked;
    } else if (session.offset === 0 && session.slot.key !== "evening") {
      booked = rotate(currentPool, sessionIndex * 2, 8);
      checkedIn = booked;
    } else if (session.offset === 0 && session.slot.key === "evening") {
      booked = [
        athletes[0],
        athletes[3],
        coaches[0],
        ...athletes.slice(6, 13),
      ];
      waitlisted = [athletes[1], athletes[13], athletes[14]];
      checkedIn = [athletes[3]];
    } else {
      const eligiblePool =
        session.offset >= 2 && session.offset <= 5
          ? futurePool.filter((user) => user.key !== "athlete24")
          : futurePool;
      booked = rotate(eligiblePool, sessionIndex * 4, session.slot.capacity);
      waitlisted = rotate(
        eligiblePool.filter((user) => !booked.some((bookedUser) => bookedUser.id === user.id)),
        sessionIndex,
        2,
      );
    }

    const bookingIds = new Map<string, string>();
    booked.forEach((user, index) => {
      bookingIds.set(user.id, addBooking(session, user, "booked", index));
    });
    waitlisted.forEach((user, index) => {
      addBooking(session, user, "waitlisted", booked.length + index);
    });
    if (session.offset > 0) {
      const cancelled = futurePool[(sessionIndex + 11) % futurePool.length];
      addBooking(session, cancelled, "cancelled", booked.length + waitlisted.length + 1);
    }
    checkedIn.forEach((user, index) =>
      addAttendance(session, user, bookingIds.get(user.id) ?? null, index),
    );
  }

  await insertRows(client, "bookings", bookings);
  await insertRows(client, "attendance", attendance);

  // Insert one day at a time so PR triggers compare against earlier performances.
  let resultCount = 0;
  for (let offset = -7; offset <= 0; offset += 1) {
    const date = addDays(today, offset);
    const attended = attendanceMembersByDate.get(date) ?? new Map();
    const resultUsers =
      offset === 0
        ? [
            ...athletes.slice(4, 15),
            coaches[1],
          ].filter((user) => attended.has(user.id))
        : rotate(
            approvedUsers.filter((user) => attended.has(user.id)),
            offset + 7,
            10,
          );
    const dayComponents = scoredComponentsByDate.get(date) ?? [];
    const rows: Record<string, unknown>[] = [];

    for (const component of dayComponents) {
      for (const [userIndex, user] of resultUsers.entries()) {
        const row: Record<string, unknown> = {
          id: stableUuid(`result:${date}:${component.id}:${user.id}`),
          component_id: component.id,
          member_id: user.id,
          session_id:
            userIndex === resultUsers.length - 1 ? null : attended.get(user.id) ?? null,
          score_type: component.score,
          is_rx: userIndex % 3 !== 0,
          comment:
            userIndex % 5 === 0
              ? "Strong pacing and consistent movement."
              : null,
          entered_by:
            userIndex % 4 === 0
              ? coaches[(offset + 7 + userIndex) % coaches.length].id
              : null,
          achieved_on: date,
          created_at: bkkIso(date, "20:45"),
        };

        if (component.score === "load") {
          row.load_kg = 35 + userIndex * 2.5 + (offset + 7) * 1.25;
        } else if (component.score === "time") {
          row.time_seconds =
            (offset === -7 ? 300 : offset === 0 ? 265 : 330) + userIndex * 7;
        } else if (component.score === "rounds_reps") {
          row.rounds = 5 + ((userIndex + offset + 7) % 5);
          row.reps = (userIndex * 7 + offset + 21) % 30;
        } else if (component.score === "calories") {
          row.calories = 72 + userIndex * 3 + offset + 7;
        } else if (component.score === "distance") {
          row.distance_m = 2150 + userIndex * 85 + (offset + 7) * 20;
        } else if (component.score === "reps") {
          row.reps = 65 + userIndex * 4 + offset + 7;
        }
        rows.push(row);
      }
    }

    await insertRows(client, "results", rows);
    resultCount += rows.length;
  }

  const noteTargets = [
    ["athlete04", "Returning from a minor ankle irritation. Offer step-ups instead of box jumps."],
    ["athlete08", "Prefers English coaching cues and is working toward first pull-up."],
    ["athlete12", "Strong Olympic lifting background; watch shoulder position overhead."],
    ["athlete18", "Retention follow-up: no recent attendance. Send a friendly check-in."],
    ["athlete21", "Membership expires soon; discuss renewal after the next class."],
    ["athlete22", "Membership expired yesterday. Interested in a 10-visit punch card."],
    ["athlete23", "No membership yet. Completed an intro conversation with Coach Bee."],
    ["athlete24", "Upcoming travel hold is already recorded."],
  ] as const;
  const notes = noteTargets.map(([key, body], index) => ({
    id: stableUuid(`note:${key}`),
    member_id: userByKey.get(key)?.id,
    author_id: coaches[index % coaches.length].id,
    body,
    created_at: bkkIso(addDays(today, -(index % 6)), "15:00"),
  }));
  await insertRows(client, "notes", notes);

  const { count: prCount } = await checked(
    client
      .from("prs")
      .select("id", { count: "exact", head: true })
      .in("member_id", approvedUsers.map((user) => user.id)),
    "count demo PRs",
  );

  console.log("\nDemo dataset ready:");
  console.log(`  25 athlete accounts (24 active, 1 pending approval)`);
  console.log(`  3 coach accounts (all also have athlete activity)`);
  console.log(`  ${memberships.length} memberships and ${payments.length} payments`);
  console.log(`  ${sessions.length} classes across 14 Bangkok dates`);
  console.log(`  ${workouts.length} workouts and ${resultCount} results`);
  console.log(`  ${prCount ?? 0} generated PR records`);
  console.log(`\nPassword for every demo account: ${DEMO_PASSWORD}\n`);
  console.table(
    users.map((user) => ({
      login: user.email,
      role: user.role,
      state: user.approved ? "active" : "pending approval",
    })),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
